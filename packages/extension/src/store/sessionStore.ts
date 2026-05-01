/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — in-memory session store, singleton, TTL and scan tracking
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { SessionRecord, PublicSession, TTLOption } from './types';

// ── TTL map ───────────────────────────────────────────────────────────────────

const TTL_MS: Record<TTLOption, number> = {
  '15m': 15 * 60 * 1_000,
  '1h':  60 * 60 * 1_000,
  '4h':  4  * 60 * 60 * 1_000,
};

// ── Store events ──────────────────────────────────────────────────────────────

export type StoreEvents = EventEmitter & {
  on(event: 'expired', listener: (sessionId: string) => void): StoreEvents;
  on(event: 'stopped', listener: (sessionId: string) => void): StoreEvents;
  on(event: 'scanned', listener: (sessionId: string, count: number) => void): StoreEvents;
};

// ── SessionStore ──────────────────────────────────────────────────────────────

/**
 * Singleton in-memory store that tracks all active PortDrop sessions.
 *
 * Responsibilities:
 *  - Generate unique session IDs
 *  - Store session records keyed by sessionId
 *  - Enforce TTL by scheduling auto-expiry timers
 *  - Track scan counts and enforce one-time-scan burn
 *  - Emit lifecycle events: 'expired', 'stopped', 'scanned'
 *
 * Phase 3: replace with PostgreSQL-backed store via FastAPI.
 */
export class SessionStore extends EventEmitter {
  private static instance: SessionStore;

  private readonly sessions = new Map<string, SessionRecord>();
  private readonly timers   = new Map<string, NodeJS.Timeout>();

  private constructor() {
    super();
  }

  static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore();
    }
    return SessionStore.instance;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  /**
   * Creates a new session record, starts its TTL timer, and returns the full record.
   */
  create(params: {
    publicUrl: string;
    qrDataUri: string;
    port: number;
    ttl: TTLOption;
    customMs?: number;
    oneTimeScan: boolean;
    codeViewEnabled: boolean;
  }): SessionRecord {
    const sessionId = this.generateId();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + (params.customMs ?? TTL_MS[params.ttl]));

    const record: SessionRecord = {
      sessionId,
      publicUrl:       params.publicUrl,
      qrDataUri:       params.qrDataUri,
      port:            params.port,
      ttl:             params.ttl,
      oneTimeScan:     params.oneTimeScan,
      codeViewEnabled: params.codeViewEnabled,
      startedAt,
      expiresAt,
      status:          'active',
      scanCount:       0,
    };

    this.sessions.set(sessionId, record);
    this.scheduleExpiry(sessionId, expiresAt);

    console.log(`[PortDrop:Store] Session created: ${sessionId} (TTL: ${params.ttl})`);
    return record;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /** Returns the full record — for internal use only. */
  get(sessionId: string): SessionRecord | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Returns the public projection of an active session, and increments
   * the scan count. Returns null if the session is expired, stopped,
   * or burned (one-time-scan already used).
   */
  access(sessionId: string): PublicSession | null {
    const record = this.sessions.get(sessionId);

    if (!record || record.status !== 'active') return null;
    if (new Date() >= record.expiresAt)         return null;

    // One-time-scan burn
    if (record.oneTimeScan && record.scanCount >= 1) {
      console.log(`[PortDrop:Store] One-time session burned: ${sessionId}`);
      this.expire(sessionId);
      return null;
    }

    record.scanCount += 1;
    this.emit('scanned', sessionId, record.scanCount);
    console.log(`[PortDrop:Store] Session accessed: ${sessionId} (scans: ${record.scanCount})`);

    return this.toPublic(record);
  }

  /** Lists all currently active sessions (for status bar / sidebar). */
  listActive(): SessionRecord[] {
    return [...this.sessions.values()].filter((s) => s.status === 'active');
  }

  // ── Stop ──────────────────────────────────────────────────────────────────

  /** Marks a session as stopped and clears its TTL timer. */
  stop(sessionId: string): void {
    const record = this.sessions.get(sessionId);
    if (!record) return;

    record.status = 'stopped';
    this.clearTimer(sessionId);
    this.emit('stopped', sessionId);
    console.log(`[PortDrop:Store] Session stopped: ${sessionId}`);
  }

  // ── Expire ────────────────────────────────────────────────────────────────

  /** Marks a session as expired (TTL reached or one-time burned). */
  expire(sessionId: string): void {
    const record = this.sessions.get(sessionId);
    if (!record) return;

    record.status = 'expired';
    this.clearTimer(sessionId);
    this.emit('expired', sessionId);
    console.log(`[PortDrop:Store] Session expired: ${sessionId}`);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  /** Removes all sessions from memory — called on extension deactivate. */
  clear(): void {
    for (const sessionId of this.timers.keys()) {
      this.clearTimer(sessionId);
    }
    this.sessions.clear();
    console.log('[PortDrop:Store] All sessions cleared.');
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private scheduleExpiry(sessionId: string, expiresAt: Date): void {
    const delay = expiresAt.getTime() - Date.now();
    const timer = setTimeout(() => this.expire(sessionId), delay);
    this.timers.set(sessionId, timer);
  }

  private clearTimer(sessionId: string): void {
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(sessionId);
    }
  }

  private generateId(): string {
    // 16 random bytes → 32-char hex string — URL-safe, no dependencies
    return randomBytes(16).toString('hex');
  }

  private toPublic(record: SessionRecord): PublicSession {
    return {
      sessionId:       record.sessionId,
      publicUrl:       record.publicUrl,
      expiresAt:       record.expiresAt,
      codeViewEnabled: record.codeViewEnabled,
      oneTimeScan:     record.oneTimeScan,
      scanCount:       record.scanCount,
    };
  }
}

/** Convenience export — use this everywhere instead of constructing directly. */
export const sessionStore = SessionStore.getInstance();
