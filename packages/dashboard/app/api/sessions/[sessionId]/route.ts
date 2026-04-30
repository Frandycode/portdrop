/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — session validation API endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sessions/[sessionId]
 * Validates a session ID and returns its public metadata.
 *
 * TODO (Phase 1): look up session from in-memory store (extension relay).
 * TODO (Phase 3): look up session from PostgreSQL via FastAPI.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  // Stub — always returns not found until Phase 1 wires the session store
  return NextResponse.json(
    { error: 'Session not found', sessionId: params.sessionId },
    { status: 404 },
  );
}
