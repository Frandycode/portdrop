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

export type SessionResult =
  | { type: 'ok';           data: SessionData }
  | { type: 'pin-required'; sessionId: string }
  | { type: 'not-found' };

/**
 * Validates a session ID by calling the local API route, which proxies
 * to the PortDrop extension relay.
 *
 * Pass `pin` on a second call after the viewer enters their code.
 */
export async function validateSession(
  sessionId: string,
  pin?: string,
): Promise<SessionResult> {
  try {
    const url = pin
      ? `http://localhost:3001/api/sessions/${sessionId}?pin=${encodeURIComponent(pin)}`
      : `http://localhost:3001/api/sessions/${sessionId}`;

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) return { type: 'not-found' };

    const data = await res.json();

    // Relay signals PIN gate — don't expose session data yet
    if (data.pinRequired === true) {
      return { type: 'pin-required', sessionId: data.sessionId ?? sessionId };
    }

    return {
      type: 'ok',
      data: {
        sessionId:       data.sessionId,
        publicUrl:       data.publicUrl,
        expiresAt:       new Date(data.expiresAt),
        codeViewEnabled: data.codeViewEnabled,
        oneTimeScan:     data.oneTimeScan,
        scanCount:       data.scanCount,
      },
    };
  } catch (err) {
    console.error('[PortDrop:validateSession] Failed:', err);
    return { type: 'not-found' };
  }
}
