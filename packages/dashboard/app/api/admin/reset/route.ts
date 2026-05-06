/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin password recovery via ADMIN_SECRET
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveAdminCredentials } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const { recoveryKey, newPassword, confirmPassword } = await req.json().catch(() => ({}));

  if (!recoveryKey || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 422 });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Recovery is not configured on this deployment.' }, { status: 503 });
  }

  if (recoveryKey !== secret) {
    return NextResponse.json({ error: 'Invalid recovery key.' }, { status: 401 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 422 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 422 });
  }

  await saveAdminCredentials(newPassword);
  return NextResponse.json({ ok: true });
}
