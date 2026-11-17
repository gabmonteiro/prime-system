import connectDB from "../../../libs/db.js";
import { validateCredentials } from "../../../services/userService.js";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "../../../libs/session.js";
import { errorResponse } from "../../../libs/api.js";

// Limite simples de tentativas por IP+email (memória do processo)
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateKey(request, email) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return `${ip}|${email}`;
}

function isLimited(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { first: now, count: 1 });
  } else {
    entry.count += 1;
  }
  if (attempts.size > 5000) attempts.clear();
}

export async function POST(request) {
  try {
    const { email, password } = await request.json().catch(() => ({}));
    if (!email || !password) {
      return Response.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 },
      );
    }
    const normalized = String(email).toLowerCase().trim();
    const key = rateKey(request, normalized);
    if (isLimited(key)) {
      return Response.json(
        {
          error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        },
        { status: 429 },
      );
    }

    await connectDB();
    const user = await validateCredentials(normalized, password);
    if (!user) {
      registerFailure(key);
      return Response.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    attempts.delete(key);

    const response = Response.json(user);
    const token = await createSessionToken(user._id);
    const opts = sessionCookieOptions();
    const cookie = [
      `${SESSION_COOKIE}=${token}`,
      `Path=${opts.path}`,
      `Max-Age=${opts.maxAge}`,
      "HttpOnly",
      "SameSite=Lax",
      opts.secure ? "Secure" : null,
    ]
      .filter(Boolean)
      .join("; ");
    response.headers.append("Set-Cookie", cookie);
    // Remove o cookie inseguro da v1
    response.headers.append("Set-Cookie", "user=; Path=/; Max-Age=0");
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
