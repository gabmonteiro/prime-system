// Helpers para rotas de API: autenticação, permissão, erros, paginação e auditoria.
import mongoose from "mongoose";
import connectDB from "./db.js";
import { SESSION_COOKIE, verifySessionToken } from "./session.js";
import { hasPermission } from "./permissions.js";
import User from "../models/user.js";
import { AuditService } from "../services/auditService.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new HttpError(400, msg);
export const notFound = (msg = "Registro não encontrado") =>
  new HttpError(404, msg);
export const forbidden = (msg = "Acesso negado. Permissão insuficiente.") =>
  new HttpError(403, msg);

function readCookie(request, name) {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

/** Usuário logado (sem senha) ou null. Usuários inativos são tratados como deslogados. */
export async function getSessionUser(request) {
  const userId = await verifySessionToken(readCookie(request, SESSION_COOKIE));
  if (!userId || !mongoose.isValidObjectId(userId)) return null;
  const user = await User.findById(userId, { password: 0 }).lean();
  if (!user || user.isActive === false) return null;
  return user;
}

/**
 * Envolve um handler de rota com conexão ao banco, autenticação, checagem de
 * permissão e tratamento de erros padronizado.
 *
 *   export const GET = route("servicos:read", async ({ user, searchParams }) => {...})
 *
 * `permission` pode ser null (qualquer usuário logado).
 */
export function route(permission, fn) {
  return async (request, context) => {
    try {
      await connectDB();
      const user = await getSessionUser(request);
      if (!user) {
        return Response.json(
          { error: "Usuário não autenticado" },
          { status: 401 },
        );
      }
      if (permission) {
        const [resource, action] = permission.split(":");
        if (!hasPermission(user, resource, action)) throw forbidden();
      }
      const searchParams = new URL(request.url).searchParams;
      const params = context?.params ? await context.params : {};
      const result = await fn({
        request,
        user,
        searchParams,
        params,
        body: () => readJson(request),
      });
      if (result instanceof Response) return result;
      return Response.json(result ?? { success: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw badRequest("Corpo da requisição inválido");
  }
}

export function errorResponse(error) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const first = Object.values(error.errors)[0];
    return Response.json(
      { error: first?.message || "Dados inválidos" },
      { status: 400 },
    );
  }
  if (error instanceof mongoose.Error.CastError) {
    return Response.json(
      { error: `Valor inválido para ${error.path}` },
      { status: 400 },
    );
  }
  if (error?.code === 11000) {
    return Response.json({ error: "Registro duplicado" }, { status: 409 });
  }
  console.error("Erro na API:", error);
  return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
}

/** Lê page/limit da query com limites seguros. */
export function getPagination(searchParams, defaultLimit = 10) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(
      1,
      parseInt(searchParams.get("limit") || String(defaultLimit), 10) ||
        defaultLimit,
    ),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationInfo(total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, totalPages };
}

/** Escapa texto do usuário para uso seguro em RegExp. */
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function searchRegex(text) {
  const q = String(text || "").trim();
  if (!q) return null;
  return new RegExp(escapeRegex(q), "i");
}

export function toObjectId(id, field = "id") {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw badRequest(`${field} inválido`);
  }
  return new mongoose.Types.ObjectId(String(id));
}

/** Registra log de auditoria sem nunca derrubar a operação principal. */
export async function audit(request, user, entry) {
  const changedFields =
    entry.action === "UPDATE" && entry.previousData && entry.newData
      ? AuditService.getChangedFields(
          AuditService.makeJsonSafe(entry.previousData),
          AuditService.makeJsonSafe(entry.newData),
        )
      : [];
  await AuditService.createLog({
    changedFields,
    ...entry,
    userId: user._id,
    userName: user.name,
    ipAddress:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "N/A",
    userAgent: request.headers.get("user-agent") || "N/A",
  });
}
