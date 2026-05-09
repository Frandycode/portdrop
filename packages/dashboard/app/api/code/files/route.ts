/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — code view file tree proxy
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis }                     from '@/lib/redis';
import type { RedisSession }         from '@/app/api/sessions/register/route';

/**
 * GET /api/code/files?sessionId=X
 *
 * Looks up the session's relayUrl from Redis, then proxies to the relay
 * /files endpoint which walks the workspace and returns a nested FileNode
 * tree. Only succeeds when codeViewEnabled is true on the session.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? '';

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
  }

  const raw = await redis.get(`session:${sessionId}`).catch(() => null);
  if (!raw) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  const session = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RedisSession;

  if (!session.codeViewEnabled || !session.relayUrl) {
    return NextResponse.json({ error: 'Code view not enabled for this session.' }, { status: 403 });
  }

  try {
    const relayRes = await fetch(
      `${session.relayUrl}/files?sessionId=${encodeURIComponent(sessionId)}`,
      { signal: AbortSignal.timeout(5_000) },
    );

    const body = await relayRes.json();
    return NextResponse.json(body, { status: relayRes.status });

  } catch (err) {
    console.error('[PortDrop:Dashboard] /api/code/files relay unreachable:', err);
    return NextResponse.json(
      { error: 'PortDrop extension is not running.' },
      { status: 503 },
    );
  }
}
