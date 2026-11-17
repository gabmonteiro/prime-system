import { route } from "../../../../libs/api.js";
import { getClienteDetalhe } from "../../../../services/clienteService.js";

export const GET = route("clientes:read", async ({ params }) =>
  getClienteDetalhe(params.id),
);
