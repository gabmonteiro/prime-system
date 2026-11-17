import { route, audit, badRequest } from "../../../../libs/api.js";
import {
  estornarServico,
  getServicoById,
  pagarServico,
} from "../../../../services/servicoService.js";

// Registrar recebimento: { id, parcelaId?, conta, data }
export const POST = route(
  "servicos:update",
  async ({ request, user, body }) => {
    const { id, parcelaId, conta, data } = await body();
    if (!id) throw badRequest("ID do serviço é obrigatório");
    if (!conta) throw badRequest("Selecione a conta onde o dinheiro entrou");
    const previousData = await getServicoById(id);
    const servico = await pagarServico(id, { parcelaId, conta, data });
    await audit(request, user, {
      action: "UPDATE",
      model: "Servico",
      documentId: id,
      previousData,
      newData: servico,
      metadata: {
        operation: "registrar_pagamento",
        parcelaId: parcelaId || "todas",
      },
    });
    return servico;
  },
);

// Estornar recebimento: { id, parcelaId? }
export const DELETE = route(
  "servicos:update",
  async ({ request, user, body }) => {
    const { id, parcelaId } = await body();
    if (!id) throw badRequest("ID do serviço é obrigatório");
    const previousData = await getServicoById(id);
    const servico = await estornarServico(id, { parcelaId });
    await audit(request, user, {
      action: "UPDATE",
      model: "Servico",
      documentId: id,
      previousData,
      newData: servico,
      metadata: {
        operation: "estornar_pagamento",
        parcelaId: parcelaId || "todas",
      },
    });
    return servico;
  },
);
