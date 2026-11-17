import {
  route,
  audit,
  badRequest,
  getPagination,
  notFound,
  paginationInfo,
  searchRegex,
  toObjectId,
} from "../../../libs/api.js";
import FuturaCompra from "../../../models/futuraCompra.js";
import { round2 } from "../../../libs/money.js";

const URGENCIAS = ["baixo", "medio", "alto"];

function normalize(data, current = {}) {
  const nome = (data.nome ?? current.nome ?? "").trim();
  if (!nome) throw badRequest("Nome é obrigatório");
  const urgencia = data.urgencia ?? current.urgencia;
  if (!URGENCIAS.includes(urgencia)) throw badRequest("Urgência inválida");
  const rawValor = data.valor !== undefined ? data.valor : current.valor;
  const valor = rawValor === "" || rawValor == null ? null : round2(rawValor);
  return {
    nome,
    urgencia,
    valor,
    desc: (data.desc ?? current.desc ?? "").trim(),
  };
}

export const GET = route("lista-compras:read", async ({ searchParams }) => {
  const id = searchParams.get("id");
  if (id) {
    const item = await FuturaCompra.findById(toObjectId(id)).lean();
    if (!item) throw notFound("Item não encontrado");
    return item;
  }
  const match = {};
  const rx = searchRegex(searchParams.get("q"));
  if (rx) match.$or = [{ nome: rx }, { desc: rx }];
  const urgencia = searchParams.get("urgencia");
  if (URGENCIAS.includes(urgencia)) match.urgencia = urgencia;

  const { page, limit, skip } = getPagination(searchParams);
  const [data, agg] = await Promise.all([
    FuturaCompra.aggregate([
      { $match: match },
      {
        $addFields: {
          _ordem: {
            $indexOfArray: [["alto", "medio", "baixo"], "$urgencia"],
          },
        },
      },
      { $sort: { _ordem: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _ordem: 0 } },
    ]),
    FuturaCompra.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$urgencia",
          count: { $sum: 1 },
          valor: { $sum: { $ifNull: ["$valor", 0] } },
        },
      },
    ]),
  ]);
  const by = Object.fromEntries(agg.map((a) => [a._id, a]));
  const total = agg.reduce((acc, a) => acc + a.count, 0);
  return {
    data,
    stats: {
      total,
      valorEstimado: round2(agg.reduce((acc, a) => acc + a.valor, 0)),
      alto: by.alto?.count || 0,
      medio: by.medio?.count || 0,
      baixo: by.baixo?.count || 0,
    },
    pagination: paginationInfo(total, page, limit),
  };
});

export const POST = route(
  "lista-compras:create",
  async ({ request, user, body }) => {
    const item = await FuturaCompra.create(normalize(await body()));
    await audit(request, user, {
      action: "CREATE",
      model: "FuturaCompra",
      documentId: item._id,
      newData: item,
    });
    return Response.json(item, { status: 201 });
  },
);

export const PUT = route(
  "lista-compras:update",
  async ({ request, user, body }) => {
    const { id, ...data } = await body();
    if (!id) throw badRequest("ID é obrigatório");
    const item = await FuturaCompra.findById(toObjectId(id));
    if (!item) throw notFound("Item não encontrado");
    const previousData = item.toObject();
    Object.assign(item, normalize(data, previousData));
    await item.save();
    await audit(request, user, {
      action: "UPDATE",
      model: "FuturaCompra",
      documentId: id,
      previousData,
      newData: item,
    });
    return item;
  },
);

export const DELETE = route(
  "lista-compras:delete",
  async ({ request, user, body, searchParams }) => {
    const id = searchParams.get("id") || (await body()).id;
    if (!id) throw badRequest("ID é obrigatório");
    const item = await FuturaCompra.findByIdAndDelete(toObjectId(id));
    if (!item) throw notFound("Item não encontrado");
    await audit(request, user, {
      action: "DELETE",
      model: "FuturaCompra",
      documentId: id,
      previousData: item,
    });
    return { success: true };
  },
);
