import {
  route,
  getPagination,
  paginationInfo,
} from "../../../../../libs/api.js";
import { getExtrato } from "../../../../../services/contaService.js";

export const GET = route("contas:read", async ({ params, searchParams }) => {
  const { page, limit, skip } = getPagination(searchParams, 15);
  const { conta, data, total } = await getExtrato(params.id, {
    page,
    limit,
    skip,
  });
  return { conta, data, pagination: paginationInfo(total, page, limit) };
});
