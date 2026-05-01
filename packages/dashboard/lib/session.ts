/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — server-side session validation, calls relay via API route
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface SessionData {
  sessionId:       string;
  publicUrl:       string;
  expiresAt:       Date;
  codeViewEnabled: boolean;
  oneTimeScan:     boolean;
  scanCount:       number;
}

/**
 * Validates a session ID by calling the local API route, which proxies
 * to the PortDrop extension relay.
 *
 * Returns null if the session is expired, burned, unknown, or the
 * extension relay is unreachable.
 */
export async function validateSession(sessionId: string): Promise<SessionData | null> {
  try {
    const res = await fetch(
      `http://localhost:3001/api/sessions/${sessionId}`,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;

    const data = await res.json();

    return {
      sessionId:       data.sessionId,
      publicUrl:       data.publicUrl,
      expiresAt:       new Date(data.expiresAt), // ISO string → Date
      codeViewEnabled: data.codeViewEnabled,
      oneTimeScan:     data.oneTimeScan,
      scanCount:       data.scanCount,
    };
  } catch (err) {
    console.error('[PortDrop:validateSession] Failed:', err);
    return null;
  }
}
