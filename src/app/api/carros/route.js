import { route, audit, badRequest } from "../../../libs/api.js";
import {
  createCarro,
  deleteCarro,
  updateCarro,
} from "../../../services/clienteService.js";

export const POST = route(
  "clientes:create",
  async ({ request, user, body }) => {
    const carro = await createCarro(await body());
    await audit(request, user, {
      action: "CREATE",
      model: "Carro",
      documentId: carro._id,
      newData: carro,
    });
    return Response.json(carro, { status: 201 });
  },
);

export const PUT = route("clientes:update", async ({ request, user, body }) => {
  const { id, ...data } = await body();
  if (!id) throw badRequest("ID do veículo é obrigatório");
  const { previous, carro } = await updateCarro(id, data);
  await audit(request, user, {
    action: "UPDATE",
    model: "Carro",
    documentId: id,
    previousData: previous,
    newData: carro,
  });
  return carro;
});

export const DELETE = route(
  "clientes:delete",
  async ({ request, user, body }) => {
    const { id } = await body();
    if (!id) throw badRequest("ID do veículo é obrigatório");
    const carro = await deleteCarro(id);
    await audit(request, user, {
      action: "DELETE",
      model: "Carro",
      documentId: id,
      previousData: carro,
    });
    return { success: true };
  },
);
