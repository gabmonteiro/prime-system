import Servico from "../models/servico.js";
import Despesa from "../models/despesa.js";
import FuturaCompra from "../models/futuraCompra.js";
import User from "../models/user.js";
import { listContasComSaldo } from "./contaService.js";
import { round2 } from "../libs/money.js";
import {
  getFiscalMonthKey,
  getFiscalMonthRange,
  monthKeysBetween,
  shiftMonthKey,
  toDateOnly,
  toYmd,
} from "../libs/dates.js";

const RX_EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
const NOMES_GENERICOS = new Set(["", "cliente", "clientes"]);
const nomeExibicao = (nome) =>
  String(nome || "")
    .replace(RX_EMOJI, "")
    .replace(/\s+/g, " ")
    .trim();
const chaveNome = (nome) =>
  nomeExibicao(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const VALOR = (s) => s.valorTotal ?? s.valorPersonalizado ?? 0;
const OPERACIONAL = ["compra", "gasto"];

/** Recebimentos (parcelas pagas) num intervalo, com os dados do serviço. */
async function recebimentosEntre(start, end) {
  return Servico.aggregate([
    {
      $match: {
        parcelas: {
          $elemMatch: { pago: true, dataPagamento: { $gte: start, $lt: end } },
        },
      },
    },
    { $unwind: "$parcelas" },
    {
      $match: {
        "parcelas.pago": true,
        "parcelas.dataPagamento": { $gte: start, $lt: end },
      },
    },
    {
      $project: {
        valor: "$parcelas.valor",
        data: "$parcelas.dataPagamento",
        conta: "$parcelas.conta",
        participantes: 1,
        cliente: 1,
        tipoServico: 1,
      },
    },
  ]);
}

export async function getDashboard({ mes, fiscalStart, can }) {
  const hoje = toDateOnly(new Date());
  const mesAtual = getFiscalMonthKey(hoje, fiscalStart);
  const key = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : mesAtual;
  const { start, end } = getFiscalMonthRange(key, fiscalStart);
  const prevKey = shiftMonthKey(key, -1);
  const { start: prevStart } = getFiscalMonthRange(prevKey, fiscalStart);
  const firstKey12 = shiftMonthKey(key, -11);
  const { start: start12 } = getFiscalMonthRange(firstKey12, fiscalStart);

  const verServicos = can("servicos", "read");
  const verDespesas = can("despesas", "read");
  const verContas = can("contas", "read");
  const verCompras = can("lista-compras", "read");

  const [
    receb12,
    servicos12,
    despesas12,
    usuarios,
    primeiroServico,
    primeiraDespesa,
  ] = await Promise.all([
    verServicos ? recebimentosEntre(start12, end) : [],
    verServicos
      ? Servico.find(
          { data: { $gte: start12, $lt: end } },
          {
            data: 1,
            valorTotal: 1,
            valorPersonalizado: 1,
            tipoServico: 1,
            semTipo: 1,
            clienteRef: 1,
            cliente: 1,
            pago: 1,
          },
        )
          .populate("tipoServico", "nome")
          .lean()
      : [],
    verDespesas
      ? Despesa.find({ data: { $gte: start12, $lt: end } }).lean()
      : [],
    User.find({}, { name: 1, isActive: 1 }).sort({ name: 1 }).lean(),
    Servico.findOne({}, { data: 1 }).sort({ data: 1 }).lean(),
    Despesa.findOne({}, { data: 1 }).sort({ data: 1 }).lean(),
  ]);

  const inRange = (d, s, e) => d >= s && d < e;
  const recebMes = receb12.filter((r) => inRange(new Date(r.data), start, end));
  const recebPrev = receb12.filter((r) =>
    inRange(new Date(r.data), prevStart, start),
  );
  const servMes = servicos12.filter((s) =>
    inRange(new Date(s.data), start, end),
  );
  const servPrev = servicos12.filter((s) =>
    inRange(new Date(s.data), prevStart, start),
  );
  const despMes = despesas12.filter((d) =>
    inRange(new Date(d.data), start, end),
  );
  const despPrev = despesas12.filter((d) =>
    inRange(new Date(d.data), prevStart, start),
  );

  const sum = (arr, fn) => round2(arr.reduce((acc, x) => acc + fn(x), 0));
  const operacional = (arr) =>
    sum(
      arr.filter((d) => OPERACIONAL.includes(d.tipo)),
      (d) => d.valor,
    );

  const receitaMes = sum(recebMes, (r) => r.valor);
  const despesasMes = operacional(despMes);
  const retiradasMes = sum(
    despMes.filter((d) => d.tipo === "retirada"),
    (d) => d.valor,
  );
  const faturadoMes = sum(servMes, VALOR);

  const kpis = {
    receitaMes,
    receitaPrev: sum(recebPrev, (r) => r.valor),
    despesasMes,
    despesasPrev: operacional(despPrev),
    lucroMes: round2(receitaMes - despesasMes),
    lucroPrev: round2(sum(recebPrev, (r) => r.valor) - operacional(despPrev)),
    retiradasMes,
    servicosMes: servMes.length,
    servicosPrev: servPrev.length,
    faturadoMes,
    ticketMedio: servMes.length ? round2(faturadoMes / servMes.length) : 0,
    ticketMedioPrev: servPrev.length
      ? round2(sum(servPrev, VALOR) / servPrev.length)
      : 0,
  };

  // --- Série diária do mês ---------------------------------------------------
  const diario = [];
  for (let d = new Date(start); d < end; d = new Date(d.getTime() + 864e5)) {
    diario.push({ dia: toYmd(d), receita: 0, despesas: 0 });
  }
  const diaIdx = new Map(diario.map((d, i) => [d.dia, i]));
  recebMes.forEach((r) => {
    const i = diaIdx.get(toYmd(r.data));
    if (i !== undefined) diario[i].receita += r.valor;
  });
  despMes
    .filter((d) => OPERACIONAL.includes(d.tipo))
    .forEach((d) => {
      const i = diaIdx.get(toYmd(d.data));
      if (i !== undefined) diario[i].despesas += d.valor;
    });
  diario.forEach((d) => {
    d.receita = round2(d.receita);
    d.despesas = round2(d.despesas);
  });

  // --- Série mensal (12 meses fiscais) --------------------------------------
  const mensal = monthKeysBetween(firstKey12, key).map((k) => ({
    mes: k,
    receita: 0,
    despesas: 0,
    faturado: 0,
    servicos: 0,
  }));
  const mesIdx = new Map(mensal.map((m, i) => [m.mes, i]));
  const bucket = (date) => mesIdx.get(getFiscalMonthKey(date, fiscalStart));
  receb12.forEach((r) => {
    const i = bucket(r.data);
    if (i !== undefined) mensal[i].receita += r.valor;
  });
  despesas12
    .filter((d) => OPERACIONAL.includes(d.tipo))
    .forEach((d) => {
      const i = bucket(d.data);
      if (i !== undefined) mensal[i].despesas += d.valor;
    });
  servicos12.forEach((s) => {
    const i = bucket(s.data);
    if (i !== undefined) {
      mensal[i].faturado += VALOR(s);
      mensal[i].servicos += 1;
    }
  });
  mensal.forEach((m) => {
    m.receita = round2(m.receita);
    m.despesas = round2(m.despesas);
    m.faturado = round2(m.faturado);
    m.lucro = round2(m.receita - m.despesas);
  });

  // --- Rankings ------------------------------------------------------------
  const rankTipos = (lista) => {
    const map = new Map();
    lista.forEach((s) => {
      const nome = s.semTipo
        ? "Sem tipo (personalizado)"
        : s.tipoServico?.nome || "Tipo removido";
      const cur = map.get(nome) || { nome, quantidade: 0, valor: 0 };
      cur.quantidade += 1;
      cur.valor += VALOR(s);
      map.set(nome, cur);
    });
    return [...map.values()]
      .map((t) => ({ ...t, valor: round2(t.valor) }))
      .sort((a, b) => b.quantidade - a.quantidade || b.valor - a.valor)
      .slice(0, 8);
  };

  const clientesMap = new Map();
  servicos12.forEach((s) => {
    // Serviços da v1 não têm cadastro: agrupa pelo nome digitado, sem emojis/acentos
    const nome = nomeExibicao(s.cliente);
    if (!s.clienteRef && NOMES_GENERICOS.has(chaveNome(nome))) return;
    const id = s.clienteRef ? String(s.clienteRef) : `nome:${chaveNome(nome)}`;
    const cur = clientesMap.get(id) || {
      id: s.clienteRef || null,
      nome,
      quantidade: 0,
      valor: 0,
    };
    cur.quantidade += 1;
    cur.valor += VALOR(s);
    clientesMap.set(id, cur);
  });
  const topClientes = [...clientesMap.values()]
    .map((c) => ({ ...c, valor: round2(c.valor) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  // --- Divisão entre sócios (pelo que entrou no mês) ------------------------
  const porSocio = new Map(
    usuarios.map((u) => [
      String(u._id),
      {
        id: u._id,
        nome: u.name,
        ativo: u.isActive !== false,
        valor: 0,
        recebimentos: 0,
      },
    ]),
  );
  let semParticipantes = 0;
  recebMes.forEach((r) => {
    const parts = (r.participantes || []).map(String);
    if (parts.length === 0) {
      semParticipantes += r.valor;
      return;
    }
    const cota = r.valor / parts.length;
    parts.forEach((p) => {
      const socio = porSocio.get(p);
      if (socio) {
        socio.valor += cota;
        socio.recebimentos += 1;
      }
    });
  });
  const totalDistribuido = [...porSocio.values()].reduce(
    (acc, s) => acc + s.valor,
    0,
  );
  const divisao = {
    total: round2(totalDistribuido),
    semParticipantes: round2(semParticipantes),
    socios: [...porSocio.values()]
      .filter((s) => s.ativo || s.valor > 0)
      .map((s) => ({
        ...s,
        valor: round2(s.valor),
        percentual: totalDistribuido ? s.valor / totalDistribuido : 0,
      }))
      .sort((a, b) => b.valor - a.valor),
  };

  // --- A receber -----------------------------------------------------------
  let aReceber = { total: 0, atrasado: 0, atrasadas: 0, proximas: [] };
  if (verServicos) {
    const abertas = await Servico.aggregate([
      { $match: { "parcelas.pago": false } },
      { $addFields: { totalParcelas: { $size: "$parcelas" } } },
      { $unwind: "$parcelas" },
      { $match: { "parcelas.pago": false } },
      {
        $project: {
          servicoId: "$_id",
          parcelaId: "$parcelas._id",
          cliente: 1,
          nomeCarro: 1,
          numero: "$parcelas.numero",
          totalParcelas: 1,
          valor: "$parcelas.valor",
          vencimento: "$parcelas.vencimento",
        },
      },
      { $sort: { vencimento: 1 } },
    ]);
    const atrasadas = abertas.filter((p) => new Date(p.vencimento) < hoje);
    aReceber = {
      total: sum(abertas, (p) => p.valor),
      atrasado: sum(atrasadas, (p) => p.valor),
      atrasadas: atrasadas.length,
      proximas: abertas.slice(0, 8),
    };
  }

  // --- Contas --------------------------------------------------------------
  const contas = verContas
    ? (await listContasComSaldo()).filter((c) => c.ativa || c.saldo !== 0)
    : [];
  const recebPorConta = new Map();
  recebMes.forEach((r) => {
    const k = String(r.conta);
    recebPorConta.set(k, (recebPorConta.get(k) || 0) + r.valor);
  });

  // --- Lista de compras ----------------------------------------------------
  let compras = null;
  if (verCompras) {
    const itens = await FuturaCompra.find({}, { valor: 1, urgencia: 1 }).lean();
    compras = {
      total: itens.length,
      urgentes: itens.filter((c) => c.urgencia === "alto").length,
      valorEstimado: sum(itens, (c) => Number(c.valor) || 0),
    };
  }

  // --- Meses disponíveis ---------------------------------------------------
  const datas = [primeiroServico?.data, primeiraDespesa?.data]
    .filter(Boolean)
    .map((d) => new Date(d));
  const primeiroMes = datas.length
    ? getFiscalMonthKey(new Date(Math.min(...datas)), fiscalStart)
    : mesAtual;
  const meses = monthKeysBetween(primeiroMes, mesAtual).reverse();

  return {
    mes: key,
    mesAtual,
    meses,
    fiscalStart,
    periodo: { inicio: start, fim: new Date(end.getTime() - 864e5) },
    kpis,
    diario,
    mensal,
    topTiposMes: rankTipos(servMes),
    topTipos12: rankTipos(servicos12),
    topClientes,
    divisao,
    aReceber,
    contas: contas.map((c) => ({
      _id: c._id,
      nome: c.nome,
      tipo: c.tipo,
      saldo: c.saldo,
      sistema: c.sistema,
      recebidoMes: round2(recebPorConta.get(String(c._id)) || 0),
    })),
    saldoTotal: round2(contas.reduce((acc, c) => acc + c.saldo, 0)),
    compras,
    permissoes: {
      servicos: verServicos,
      despesas: verDespesas,
      contas: verContas,
      compras: verCompras,
    },
  };
}
