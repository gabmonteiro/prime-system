import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./libs/session";

// Rotas de API que não exigem sessão
const PUBLIC_API = ["/api/login", "/api/auth/logout"];
// Leitura pública da identidade visual (cor/logo aparecem no login e na landing).
// Alterações nessas rotas continuam exigindo login + permissão no handler.
const PUBLIC_GET_PREFIX = "/api/branding";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token);

  if (pathname.startsWith("/api")) {
    const publicGet =
      request.method === "GET" && pathname.startsWith(PUBLIC_GET_PREFIX);
    if (PUBLIC_API.includes(pathname) || publicGet || userId) {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 },
    );
  }

  if (pathname.startsWith("/dashboard") && !userId) {
    const url = new URL("/login", request.url);
    const response = NextResponse.redirect(url);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (pathname === "/login" && userId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/login"],
};
