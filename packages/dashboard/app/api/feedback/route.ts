/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — feedback capture API route
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR  = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'feedback.jsonl');

export async function POST(req: NextRequest) {
  let text: string;
  let stars: number | null;

  try {
    const body = await req.json();
    text  = (body.text  ?? '').toString().trim();
    stars = body.stars != null ? Number(body.stars) : null;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: 'Feedback text is required.' }, { status: 422 });
  }

  if (stars !== null && (stars < 1 || stars > 5 || !Number.isInteger(stars))) {
    return NextResponse.json({ error: 'Stars must be an integer between 1 and 5.' }, { status: 422 });
  }

  try {
    mkdirSync(DATA_DIR, { recursive: true });
    appendFileSync(
      DATA_FILE,
      JSON.stringify({ text, stars, ts: new Date().toISOString() }) + '\n',
    );
  } catch (err) {
    console.error('[PortDrop:feedback] Write failed:', err);
    return NextResponse.json({ error: 'Could not save feedback. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
