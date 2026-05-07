/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — session config snapshot (no scan increment), reads Redis
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { redis }        from '@/lib/redis';
import type { RedisSession } from '@/app/api/sessions/register/route';

/**
 * GET /api/sessions/[sessionId]/peek
 *
 * Returns the current expiresAt, maxUsers, and scanCount without incrementing
 * the scan counter. Used by:
 *   - Guest dashboard to poll for admin-driven TTL / cap changes in near-real time
 *   - Extension to sync live scan count back to the sidebar and access log
 */
export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } },
) {
  const { sessionId } = params;

  try {
    const raw = await redis.get(`session:${sessionId}`);
    if (!raw) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const session = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RedisSession;

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (Date.now() >= new Date(session.expiresAt).getTime()) {
      await redis.del(`session:${sessionId}`).catch(() => {});
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({
      expiresAt: session.expiresAt,
      maxUsers:  session.maxUsers  ?? null,
      scanCount: session.scanCount,
    });
  } catch (err) {
    console.error('[PortDrop:peek] Redis error:', err);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
