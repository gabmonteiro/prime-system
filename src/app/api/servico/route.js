import {
  route,
  audit,
  getPagination,
  paginationInfo,
  badRequest,
} from "../../../libs/api.js";
import {
  buildServicoMatch,
  createServico,
  deleteServico,
  getServicoById,
  listServicos,
  updateServico,
} from "../../../services/servicoService.js";
import { getFiscalMonthStart } from "../../../services/systemConfigService.js";

export const GET = route("servicos:read", async ({ searchParams }) => {
  const id = searchParams.get("id");
  if (id) return getServicoById(id);
  const fiscalStart = await getFiscalMonthStart();
  const { page, limit, skip } = getPagination(searchParams);
  const match = buildServicoMatch(searchParams, fiscalStart);
  const { data, total, stats } = await listServicos({
    match,
    page,
    limit,
    skip,
  });
  return { data, stats, pagination: paginationInfo(total, page, limit) };
});

export const POST = route(
  "servicos:create",
  async ({ request, user, body }) => {
    const servico = await createServico(await body());
    await audit(request, user, {
      action: "CREATE",
      model: "Servico",
      documentId: servico._id,
      newData: servico,
    });
    return Response.json(servico, { status: 201 });
  },
);

export const PUT = route("servicos:update", async ({ request, user, body }) => {
  const { id, ...data } = await body();
  if (!id) throw badRequest("ID do serviço é obrigatório");
  const previousData = await getServicoById(id);
  const servico = await updateServico(id, data);
  await audit(request, user, {
    action: "UPDATE",
    model: "Servico",
    documentId: id,
    previousData,
    newData: servico,
  });
  return servico;
});

export const DELETE = route(
  "servicos:delete",
  async ({ request, user, body, searchParams }) => {
    const id = searchParams.get("id") || (await body()).id;
    if (!id) throw badRequest("ID do serviço é obrigatório");
    const previousData = await getServicoById(id);
    await deleteServico(id);
    await audit(request, user, {
      action: "DELETE",
      model: "Servico",
      documentId: id,
      previousData,
    });
    return { success: true };
  },
);
