/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin CSV export: feedback
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { cookies } from 'next/headers';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest) {
  const cookie = cookies().get('portdrop_admin')?.value;
  if (!cookie || cookie !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await redis.lrange<string>('feedback', 0, -1);
  const entries = raw.map(r => {
    try { return typeof r === 'string' ? JSON.parse(r) : r; } catch { return null; }
  }).filter(Boolean) as { text: string; stars?: number; ts: string }[];

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = [
    'stars,text,submitted_at',
    ...entries.map(e => `${e.stars ?? ''},${escape(e.text)},${e.ts}`),
  ].join('\n');

  return new NextResponse(rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="portdrop-feedback-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
