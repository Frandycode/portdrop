/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin login endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminCredentials, verifyPassword } from '@/lib/adminAuth';

const COOKIE_NAME   = 'portdrop_admin';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }));

  if (!password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }

  const creds  = await getAdminCredentials();
  const secret = process.env.ADMIN_SECRET;

  let valid = false;

  if (creds) {
    valid = verifyPassword(password, creds.passwordHash, creds.salt);
  } else if (secret) {
    // Fall back to env var until account is created via /admin/setup
    valid = password === secret;
  } else {
    return NextResponse.json({ error: 'Admin is not configured.' }, { status: 503 });
  }

  if (!valid) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
  }

  // Store a session token derived from the current password hash (or secret)
  const sessionToken = creds
    ? creds.passwordHash.slice(0, 40)
    : secret!;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   COOKIE_MAX_AGE,
    path:     '/',
  });
  return res;
}
