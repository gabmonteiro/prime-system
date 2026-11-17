import { hasPermission } from "../../../libs/permissions.js";
import {
  forbidden,
  route,
  audit,
  badRequest,
  getPagination,
  paginationInfo,
} from "../../../libs/api.js";
import {
  buildDespesaMatch,
  createDespesa,
  deleteDespesa,
  getDespesaById,
  listDespesas,
  updateDespesa,
} from "../../../services/despesaService.js";
import { getFiscalMonthStart } from "../../../services/systemConfigService.js";

export const GET = route("despesas:read", async ({ searchParams }) => {
  const id = searchParams.get("id");
  if (id) return getDespesaById(id);
  const fiscalStart = await getFiscalMonthStart();
  const { page, limit, skip } = getPagination(searchParams);
  const match = buildDespesaMatch(searchParams, fiscalStart);
  const { data, total, stats } = await listDespesas({ match, skip, limit });
  return { data, stats, pagination: paginationInfo(total, page, limit) };
});

export const POST = route(
  "despesas:create",
  async ({ request, user, body }) => {
    const despesa = await createDespesa(assertRetirada(user, await body()));
    await audit(request, user, {
      action: "CREATE",
      model: "Despesa",
      documentId: despesa._id,
      newData: despesa,
    });
    return Response.json(despesa, { status: 201 });
  },
);

export const PUT = route("despesas:update", async ({ request, user, body }) => {
  const { id, ...data } = await body();
  if (!id) throw badRequest("ID da despesa é obrigatório");
  const atual = await getDespesaById(id);
  assertRetirada(user, data);
  assertRetirada(user, atual);
  const { previous, despesa } = await updateDespesa(id, data);
  await audit(request, user, {
    action: "UPDATE",
    model: "Despesa",
    documentId: id,
    previousData: previous,
    newData: despesa,
  });
  return despesa;
});

export const DELETE = route(
  "despesas:delete",
  async ({ request, user, body, searchParams }) => {
    const id = searchParams.get("id") || (await body()).id;
    if (!id) throw badRequest("ID da despesa é obrigatório");
    assertRetirada(user, await getDespesaById(id));
    const despesa = await deleteDespesa(id);
    await audit(request, user, {
      action: "DELETE",
      model: "Despesa",
      documentId: id,
      previousData: despesa,
    });
    return { success: true };
  },
);

// Retirada de sócios: só quem gerencia despesas (gerente/admin). Retorna o próprio dado.
function assertRetirada(user, despesa) {
  if (
    despesa?.tipo === "retirada" &&
    !hasPermission(user, "despesas", "manage")
  ) {
    throw forbidden("Apenas gerentes e administradores podem lançar retiradas");
  }
  return despesa;
}
