import { route } from "../../../libs/api.js";
import { hasPermission } from "../../../libs/permissions.js";
import { getDashboard } from "../../../services/dashboardService.js";
import { getFiscalMonthStart } from "../../../services/systemConfigService.js";

export const GET = route("dashboard:read", async ({ user, searchParams }) => {
  const fiscalStart = await getFiscalMonthStart();
  return getDashboard({
    mes: searchParams.get("mes"),
    fiscalStart,
    can: (resource, action) => hasPermission(user, resource, action),
  });
});
