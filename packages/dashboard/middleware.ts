/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin route protection middleware
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'portdrop_admin';

const PUBLIC_PATHS = ['/admin/login', '/admin/setup', '/admin/reset'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (PUBLIC_PATHS.some(p => pathname === p)) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value;

  // Cookie must exist and be non-empty — full validation happens in the API
  if (!cookie || cookie.length < 10) {
    const login = req.nextUrl.clone();
    login.pathname = '/admin/login';
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
