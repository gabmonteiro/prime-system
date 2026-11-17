import { route, audit } from "../../../../libs/api.js";
import { mergeCarros } from "../../../../services/clienteService.js";

// Junta dois veículos duplicados do mesmo cliente: { fromId, toId }
export const POST = route(
  "clientes:update",
  async ({ request, user, body }) => {
    const { fromId, toId } = await body();
    const result = await mergeCarros(fromId, toId);
    await audit(request, user, {
      action: "DELETE",
      model: "Carro",
      documentId: fromId,
      previousData: result.from,
      metadata: {
        operation: "mesclar_carros",
        destino: toId,
        servicosMovidos: result.servicosMovidos,
      },
    });
    return result;
  },
);
