/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — server-side session validation, reads from Upstash Redis
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createHash } from 'crypto';
import { redis } from './redis';
import type { RedisSession } from '@/app/api/sessions/register/route';

export interface SessionData {
  sessionId:       string;
  publicUrl:       string;
  expiresAt:       Date;
  codeViewEnabled: boolean;
  oneTimeScan:     boolean;
  scanCount:       number;
  maxUsers?:       number;
}

export type SessionResult =
  | { type: 'ok';           data: SessionData }
  | { type: 'pin-required'; sessionId: string }
  | { type: 'wrong-pin';    sessionId: string }
  | { type: 'capacity-full' }
  | { type: 'one-time-burned' }
  | { type: 'relay-down' }
  | { type: 'not-found' };

export async function validateSession(
  sessionId: string,
  pin?: string,
): Promise<SessionResult> {
  let session: RedisSession;

  try {
    const raw = await redis.get(`session:${sessionId}`);
    if (!raw) return { type: 'relay-down' };
    session = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RedisSession;
  } catch (err) {
    console.error('[PortDrop:validateSession] Redis error:', err);
    return { type: 'relay-down' };
  }

  if (session.status !== 'active') return { type: 'not-found' };
  if (Date.now() >= new Date(session.expiresAt).getTime()) {
    await redis.del(`session:${sessionId}`).catch(() => {});
    return { type: 'not-found' };
  }

  // PIN gate
  if (session.pinHash) {
    if (!pin) return { type: 'pin-required', sessionId };
    const inputHash = createHash('sha256').update(pin).digest('hex');
    if (inputHash !== session.pinHash) return { type: 'wrong-pin', sessionId };
  }

  // One-time-scan already burned
  if (session.burned) return { type: 'one-time-burned' };

  // Burn on first access for one-time-scan
  if (session.oneTimeScan && session.scanCount >= 1) {
    await _updateSession(sessionId, { ...session, burned: true });
    return { type: 'one-time-burned' };
  }

  // Viewer cap
  if (session.maxUsers !== null && session.maxUsers !== undefined && session.scanCount >= session.maxUsers) {
    return { type: 'capacity-full' };
  }

  // Increment scan count
  const updated = { ...session, scanCount: session.scanCount + 1 };
  await _updateSession(sessionId, updated);

  return {
    type: 'ok',
    data: {
      sessionId:       updated.sessionId,
      publicUrl:       updated.publicUrl,
      expiresAt:       new Date(updated.expiresAt),
      codeViewEnabled: updated.codeViewEnabled,
      oneTimeScan:     updated.oneTimeScan,
      scanCount:       updated.scanCount,
      maxUsers:        updated.maxUsers ?? undefined,
    },
  };
}

async function _updateSession(sessionId: string, session: RedisSession): Promise<void> {
  const ttl = await redis.ttl(`session:${sessionId}`);
  await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: Math.max(60, ttl) });
}
