import { route, audit, badRequest } from "../../../libs/api.js";
import {
  getAllConfigs,
  getConfig,
  setConfig,
} from "../../../services/systemConfigService.js";

// Configurações não são sensíveis (ex: dia do mês fiscal) e todas as telas precisam delas
export const GET = route(null, async ({ searchParams }) => {
  const key = searchParams.get("key");
  if (key) return { key, value: await getConfig(key) };
  return getAllConfigs();
});

async function update({ request, user, body }) {
  const { key, value, description } = await body();
  if (!key || value === undefined) {
    throw badRequest("Chave e valor são obrigatórios");
  }
  let finalValue = value;
  if (key === "fiscalMonthStart") {
    finalValue = parseInt(value, 10);
    if (isNaN(finalValue) || finalValue < 1 || finalValue > 31) {
      throw badRequest("Dia do mês fiscal deve ser entre 1 e 31");
    }
  }
  const previousValue = await getConfig(key);
  const config = await setConfig(key, finalValue, description);
  await audit(request, user, {
    action: "UPDATE",
    model: "SystemConfig",
    documentId: config._id,
    previousData: { key, value: previousValue },
    newData: { key, value: config.value },
  });
  return config;
}

export const PUT = route("configuracoes:update", update);
export const POST = route("configuracoes:update", update);
