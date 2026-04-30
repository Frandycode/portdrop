/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — server-side session validation and data types
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface SessionData {
  sessionId: string;
  tunnelUrl: string;
  expiresAt: Date;
  codeViewEnabled: boolean;
  oneTimeScan: boolean;
}

/**
 * Validates a session ID and returns its data if active.
 * Returns null if the session is expired, burned, or unknown.
 *
 * TODO (Phase 1): query the local relay/session store.
 * TODO (Phase 3): query FastAPI + PostgreSQL for cloud-backed sessions.
 */
export async function validateSession(sessionId: string): Promise<SessionData | null> {
  // Stub — no session store yet
  console.log(`[PortDrop] validateSession called for: ${sessionId}`);
  return null;
}
