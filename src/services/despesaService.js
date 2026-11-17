import Despesa from "../models/despesa.js";
import Conta from "../models/conta.js";
import { badRequest, notFound, searchRegex, toObjectId } from "../libs/api.js";
import { round2 } from "../libs/money.js";
import { getFiscalMonthRange, toDateOnly } from "../libs/dates.js";

const TIPOS = ["compra", "gasto", "retirada"];

async function normalize(data, current = null) {
  const nome = (data.nome ?? current?.nome ?? "").trim();
  if (!nome) throw badRequest("Nome é obrigatório");
  const valor = round2(data.valor ?? current?.valor);
  if (!(valor > 0)) throw badRequest("Valor deve ser maior que zero");
  const tipo = data.tipo ?? current?.tipo;
  if (!TIPOS.includes(tipo)) throw badRequest("Tipo inválido");
  const dataD = toDateOnly(data.data ?? current?.data);
  if (!dataD) throw badRequest("Data inválida");

  const contaRaw = data.conta !== undefined ? data.conta : current?.conta;
  if (!contaRaw) throw badRequest("Selecione a conta de onde saiu o dinheiro");
  const conta = toObjectId(contaRaw?._id || contaRaw, "Conta");
  const contaDoc = await Conta.findById(conta).lean();
  if (!contaDoc) throw badRequest("Conta não encontrada");
  if (!contaDoc.ativa && String(conta) !== String(current?.conta)) {
    throw badRequest("Conta inativa");
  }

  const distribuicao =
    tipo === "retirada" && Array.isArray(data.distribuicao)
      ? data.distribuicao
          .filter((d) => d && Number(d.valor) > 0)
          .map((d) => ({
            user: d.user ? toObjectId(d.user, "Sócio") : null,
            nome: String(d.nome || "").trim(),
            valor: round2(d.valor),
          }))
      : (current?.distribuicao ?? []);

  return {
    nome,
    valor,
    tipo,
    data: dataD,
    conta,
    desc: (data.desc ?? current?.desc ?? "").trim(),
    distribuicao: tipo === "retirada" ? distribuicao : [],
  };
}

export async function createDespesa(data) {
  return Despesa.create(await normalize(data));
}

export async function getDespesaById(id) {
  return Despesa.findById(toObjectId(id)).populate("conta", "nome tipo").lean();
}

export async function updateDespesa(id, data) {
  const despesa = await Despesa.findById(toObjectId(id));
  if (!despesa) throw notFound("Despesa não encontrada");
  const previous = despesa.toObject();
  Object.assign(despesa, await normalize(data, previous));
  await despesa.save();
  return { previous, despesa: await getDespesaById(despesa._id) };
}

export async function deleteDespesa(id) {
  const despesa = await Despesa.findByIdAndDelete(toObjectId(id));
  if (!despesa) throw notFound("Despesa não encontrada");
  return despesa;
}

export function buildDespesaMatch(searchParams, fiscalStart) {
  const match = {};
  const rx = searchRegex(searchParams.get("q"));
  if (rx) match.$or = [{ nome: rx }, { desc: rx }];
  const tipo = searchParams.get("tipo");
  if (tipo === "operacional") match.tipo = { $in: ["compra", "gasto"] };
  else if (TIPOS.includes(tipo)) match.tipo = tipo;
  const conta = searchParams.get("conta");
  if (conta) match.conta = toObjectId(conta, "Conta");
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
  return match;
}

export async function listDespesas({ match, skip, limit }) {
  const [data, agg] = await Promise.all([
    Despesa.find(match)
      .sort({ data: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("conta", "nome tipo")
      .lean(),
    Despesa.aggregate([
      { $match: match },
      {
        $group: { _id: "$tipo", total: { $sum: "$valor" }, count: { $sum: 1 } },
      },
    ]),
  ]);
  const by = Object.fromEntries(agg.map((a) => [a._id, a]));
  const total = agg.reduce((acc, a) => acc + a.count, 0);
  const soma = agg.reduce((acc, a) => acc + a.total, 0);
  return {
    data,
    total,
    stats: {
      total,
      valorTotal: round2(soma),
      compras: round2(by.compra?.total || 0),
      gastos: round2(by.gasto?.total || 0),
      retiradas: round2(by.retirada?.total || 0),
    },
  };
}
