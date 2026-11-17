// Sessão assinada (JWT HS256) guardada em cookie HttpOnly.
// Usado pelo proxy e pelas rotas de API. Sem dependências de servidor (roda no proxy).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "prime_session";
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24h (mesma duração da v1)

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET não definido (ou com menos de 32 caracteres) no ambiente",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Retorna o userId da sessão ou null se o token for inválido/expirado. */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload.sub || null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
