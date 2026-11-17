import {
  route,
  audit,
  badRequest,
  getPagination,
  paginationInfo,
} from "../../../libs/api.js";
import {
  createTransferencia,
  deleteTransferencia,
  listTransferencias,
} from "../../../services/contaService.js";

export const GET = route("contas:read", async ({ searchParams }) => {
  const { page, limit, skip } = getPagination(searchParams, 10);
  const { data, total } = await listTransferencias({ skip, limit });
  return { data, pagination: paginationInfo(total, page, limit) };
});

export const POST = route("contas:create", async ({ request, user, body }) => {
  const t = await createTransferencia(await body());
  await audit(request, user, {
    action: "CREATE",
    model: "Transferencia",
    documentId: t._id,
    newData: t,
  });
  return Response.json(t, { status: 201 });
});

export const DELETE = route(
  "contas:delete",
  async ({ request, user, body }) => {
    const { id } = await body();
    if (!id) throw badRequest("ID da transferência é obrigatório");
    const t = await deleteTransferencia(id);
    await audit(request, user, {
      action: "DELETE",
      model: "Transferencia",
      documentId: id,
      previousData: t,
    });
    return { success: true };
  },
);
