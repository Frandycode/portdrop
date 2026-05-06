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

const RELAY_BASE = 'http://127.0.0.1:49491';

/**
 * GET /api/code/files?sessionId=X
 *
 * Proxies to the relay /files endpoint which walks the workspace and
 * returns a nested FileNode tree. Only succeeds when codeViewEnabled
 * is true on the session.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? '';

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
  }

  try {
    const relayRes = await fetch(
      `${RELAY_BASE}/files?sessionId=${encodeURIComponent(sessionId)}`,
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
