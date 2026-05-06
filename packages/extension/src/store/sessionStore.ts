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
import { randomBytes, createHash } from 'crypto';
import { SessionRecord, PublicSession, AccessResult, SessionUpdate, TTLOption, SYSTEM_MAX_USERS } from './types';

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
  on(event: 'scanned', listener: (sessionId: string, count: number, at: Date) => void): StoreEvents;
  on(event: 'updated', listener: (sessionId: string, update: SessionUpdate) => void): StoreEvents;
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
    pin?: string;
    maxUsers?: number;
  }): SessionRecord {
    const sessionId = this.generateId();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + (params.customMs ?? TTL_MS[params.ttl]));

    // Clamp caller-supplied maxUsers to the system ceiling; ignore for one-time-scan
    const maxUsers = params.oneTimeScan
      ? undefined
      : params.maxUsers !== undefined
        ? Math.min(Math.max(1, params.maxUsers), SYSTEM_MAX_USERS)
        : undefined;

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
      pinHash:         params.pin ? createHash('sha256').update(params.pin).digest('hex') : undefined,
      maxUsers,
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
   * Checks whether a session exists and is active without touching scan count.
   * Returns { pinRequired } so the relay can gate access before calling access().
   * Returns null if the session is not found or already expired/stopped.
   */
  peek(sessionId: string): { pinRequired: boolean } | null {
    const record = this.sessions.get(sessionId);
    if (!record || record.status !== 'active') return null;
    if (new Date() >= record.expiresAt)         return null;
    return { pinRequired: !!record.pinHash };
  }

  /**
   * Returns the public projection of an active session and increments the scan
   * count. Pass the raw 4-digit PIN when the session is PIN-protected.
   *
   * Returns a discriminated AccessResult so callers can distinguish failure
   * reasons (wrong PIN vs. already claimed vs. session full vs. not found).
   */
  access(sessionId: string, pin?: string): AccessResult {
    const record = this.sessions.get(sessionId);

    if (!record || record.status !== 'active') return { ok: false, reason: 'not_found' };
    if (new Date() >= record.expiresAt)         return { ok: false, reason: 'not_found' };

    // Already burned by a previous one-time-scan access
    if (record.burned) return { ok: false, reason: 'one_time_burned' };

    // PIN verification
    if (record.pinHash) {
      if (!pin) return { ok: false, reason: 'wrong_pin' };
      const inputHash = createHash('sha256').update(pin).digest('hex');
      if (inputHash !== record.pinHash) {
        console.log(`[PortDrop:Store] Wrong PIN for session: ${sessionId}`);
        return { ok: false, reason: 'wrong_pin' };
      }
    }

    // One-time-scan — mark burned but keep record alive so the next caller
    // sees 'one_time_burned' instead of a confusing 'not_found'.
    // The TTL timer still cleans up the record on schedule.
    if (record.oneTimeScan && record.scanCount >= 1) {
      console.log(`[PortDrop:Store] One-time session burned: ${sessionId}`);
      record.burned = true;
      return { ok: false, reason: 'one_time_burned' };
    }

    // Max-user cap
    if (record.maxUsers !== undefined && record.scanCount >= record.maxUsers) {
      console.log(`[PortDrop:Store] Session full (${record.scanCount}/${record.maxUsers}): ${sessionId}`);
      return { ok: false, reason: 'capacity_full' };
    }

    record.scanCount += 1;
    this.emit('scanned', sessionId, record.scanCount, new Date());
    console.log(`[PortDrop:Store] Session accessed: ${sessionId} (scans: ${record.scanCount})`);

    return { ok: true, data: this.toPublic(record) };
  }

  // ── Admin updates ─────────────────────────────────────────────────────────

  /**
   * Updates the max-viewer cap on a live session.
   * Pass undefined to remove the cap entirely.
   * Returns false if the session is not found or not active.
   */
  updateMaxUsers(sessionId: string, newMax: number | undefined): boolean {
    const record = this.sessions.get(sessionId);
    if (!record || record.status !== 'active') return false;

    record.maxUsers = newMax !== undefined
      ? Math.min(Math.max(1, newMax), SYSTEM_MAX_USERS)
      : undefined;

    this.emit('updated', sessionId, { maxUsers: record.maxUsers ?? null });
    console.log(`[PortDrop:Store] maxUsers updated: ${sessionId} → ${record.maxUsers ?? '∞'}`);
    return true;
  }

  /**
   * Shifts the session expiry by deltaMs (positive = extend, negative = shrink).
   * Clamped: minimum 60s remaining, maximum 4h from now.
   * Returns false if the session is not found or not active.
   */
  adjustTTL(sessionId: string, deltaMs: number): boolean {
    const record = this.sessions.get(sessionId);
    if (!record || record.status !== 'active') return false;

    const now = Date.now();
    const min = now + 60_000;
    const max = now + 4 * 60 * 60_000;
    const raw = record.expiresAt.getTime() + deltaMs;
    record.expiresAt = new Date(Math.max(min, Math.min(max, raw)));

    this.clearTimer(sessionId);
    this.scheduleExpiry(sessionId, record.expiresAt);

    this.emit('updated', sessionId, { expiresAt: record.expiresAt });
    console.log(`[PortDrop:Store] TTL adjusted: ${sessionId} → ${record.expiresAt.toISOString()}`);
    return true;
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
      maxUsers:        record.maxUsers,
    };
  }
}

/** Convenience export — use this everywhere instead of constructing directly. */
export const sessionStore = SessionStore.getInstance();
