import { NextResponse } from 'next/server';

export function middleware(request) {
  const publicPaths = ['/login', '/api'];
  const { pathname } = request.nextUrl;
  // Permite rotas públicas
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  // Verifica autenticação pelo cookie 'user'
  const userCookie = request.cookies.get('user');
  if (!userCookie || !userCookie.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};
