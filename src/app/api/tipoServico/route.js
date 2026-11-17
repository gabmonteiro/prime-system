import {
  route,
  audit,
  badRequest,
  notFound,
  searchRegex,
  toObjectId,
} from "../../../libs/api.js";
import TipoServico from "../../../models/tipoServico.js";
import Servico from "../../../models/servico.js";
import { round2 } from "../../../libs/money.js";

function normalize(data, current = {}) {
  const nome = (data.nome ?? current.nome ?? "").trim();
  if (!nome) throw badRequest("Nome é obrigatório");
  const valor = round2(data.valor ?? current.valor);
  if (!(valor >= 0)) throw badRequest("Valor inválido");
  return { nome, valor, desc: (data.desc ?? current.desc ?? "").trim() };
}

export const GET = route("tipos-servicos:read", async ({ searchParams }) => {
  const id = searchParams.get("id");
  if (id) {
    const tipo = await TipoServico.findById(toObjectId(id)).lean();
    if (!tipo) throw notFound("Tipo de serviço não encontrado");
    return tipo;
  }
  const filter = {};
  const rx = searchRegex(searchParams.get("q"));
  if (rx) filter.$or = [{ nome: rx }, { desc: rx }];

  const [tipos, uso] = await Promise.all([
    TipoServico.find(filter).sort({ nome: 1 }).lean(),
    Servico.aggregate([
      { $match: { tipoServico: { $ne: null } } },
      {
        $group: {
          _id: "$tipoServico",
          quantidade: { $sum: 1 },
          valor: { $sum: { $ifNull: ["$valorTotal", 0] } },
        },
      },
    ]),
  ]);
  const usoById = new Map(uso.map((u) => [String(u._id), u]));
  return tipos.map((t) => ({
    ...t,
    quantidade: usoById.get(String(t._id))?.quantidade || 0,
    faturado: round2(usoById.get(String(t._id))?.valor || 0),
  }));
});

export const POST = route(
  "tipos-servicos:create",
  async ({ request, user, body }) => {
    const tipo = await TipoServico.create(normalize(await body()));
    await audit(request, user, {
      action: "CREATE",
      model: "TipoServico",
      documentId: tipo._id,
      newData: tipo,
    });
    return Response.json(tipo, { status: 201 });
  },
);

export const PUT = route(
  "tipos-servicos:update",
  async ({ request, user, body }) => {
    const { id, ...data } = await body();
    if (!id) throw badRequest("ID é obrigatório");
    const tipo = await TipoServico.findById(toObjectId(id));
    if (!tipo) throw notFound("Tipo de serviço não encontrado");
    const previousData = tipo.toObject();
    Object.assign(tipo, normalize(data, previousData));
    await tipo.save();
    await audit(request, user, {
      action: "UPDATE",
      model: "TipoServico",
      documentId: id,
      previousData,
      newData: tipo,
    });
    return tipo;
  },
);

export const DELETE = route(
  "tipos-servicos:delete",
  async ({ request, user, body, searchParams }) => {
    const id = searchParams.get("id") || (await body()).id;
    if (!id) throw badRequest("ID é obrigatório");
    const _id = toObjectId(id);
    const emUso = await Servico.countDocuments({ tipoServico: _id });
    if (emUso > 0) {
      throw badRequest(
        `Este tipo está em ${emUso} serviço(s) e não pode ser excluído.`,
      );
    }
    const tipo = await TipoServico.findByIdAndDelete(_id);
    if (!tipo) throw notFound("Tipo de serviço não encontrado");
    await audit(request, user, {
      action: "DELETE",
      model: "TipoServico",
      documentId: id,
      previousData: tipo,
    });
    return { success: true };
  },
);
