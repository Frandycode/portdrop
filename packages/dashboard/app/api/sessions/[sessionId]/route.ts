/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — session validation API endpoint, proxies to extension relay
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';

/** Must match RELAY_PORT in packages/extension/src/relay/server.ts */
const RELAY_BASE = 'http://127.0.0.1:49491';

/**
 * GET /api/sessions/[sessionId]
 *
 * Proxies the request to the PortDrop extension relay running on localhost.
 * The relay owns the in-memory session store and handles scan-count tracking.
 *
 * Returns 503 if the extension is not running (relay unreachable).
 * Returns 404 if the session is expired, burned, or unknown.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const { sessionId } = params;
  const pin = req.nextUrl.searchParams.get('pin');

  const relayUrl = pin
    ? `${RELAY_BASE}/sessions/${sessionId}?pin=${encodeURIComponent(pin)}`
    : `${RELAY_BASE}/sessions/${sessionId}`;

  try {
    const relayRes = await fetch(relayUrl, {
      // Short timeout — if the extension isn't running we fail fast
      signal: AbortSignal.timeout(3_000),
    });

    const body = await relayRes.json();

    if (!relayRes.ok) {
      return NextResponse.json(body, { status: relayRes.status });
    }

    // Re-hydrate the expiresAt ISO string back to a value the client can use
    return NextResponse.json(body, { status: 200 });

  } catch (err) {
    console.error('[PortDrop:Dashboard] Relay unreachable:', err);
    return NextResponse.json(
      {
        error: 'PortDrop extension is not running. Open VS Code and start a session.',
        sessionId,
      },
      { status: 503 },
    );
  }
}
