/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — shared session types used across store, manager, and API
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type TTLOption = '15m' | '1h' | '4h';

export type SessionStatus = 'active' | 'expired' | 'stopped';

/** Hard system ceiling — no session may exceed this viewer count. */
export const SYSTEM_MAX_USERS = 10;

export interface SessionRecord {
  /** Unique session ID — nanoid, URL-safe */
  sessionId: string;

  /** The public trycloudflare.com URL */
  publicUrl: string;

  /** Base64 PNG data URI of the QR code */
  qrDataUri: string;

  /** Port on the developer's machine being tunneled */
  port: number;

  /** Chosen TTL bucket */
  ttl: TTLOption;

  /** Whether the QR code burns after first scan */
  oneTimeScan: boolean;

  /** Whether Code View is active (Phase 2) */
  codeViewEnabled: boolean;

  /** When the session was created */
  startedAt: Date;

  /** Hard expiry — tunnel is killed at this time */
  expiresAt: Date;

  /** Current lifecycle state */
  status: SessionStatus;

  /** How many times the QR has been scanned */
  scanCount: number;

  /** SHA-256 hex hash of the 4-digit PIN; undefined = no PIN required */
  pinHash?: string;

  /**
   * Max number of distinct viewers allowed. Undefined = unlimited (up to
   * SYSTEM_MAX_USERS). Ignored when oneTimeScan is true (implicitly 1).
   */
  maxUsers?: number;

  /**
   * Set to true after a one-time-scan link is successfully consumed.
   * Keeps the record alive so callers can distinguish "burned" from "wrong PIN".
   * The TTL timer still cleans up the record normally.
   */
  burned?: boolean;
}

/** Public-safe projection sent to the dashboard — no internal fields */
export interface PublicSession {
  sessionId: string;
  publicUrl: string;
  expiresAt: Date;
  codeViewEnabled: boolean;
  oneTimeScan: boolean;
  scanCount: number;
  maxUsers?: number;
}

/** Discriminated result returned by SessionStore.access() */
export type AccessResult =
  | { ok: true;  data: PublicSession }
  | { ok: false; reason: 'not_found' | 'wrong_pin' | 'one_time_burned' | 'capacity_full' };

/** Payload emitted by SessionStore on the 'updated' event */
export interface SessionUpdate {
  expiresAt?: Date;
  maxUsers?:  number | null; // null = cap removed (unlimited)
}
