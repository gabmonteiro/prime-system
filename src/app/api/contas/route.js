import { route, audit, badRequest } from "../../../libs/api.js";
import {
  createConta,
  deleteConta,
  listContasComSaldo,
  updateConta,
} from "../../../services/contaService.js";

export const GET = route("contas:read", async ({ searchParams }) => {
  const contas = await listContasComSaldo({
    incluirInativas: searchParams.get("ativas") !== "true",
  });
  return {
    data: contas,
    saldoTotal: contas.reduce((acc, c) => acc + c.saldo, 0),
  };
});

export const POST = route("contas:create", async ({ request, user, body }) => {
  const conta = await createConta(await body());
  await audit(request, user, {
    action: "CREATE",
    model: "Conta",
    documentId: conta._id,
    newData: conta,
  });
  return Response.json(conta, { status: 201 });
});

export const PUT = route("contas:update", async ({ request, user, body }) => {
  const { id, ...data } = await body();
  if (!id) throw badRequest("ID da conta é obrigatório");
  const { previous, conta } = await updateConta(id, data);
  await audit(request, user, {
    action: "UPDATE",
    model: "Conta",
    documentId: id,
    previousData: previous,
    newData: conta,
  });
  return conta;
});

export const DELETE = route(
  "contas:delete",
  async ({ request, user, body }) => {
    const { id } = await body();
    if (!id) throw badRequest("ID da conta é obrigatório");
    const conta = await deleteConta(id);
    await audit(request, user, {
      action: "DELETE",
      model: "Conta",
      documentId: id,
      previousData: conta,
    });
    return { success: true };
  },
);
