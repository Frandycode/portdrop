/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — waitlist email capture API route
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR  = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'waitlist.jsonl');

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? '').toString().trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
  }

  try {
    mkdirSync(DATA_DIR, { recursive: true });
    appendFileSync(DATA_FILE, JSON.stringify({ email, ts: new Date().toISOString() }) + '\n');
  } catch (err) {
    console.error('[PortDrop:waitlist] Write failed:', err);
    return NextResponse.json({ error: 'Could not save your email. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
