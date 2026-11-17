import {
  route,
  audit,
  getPagination,
  paginationInfo,
  badRequest,
} from "../../../libs/api.js";
import {
  createCliente,
  deleteCliente,
  listClientes,
  searchClientes,
  updateCliente,
} from "../../../services/clienteService.js";

export const GET = route("clientes:read", async ({ searchParams }) => {
  const q = searchParams.get("q") || "";
  // Autocomplete do formulário de serviço
  if (searchParams.get("search") === "true") return searchClientes(q);
  const { page, limit, skip } = getPagination(searchParams, 12);
  const { data, total, stats } = await listClientes({ q, page, limit, skip });
  return { data, stats, pagination: paginationInfo(total, page, limit) };
});

export const POST = route(
  "clientes:create",
  async ({ request, user, body }) => {
    const cliente = await createCliente(await body());
    await audit(request, user, {
      action: "CREATE",
      model: "Cliente",
      documentId: cliente._id,
      newData: cliente,
    });
    return Response.json(cliente, { status: 201 });
  },
);

export const PUT = route("clientes:update", async ({ request, user, body }) => {
  const { id, ...data } = await body();
  if (!id) throw badRequest("ID do cliente é obrigatório");
  const { previous, cliente } = await updateCliente(id, data);
  await audit(request, user, {
    action: "UPDATE",
    model: "Cliente",
    documentId: id,
    previousData: previous,
    newData: cliente,
  });
  return cliente;
});

export const DELETE = route(
  "clientes:delete",
  async ({ request, user, body }) => {
    const { id } = await body();
    if (!id) throw badRequest("ID do cliente é obrigatório");
    const cliente = await deleteCliente(id);
    await audit(request, user, {
      action: "DELETE",
      model: "Cliente",
      documentId: id,
      previousData: cliente,
    });
    return { success: true };
  },
);
