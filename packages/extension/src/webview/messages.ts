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
  | ScanReceivedMessage;

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
}

export interface SessionStoppedMessage {
  type: 'SESSION_STOPPED';
}

export interface SessionExpiredMessage {
  type: 'SESSION_EXPIRED';
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
  | OpenDashboardRequestMessage;

export interface StopRequestMessage {
  type: 'REQUEST_STOP';
}

export interface CopyUrlRequestMessage {
  type: 'REQUEST_COPY_URL';
}

export interface OpenDashboardRequestMessage {
  type: 'REQUEST_OPEN_DASHBOARD';
}
