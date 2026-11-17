import Conta from "../models/conta.js";
import Servico from "../models/servico.js";
import Despesa from "../models/despesa.js";
import Transferencia from "../models/transferencia.js";
import { badRequest, notFound, toObjectId } from "../libs/api.js";
import { round2 } from "../libs/money.js";
import { toDateOnly } from "../libs/dates.js";

/**
 * Movimentações agregadas por conta (opcionalmente até uma data).
 * Retorna Map(contaId -> { entradas, saidas, transfIn, transfOut }).
 */
async function movimentosPorConta(ate = null) {
  const dateFilter = (field) => (ate ? { [field]: { $lt: ate } } : {});

  const [receb, desp, tin, tout] = await Promise.all([
    Servico.aggregate([
      { $unwind: "$parcelas" },
      {
        $match: {
          "parcelas.pago": true,
          "parcelas.conta": { $ne: null },
          ...dateFilter("parcelas.dataPagamento"),
        },
      },
      {
        $group: { _id: "$parcelas.conta", total: { $sum: "$parcelas.valor" } },
      },
    ]),
    Despesa.aggregate([
      { $match: { conta: { $ne: null }, ...dateFilter("data") } },
      { $group: { _id: "$conta", total: { $sum: "$valor" } } },
    ]),
    Transferencia.aggregate([
      { $match: dateFilter("data") },
      { $group: { _id: "$contaDestino", total: { $sum: "$valor" } } },
    ]),
    Transferencia.aggregate([
      { $match: dateFilter("data") },
      { $group: { _id: "$contaOrigem", total: { $sum: "$valor" } } },
    ]),
  ]);

  const map = new Map();
  const get = (id) => {
    const k = String(id);
    if (!map.has(k)) {
      map.set(k, { entradas: 0, saidas: 0, transfIn: 0, transfOut: 0 });
    }
    return map.get(k);
  };
  receb.forEach((r) => (get(r._id).entradas += r.total));
  desp.forEach((r) => (get(r._id).saidas += r.total));
  tin.forEach((r) => (get(r._id).transfIn += r.total));
  tout.forEach((r) => (get(r._id).transfOut += r.total));
  return map;
}

export async function listContasComSaldo({ incluirInativas = true } = {}) {
  const filter = incluirInativas ? {} : { ativa: true };
  const [contas, mov] = await Promise.all([
    Conta.find(filter).sort({ sistema: 1, nome: 1 }).lean(),
    movimentosPorConta(),
  ]);
  return contas.map((c) => {
    const m = mov.get(String(c._id)) || {
      entradas: 0,
      saidas: 0,
      transfIn: 0,
      transfOut: 0,
    };
    return {
      ...c,
      entradas: round2(m.entradas),
      saidas: round2(m.saidas),
      transfIn: round2(m.transfIn),
      transfOut: round2(m.transfOut),
      saldo: round2(
        (c.saldoInicial || 0) +
          m.entradas -
          m.saidas +
          m.transfIn -
          m.transfOut,
      ),
    };
  });
}

export async function getSaldoTotal() {
  const contas = await listContasComSaldo();
  return round2(contas.reduce((acc, c) => acc + c.saldo, 0));
}

export async function createConta(data) {
  if (!data.nome?.trim()) throw badRequest("Nome é obrigatório");
  return Conta.create({
    nome: data.nome.trim(),
    tipo: data.tipo || "banco",
    saldoInicial: round2(data.saldoInicial || 0),
    desc: data.desc?.trim(),
  });
}

export async function updateConta(id, data) {
  const conta = await Conta.findById(toObjectId(id, "Conta"));
  if (!conta) throw notFound("Conta não encontrada");
  const previous = conta.toObject();
  if (data.nome !== undefined) {
    if (!data.nome.trim()) throw badRequest("Nome é obrigatório");
    conta.nome = data.nome.trim();
  }
  if (data.tipo !== undefined) conta.tipo = data.tipo;
  if (data.saldoInicial !== undefined) {
    conta.saldoInicial = round2(data.saldoInicial);
  }
  if (data.ativa !== undefined) conta.ativa = Boolean(data.ativa);
  if (data.desc !== undefined) conta.desc = data.desc?.trim();
  await conta.save();
  return { previous, conta: conta.toObject() };
}

export async function deleteConta(id) {
  const _id = toObjectId(id, "Conta");
  const [receb, desp, transf] = await Promise.all([
    Servico.countDocuments({ "parcelas.conta": _id }),
    Despesa.countDocuments({ conta: _id }),
    Transferencia.countDocuments({
      $or: [{ contaOrigem: _id }, { contaDestino: _id }],
    }),
  ]);
  if (receb + desp + transf > 0) {
    throw badRequest(
      "Esta conta tem movimentações. Desative-a em vez de excluir.",
    );
  }
  const conta = await Conta.findByIdAndDelete(_id);
  if (!conta) throw notFound("Conta não encontrada");
  return conta;
}

/** Extrato da conta: recebimentos, despesas e transferências em ordem de data. */
export async function getExtrato(id, { page, limit, skip }) {
  const _id = toObjectId(id, "Conta");
  const conta = await Conta.findById(_id).lean();
  if (!conta) throw notFound("Conta não encontrada");

  const [receb, desp, transf] = await Promise.all([
    Servico.aggregate([
      { $match: { "parcelas.conta": _id } },
      { $addFields: { totalParcelas: { $size: "$parcelas" } } },
      { $unwind: "$parcelas" },
      { $match: { "parcelas.pago": true, "parcelas.conta": _id } },
      {
        $project: {
          data: "$parcelas.dataPagamento",
          valor: "$parcelas.valor",
          descricao: {
            $concat: [
              "$cliente",
              " · ",
              "$nomeCarro",
              {
                $cond: [
                  { $eq: ["$formaPagamento", "parcelado"] },
                  {
                    $concat: [
                      " (parcela ",
                      { $toString: "$parcelas.numero" },
                      "/",
                      { $toString: "$totalParcelas" },
                      ")",
                    ],
                  },
                  "",
                ],
              },
            ],
          },
          servicoId: "$_id",
        },
      },
    ]),
    Despesa.find({ conta: _id }).lean(),
    Transferencia.find({ $or: [{ contaOrigem: _id }, { contaDestino: _id }] })
      .populate("contaOrigem contaDestino", "nome")
      .lean(),
  ]);

  const movimentos = [
    ...receb.map((r) => ({
      _id: `${r.servicoId}-${r.data}-${r.valor}`,
      tipo: "recebimento",
      data: r.data,
      valor: r.valor,
      descricao: r.descricao,
      servicoId: r.servicoId,
    })),
    ...desp.map((d) => ({
      _id: String(d._id),
      tipo: d.tipo === "retirada" ? "retirada" : "despesa",
      data: d.data,
      valor: -d.valor,
      descricao: d.nome + (d.desc ? ` · ${d.desc}` : ""),
    })),
    ...transf.map((t) => {
      const entrada = String(t.contaDestino?._id) === String(_id);
      return {
        _id: String(t._id),
        tipo: "transferencia",
        data: t.data,
        valor: entrada ? t.valor : -t.valor,
        descricao: entrada
          ? `Transferência de ${t.contaOrigem?.nome || "?"}`
          : `Transferência para ${t.contaDestino?.nome || "?"}`,
        obs: t.desc,
      };
    }),
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  return {
    conta,
    total: movimentos.length,
    data: movimentos.slice(skip, skip + limit),
    page,
  };
}

// ---------------------------------------------------------------------------
// Transferências
// ---------------------------------------------------------------------------

export async function listTransferencias({ skip, limit }) {
  const [data, total] = await Promise.all([
    Transferencia.find()
      .sort({ data: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("contaOrigem contaDestino", "nome tipo")
      .lean(),
    Transferencia.countDocuments(),
  ]);
  return { data, total };
}

export async function createTransferencia(data) {
  const origem = toObjectId(data.contaOrigem, "Conta de origem");
  const destino = toObjectId(data.contaDestino, "Conta de destino");
  if (String(origem) === String(destino)) {
    throw badRequest("Escolha contas diferentes");
  }
  const contas = await Conta.find({ _id: { $in: [origem, destino] } }).lean();
  if (contas.length !== 2) throw badRequest("Conta não encontrada");
  const valor = round2(data.valor);
  if (!(valor > 0)) throw badRequest("Valor deve ser maior que zero");
  const dataT = toDateOnly(data.data) || toDateOnly(new Date());
  return Transferencia.create({
    contaOrigem: origem,
    contaDestino: destino,
    valor,
    data: dataT,
    desc: data.desc?.trim(),
  });
}

export async function deleteTransferencia(id) {
  const t = await Transferencia.findByIdAndDelete(toObjectId(id));
  if (!t) throw notFound("Transferência não encontrada");
  return t;
}
