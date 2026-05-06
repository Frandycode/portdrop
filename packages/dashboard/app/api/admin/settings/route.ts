/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin settings: change password
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminCredentials, verifyPassword, saveAdminCredentials } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const cookie = cookies().get('portdrop_admin')?.value;
  if (!cookie || cookie.length < 10) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { currentPassword, newPassword, confirmPassword } = await req.json().catch(() => ({}));

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 422 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 422 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'New passwords do not match.' }, { status: 422 });
  }

  const creds  = await getAdminCredentials();
  const secret = process.env.ADMIN_SECRET;

  const currentValid = creds
    ? verifyPassword(currentPassword, creds.passwordHash, creds.salt)
    : currentPassword === secret;

  if (!currentValid) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  await saveAdminCredentials(newPassword);

  // Invalidate current session — user must log in again with new password
  const res = NextResponse.json({ ok: true });
  res.cookies.set('portdrop_admin', '', { maxAge: 0, path: '/' });
  return res;
}
