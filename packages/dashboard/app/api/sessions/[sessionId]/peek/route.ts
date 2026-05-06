/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — session config snapshot proxy (no scan increment)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';

/** Must match RELAY_PORT in packages/extension/src/relay/server.ts */
const RELAY_BASE = 'http://127.0.0.1:49491';

/**
 * GET /api/sessions/[sessionId]/peek
 *
 * Returns the current expiresAt, maxUsers, and scanCount without incrementing
 * the scan counter. Used by the dashboard to poll for admin-driven updates
 * (TTL adjustments, viewer cap changes) and notify guests in near-real time.
 */
export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } },
) {
  const { sessionId } = params;

  try {
    const relayRes = await fetch(
      `${RELAY_BASE}/sessions/${sessionId}/peek`,
      { cache: 'no-store', signal: AbortSignal.timeout(3_000) },
    );

    if (!relayRes.ok) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const data = await relayRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'relay_unavailable' }, { status: 503 });
  }
}
