import { route, audit } from "../../../../libs/api.js";
import { mergeClientes } from "../../../../services/clienteService.js";

// Junta dois clientes duplicados: { fromId, toId }
export const POST = route(
  "clientes:update",
  async ({ request, user, body }) => {
    const { fromId, toId } = await body();
    const result = await mergeClientes(fromId, toId);
    await audit(request, user, {
      action: "DELETE",
      model: "Cliente",
      documentId: fromId,
      previousData: result.from,
      metadata: {
        operation: "mesclar_clientes",
        destino: toId,
        carrosMovidos: result.carrosMovidos,
        servicosMovidos: result.servicosMovidos,
      },
    });
    return result;
  },
);
