/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — postMessage contract between extension host and sidebar webview
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Extension → Webview messages ─────────────────────────────────────────────

export type ExtensionMessage =
  | SessionStartedMessage
  | SessionStoppedMessage
  | SessionExpiredMessage
  | ScanReceivedMessage
  | SessionUpdatedMessage
  | ViewersResetMessage
  | RelayErrorMessage;

export interface SessionStartedMessage {
  type:         'SESSION_STARTED';
  sessionId:    string;
  publicUrl:    string;
  qrDataUri:    string;
  expiresAt:    string; // ISO string — Date is not serializable over postMessage
  ttl:          string;
  port:         number;
  pin?:         string;   // raw PIN shown to the developer; undefined = no PIN
  oneTimeScan?: boolean;  // true = link burns after first successful open
  maxUsers?:    number;   // undefined = unlimited
}

export interface SessionUpdatedMessage {
  type:      'SESSION_UPDATED';
  expiresAt?: string;       // ISO string — new expiry if TTL was adjusted
  maxUsers?:  number | null; // null = cap removed; number = new cap
}

export interface SessionStoppedMessage {
  type: 'SESSION_STOPPED';
}

export interface SessionExpiredMessage {
  type: 'SESSION_EXPIRED';
}

export interface ViewersResetMessage {
  type: 'VIEWERS_RESET';
}

export interface RelayErrorMessage {
  type:    'RELAY_ERROR';
  message: string;
}

export interface ScanReceivedMessage {
  type:      'SCAN_RECEIVED';
  scanCount: number;
  at:        string; // ISO timestamp of this scan
}

// ── Webview → Extension messages ──────────────────────────────────────────────

export type WebviewMessage =
  | StopRequestMessage
  | CopyUrlRequestMessage
  | OpenDashboardRequestMessage
  | AdjustTTLRequestMessage
  | UpdateMaxUsersRequestMessage
  | ResetViewersRequestMessage;

export interface StopRequestMessage {
  type: 'REQUEST_STOP';
}

export interface CopyUrlRequestMessage {
  type: 'REQUEST_COPY_URL';
}

export interface OpenDashboardRequestMessage {
  type: 'REQUEST_OPEN_DASHBOARD';
}

export interface AdjustTTLRequestMessage {
  type:    'REQUEST_ADJUST_TTL';
  deltaMs: number; // positive = extend, negative = shrink
}

export interface UpdateMaxUsersRequestMessage {
  type:     'REQUEST_UPDATE_USERS';
  maxUsers: number | undefined; // undefined = remove cap (unlimited)
}

export interface ResetViewersRequestMessage {
  type: 'REQUEST_RESET_VIEWERS';
}
