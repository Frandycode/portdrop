/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — session API route, reads from Upstash Redis
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createHash }   from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { redis }        from '@/lib/redis';
import type { RedisSession } from '@/app/api/sessions/register/route';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const { sessionId } = params;
  const pin = req.nextUrl.searchParams.get('pin') ?? undefined;

  let session: RedisSession;
  try {
    const raw = await redis.get(`session:${sessionId}`);
    if (!raw) {
      return NextResponse.json(
        { error: 'Session not found or extension not running.', sessionId },
        { status: 503 },
      );
    }
    session = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RedisSession;
  } catch (err) {
    console.error('[PortDrop:sessions] Redis error:', err);
    return NextResponse.json({ error: 'Redis unavailable', sessionId }, { status: 503 });
  }

  if (session.status !== 'active') {
    return NextResponse.json({ error: 'Session stopped.', sessionId }, { status: 404 });
  }
  if (Date.now() >= new Date(session.expiresAt).getTime()) {
    await redis.del(`session:${sessionId}`).catch(() => {});
    return NextResponse.json({ error: 'Session expired.', sessionId }, { status: 404 });
  }

  // PIN gate
  if (session.pinHash) {
    if (!pin) {
      return NextResponse.json({ pinRequired: true, sessionId }, { status: 200 });
    }
    const inputHash = createHash('sha256').update(pin).digest('hex');
    if (inputHash !== session.pinHash) {
      return NextResponse.json({ error: 'wrong_pin', sessionId }, { status: 401 });
    }
  }

  if (session.burned) {
    return NextResponse.json({ error: 'one_time_burned', sessionId }, { status: 410 });
  }
  if (session.oneTimeScan && session.scanCount >= 1) {
    await _updateSession(sessionId, { ...session, burned: true });
    return NextResponse.json({ error: 'one_time_burned', sessionId }, { status: 410 });
  }

  if (session.maxUsers !== null && session.maxUsers !== undefined && session.scanCount >= session.maxUsers) {
    return NextResponse.json({ error: 'capacity_full', sessionId }, { status: 403 });
  }

  const updated = { ...session, scanCount: session.scanCount + 1 };
  await _updateSession(sessionId, updated);

  return NextResponse.json({
    sessionId:       updated.sessionId,
    publicUrl:       updated.publicUrl,
    expiresAt:       updated.expiresAt,
    codeViewEnabled: updated.codeViewEnabled,
    oneTimeScan:     updated.oneTimeScan,
    scanCount:       updated.scanCount,
    maxUsers:        updated.maxUsers,
  });
}

/**
 * PATCH /api/sessions/[sessionId]
 *
 * Allows the extension to push admin-driven changes (TTL, viewer cap,
 * scan count reset) back into Redis so the live dashboard reflects them.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const { sessionId } = params;

  let body: { expiresAt?: string; maxUsers?: number | null; scanCount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    const raw = await redis.get(`session:${sessionId}`);
    if (!raw) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const session = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RedisSession;

    const updated: RedisSession = {
      ...session,
      ...(body.expiresAt  !== undefined && { expiresAt: body.expiresAt }),
      ...(body.maxUsers   !== undefined && { maxUsers:  body.maxUsers  }),
      ...(body.scanCount  !== undefined && { scanCount: body.scanCount }),
    };

    const expiresMs = new Date(updated.expiresAt).getTime() - Date.now();
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify(updated),
      { ex: Math.max(60, Math.ceil(expiresMs / 1_000)) },
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PortDrop:patch]', err);
    return NextResponse.json({ error: 'redis_error' }, { status: 500 });
  }
}

async function _updateSession(sessionId: string, session: RedisSession): Promise<void> {
  const ttl = await redis.ttl(`session:${sessionId}`);
  await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: Math.max(60, ttl) });
}
