import { route, getPagination, toObjectId } from "../../../libs/api.js";
import { AuditService } from "../../../services/auditService.js";

export const GET = route("auditoria:read", async ({ searchParams }) => {
  const { page, limit } = getPagination(searchParams, 50);
  const filters = {};
  for (const key of ["model", "action", "status"]) {
    const v = searchParams.get(key);
    if (v) filters[key] = v;
  }
  const userId = searchParams.get("userId");
  if (userId) filters.userId = { $in: [toObjectId(userId, "Usuário"), userId] };
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate) filters.startDate = `${startDate}T00:00:00.000-03:00`;
  if (endDate) filters.endDate = `${endDate}T23:59:59.999-03:00`;
  return AuditService.getAuditLogs(filters, page, limit);
});
