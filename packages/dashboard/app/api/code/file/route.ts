/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — code view single file content proxy
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';

const RELAY_BASE = 'http://127.0.0.1:49491';

/**
 * GET /api/code/file?sessionId=X&path=X
 *
 * Proxies to the relay /file endpoint which reads a single file from
 * the workspace and returns { content, path }. The relay enforces the
 * path traversal guard and blocklist — this route just proxies.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? '';
  const filePath  = req.nextUrl.searchParams.get('path')      ?? '';

  if (!sessionId || !filePath) {
    return NextResponse.json({ error: 'sessionId and path are required.' }, { status: 400 });
  }

  try {
    const relayRes = await fetch(
      `${RELAY_BASE}/file?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(filePath)}`,
      { signal: AbortSignal.timeout(5_000) },
    );

    const body = await relayRes.json();
    return NextResponse.json(body, { status: relayRes.status });

  } catch (err) {
    console.error('[PortDrop:Dashboard] /api/code/file relay unreachable:', err);
    return NextResponse.json(
      { error: 'PortDrop extension is not running.' },
      { status: 503 },
    );
  }
}
