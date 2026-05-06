/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin setup: first-time account creation
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAccountExists, saveAdminCredentials } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const exists = await adminAccountExists();
  if (exists) {
    return NextResponse.json({ error: 'Admin account already exists. Use Settings to change your password.' }, { status: 409 });
  }

  const { password, confirm } = await req.json().catch(() => ({}));

  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 422 });
  }

  if (password !== confirm) {
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 422 });
  }

  await saveAdminCredentials(password);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const exists = await adminAccountExists();
  return NextResponse.json({ exists });
}
