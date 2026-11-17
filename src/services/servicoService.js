import Servico from "../models/servico.js";
import TipoServico from "../models/tipoServico.js";
import Conta from "../models/conta.js";
import { resolveClienteECarro } from "./clienteService.js";
import { badRequest, notFound, searchRegex, toObjectId } from "../libs/api.js";
import { round2, splitAmount } from "../libs/money.js";
import {
  addMonthsDateOnly,
  getFiscalMonthRange,
  toDateOnly,
  toYmd,
} from "../libs/dates.js";

const POPULATE = [
  { path: "tipoServico" },
  { path: "participantes", select: "name email" },
  { path: "parcelas.conta", select: "nome tipo" },
  { path: "clienteRef", select: "nome telefone" },
  { path: "carroRef", select: "modelo placa cor" },
];

const MAX_PARCELAS = 48;

// ---------------------------------------------------------------------------
// Parcelas
// ---------------------------------------------------------------------------

/**
 * Monta a lista de parcelas preservando as já pagas.
 * - Sem parcelas pagas: gera tudo do zero.
 * - Com parcelas pagas: mantém as pagas e redistribui o restante nas não pagas.
 */
export function buildParcelas({
  valorTotal,
  formaPagamento,
  numParcelas,
  primeiroVencimento,
  existing = [],
}) {
  const total = round2(valorTotal);
  const n =
    formaPagamento === "parcelado"
      ? Math.min(MAX_PARCELAS, Math.max(1, parseInt(numParcelas, 10) || 1))
      : 1;
  const first = toDateOnly(primeiroVencimento);
  if (!first) throw badRequest("Data do primeiro vencimento inválida");

  const pagas = existing
    .filter((p) => p.pago)
    .map((p) => (p.toObject ? p.toObject() : { ...p }));
  // À vista já recebido: corrigir o valor apenas ajusta a própria parcela
  if (n === 1 && existing.length === 1 && pagas.length === 1) {
    return [{ ...pagas[0], valor: total, numero: 1 }];
  }

  const pagoTotal = round2(pagas.reduce((acc, p) => acc + p.valor, 0));
  const restante = round2(total - pagoTotal);

  if (restante < 0) {
    throw badRequest(
      `O valor do serviço não pode ser menor que o já recebido (${pagoTotal.toFixed(2)})`,
    );
  }

  const naoPagasCount = n - pagas.length;
  if (restante > 0 && naoPagasCount < 1) {
    throw badRequest(
      "Todas as parcelas já foram recebidas. Aumente o número de parcelas para cobrar o valor restante.",
    );
  }

  const novas = [];
  if (restante > 0) {
    const valores = splitAmount(restante, naoPagasCount);
    // Vencimentos: mantém o calendário a partir do primeiro vencimento,
    // pulando as posições já ocupadas por parcelas pagas.
    for (let i = 0; i < naoPagasCount; i++) {
      novas.push({
        valor: valores[i],
        vencimento: addMonthsDateOnly(first, pagas.length + i),
        pago: false,
        dataPagamento: null,
        conta: null,
      });
    }
  }

  return [...pagas, ...novas]
    .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))
    .map((p, idx) => ({ ...p, numero: idx + 1 }));
}

function syncPago(servico) {
  servico.pago =
    servico.parcelas.length > 0 && servico.parcelas.every((p) => p.pago);
}

async function assertConta(contaId) {
  const id = toObjectId(contaId, "Conta");
  const conta = await Conta.findById(id).lean();
  if (!conta) throw badRequest("Conta não encontrada");
  if (!conta.ativa) throw badRequest("Conta inativa");
  return id;
}

// ---------------------------------------------------------------------------
// Validação / normalização do payload
// ---------------------------------------------------------------------------

async function normalizePayload(data, current = null) {
  const semTipo = Boolean(data.semTipo ?? current?.semTipo ?? false);
  let tipo = null;
  const tipoId = semTipo
    ? null
    : (data.tipoServico ?? current?.tipoServico?._id ?? current?.tipoServico);

  if (!semTipo) {
    if (!tipoId) throw badRequest("Selecione o tipo de serviço");
    tipo = await TipoServico.findById(toObjectId(tipoId, "Tipo de serviço"));
    if (!tipo) throw badRequest("Tipo de serviço não encontrado");
  }

  const rawPersonalizado =
    data.valorPersonalizado !== undefined
      ? data.valorPersonalizado
      : current?.valorPersonalizado;
  const valorPersonalizado =
    rawPersonalizado === "" || rawPersonalizado == null
      ? null
      : round2(rawPersonalizado);

  if (valorPersonalizado != null && valorPersonalizado < 0) {
    throw badRequest("Valor não pode ser negativo");
  }
  if (semTipo && valorPersonalizado == null) {
    throw badRequest("Informe o valor quando o serviço não tem tipo");
  }

  const valorTotal = valorPersonalizado ?? round2(tipo?.valor ?? 0);
  const data_ = toDateOnly(data.data ?? current?.data);
  if (!data_) throw badRequest("Data do serviço inválida");

  const participantes = (data.participantes ?? current?.participantes ?? [])
    .map((p) => (typeof p === "object" && p?._id ? p._id : p))
    .map((p) => toObjectId(p, "Participante"));

  const formaPagamento =
    data.formaPagamento ?? current?.formaPagamento ?? "avista";
  if (!["avista", "parcelado"].includes(formaPagamento)) {
    throw badRequest("Forma de pagamento inválida");
  }
  const numParcelas =
    formaPagamento === "parcelado"
      ? parseInt(data.numParcelas ?? current?.parcelas?.length ?? 2, 10)
      : 1;
  if (
    formaPagamento === "parcelado" &&
    (numParcelas < 2 || numParcelas > MAX_PARCELAS)
  ) {
    throw badRequest(`Parcelado deve ter entre 2 e ${MAX_PARCELAS} parcelas`);
  }

  return {
    semTipo,
    tipoServico: semTipo ? null : tipo._id,
    valorPersonalizado,
    valorTotal,
    data: data_,
    participantes,
    formaPagamento,
    numParcelas,
    primeiroVencimento:
      formaPagamento === "parcelado"
        ? toDateOnly(data.primeiroVencimento) ||
          current?.parcelas?.[0]?.vencimento ||
          data_
        : data_,
    obs: data.obs ?? current?.obs ?? "",
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getServicoById(id) {
  const servico = await Servico.findById(toObjectId(id))
    .populate(POPULATE)
    .lean();
  return servico;
}

export async function createServico(data) {
  const n = await normalizePayload(data);
  const { cliente, carro } = await resolveClienteECarro(data);

  const parcelas = buildParcelas({
    valorTotal: n.valorTotal,
    formaPagamento: n.formaPagamento,
    numParcelas: n.numParcelas,
    primeiroVencimento: n.primeiroVencimento,
  });

  // Pagamento à vista registrado já na criação
  if (data.pagamento?.conta && n.formaPagamento === "avista") {
    const conta = await assertConta(data.pagamento.conta);
    parcelas[0].pago = true;
    parcelas[0].conta = conta;
    parcelas[0].dataPagamento =
      toDateOnly(data.pagamento.data) || toDateOnly(new Date());
  }

  const servico = new Servico({
    cliente: cliente.nome,
    nomeCarro: carro.modelo,
    clienteRef: cliente._id,
    carroRef: carro._id,
    semTipo: n.semTipo,
    tipoServico: n.tipoServico,
    valorPersonalizado: n.valorPersonalizado,
    valorTotal: n.valorTotal,
    data: n.data,
    participantes: n.participantes,
    formaPagamento: n.formaPagamento,
    parcelas,
    obs: n.obs,
  });
  syncPago(servico);
  await servico.save();
  return getServicoById(servico._id);
}

export async function updateServico(id, data) {
  const servico = await Servico.findById(toObjectId(id));
  if (!servico) throw notFound("Serviço não encontrado");

  const n = await normalizePayload(data, servico.toObject());

  if (data.clienteId || data.clienteNome || data.carroId || data.carroModelo) {
    const { cliente, carro } = await resolveClienteECarro(data);
    servico.cliente = cliente.nome;
    servico.nomeCarro = carro.modelo;
    servico.clienteRef = cliente._id;
    servico.carroRef = carro._id;
  }

  const prevFirst = toYmd(servico.parcelas?.[0]?.vencimento);
  const precisaRecalcular =
    round2(servico.valorTotal ?? -1) !== n.valorTotal ||
    servico.formaPagamento !== n.formaPagamento ||
    servico.parcelas.length !== n.numParcelas ||
    (n.formaPagamento === "parcelado" &&
      toYmd(n.primeiroVencimento) !== prevFirst) ||
    (n.formaPagamento === "avista" &&
      !servico.parcelas[0]?.pago &&
      toYmd(n.data) !== prevFirst);

  if (precisaRecalcular) {
    servico.parcelas = buildParcelas({
      valorTotal: n.valorTotal,
      formaPagamento: n.formaPagamento,
      numParcelas: n.numParcelas,
      primeiroVencimento: n.primeiroVencimento,
      existing: servico.parcelas,
    });
  }

  servico.semTipo = n.semTipo;
  servico.tipoServico = n.tipoServico;
  servico.valorPersonalizado = n.valorPersonalizado;
  servico.valorTotal = n.valorTotal;
  servico.data = n.data;
  servico.participantes = n.participantes;
  servico.formaPagamento = n.formaPagamento;
  servico.obs = n.obs;
  syncPago(servico);
  await servico.save();
  return getServicoById(servico._id);
}

export async function deleteServico(id) {
  const result = await Servico.findByIdAndDelete(toObjectId(id));
  if (!result) throw notFound("Serviço não encontrado");
  return result;
}

/**
 * Registra recebimento.
 * - parcelaId: paga uma parcela específica
 * - sem parcelaId: paga todas as parcelas em aberto
 */
export async function pagarServico(id, { parcelaId, conta, data }) {
  const servico = await Servico.findById(toObjectId(id));
  if (!servico) throw notFound("Serviço não encontrado");
  const contaId = await assertConta(conta);
  const dataPagamento = toDateOnly(data) || toDateOnly(new Date());

  const alvo = parcelaId
    ? servico.parcelas.filter((p) => String(p._id) === String(parcelaId))
    : servico.parcelas.filter((p) => !p.pago);
  if (alvo.length === 0) throw badRequest("Nenhuma parcela em aberto");

  for (const p of alvo) {
    p.pago = true;
    p.conta = contaId;
    p.dataPagamento = dataPagamento;
  }
  syncPago(servico);
  await servico.save();
  return getServicoById(servico._id);
}

/** Desfaz recebimento de uma parcela (ou de todas, sem parcelaId). */
export async function estornarServico(id, { parcelaId }) {
  const servico = await Servico.findById(toObjectId(id));
  if (!servico) throw notFound("Serviço não encontrado");
  const alvo = parcelaId
    ? servico.parcelas.filter((p) => String(p._id) === String(parcelaId))
    : servico.parcelas.filter((p) => p.pago);
  if (alvo.length === 0) throw badRequest("Nenhuma parcela recebida");
  for (const p of alvo) {
    p.pago = false;
    p.conta = null;
    p.dataPagamento = null;
  }
  syncPago(servico);
  await servico.save();
  return getServicoById(servico._id);
}

// ---------------------------------------------------------------------------
// Listagem com filtros + estatísticas do conjunto filtrado inteiro
// ---------------------------------------------------------------------------

export function buildServicoMatch(searchParams, fiscalStart) {
  const match = {};
  const and = [];

  const rx = searchRegex(searchParams.get("q"));
  if (rx) and.push({ $or: [{ cliente: rx }, { nomeCarro: rx }] });

  const status = searchParams.get("status");
  const hoje = toDateOnly(new Date());
  if (status === "pago") match.pago = true;
  if (status === "pendente") match.pago = { $ne: true };
  if (status === "atrasado") {
    match.parcelas = {
      $elemMatch: { pago: false, vencimento: { $lt: hoje } },
    };
  }
  const forma = searchParams.get("forma");
  if (forma === "parcelado" || forma === "avista") {
    match.formaPagamento =
      forma === "avista" ? { $ne: "parcelado" } : "parcelado";
  }

  const tipo = searchParams.get("tipoServico");
  if (tipo === "sem-tipo") match.semTipo = true;
  else if (tipo) match.tipoServico = toObjectId(tipo, "Tipo de serviço");

  const participante = searchParams.get("participante");
  if (participante)
    match.participantes = toObjectId(participante, "Participante");

  const cliente = searchParams.get("clienteId");
  if (cliente) match.clienteRef = toObjectId(cliente, "Cliente");
  const carro = searchParams.get("carroId");
  if (carro) match.carroRef = toObjectId(carro, "Veículo");

  const conta = searchParams.get("conta");
  if (conta) match["parcelas.conta"] = toObjectId(conta, "Conta");

  const mes = searchParams.get("mes");
  const dataInicio = toDateOnly(searchParams.get("dataInicio"));
  const dataFim = toDateOnly(searchParams.get("dataFim"));
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const { start, end } = getFiscalMonthRange(mes, fiscalStart);
    match.data = { $gte: start, $lt: end };
  } else if (dataInicio || dataFim) {
    match.data = {};
    if (dataInicio)
      match.data.$gte = new Date(dataInicio.getTime() - 12 * 3600e3);
    if (dataFim) match.data.$lt = new Date(dataFim.getTime() + 12 * 3600e3);
  }

  if (and.length) match.$and = and;
  return match;
}

// Valor do serviço com fallback para registros não migrados
const VALOR_EXPR = {
  $ifNull: ["$valorTotal", { $ifNull: ["$valorPersonalizado", 0] }],
};

export async function listServicos({ match, page, limit, skip }) {
  const hoje = toDateOnly(new Date());
  const [data, statsAgg] = await Promise.all([
    Servico.find(match)
      .sort({ data: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    Servico.aggregate([
      { $match: match },
      {
        $project: {
          valor: VALOR_EXPR,
          recebido: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$parcelas", []] } }, 0] },
              {
                $sum: {
                  $map: {
                    input: "$parcelas",
                    as: "p",
                    in: { $cond: ["$$p.pago", "$$p.valor", 0] },
                  },
                },
              },
              { $cond: ["$pago", VALOR_EXPR, 0] },
            ],
          },
          atrasado: {
            $sum: {
              $map: {
                input: { $ifNull: ["$parcelas", []] },
                as: "p",
                in: {
                  $cond: [
                    {
                      $and: [
                        { $not: ["$$p.pago"] },
                        { $lt: ["$$p.vencimento", hoje] },
                      ],
                    },
                    "$$p.valor",
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          valorTotal: { $sum: "$valor" },
          recebido: { $sum: "$recebido" },
          atrasado: { $sum: "$atrasado" },
        },
      },
    ]),
  ]);

  const s = statsAgg[0] || {
    total: 0,
    valorTotal: 0,
    recebido: 0,
    atrasado: 0,
  };
  return {
    data,
    total: s.total,
    stats: {
      total: s.total,
      valorTotal: round2(s.valorTotal),
      recebido: round2(s.recebido),
      aReceber: round2(s.valorTotal - s.recebido),
      atrasado: round2(s.atrasado),
      ticketMedio: s.total ? round2(s.valorTotal / s.total) : 0,
    },
  };
}
