/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — VS Code sidebar webview root component
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useReducer, useState } from 'react';
import { ExtensionMessage, SessionStartedMessage, ScanReceivedMessage } from './messages';
import { vscode } from './vscode-api';
import { QRPanel }            from './components/QRPanel';
import { TTLClock }           from './components/TTLClock';
import { SessionConfig }      from './components/SessionConfig';
import { AccessLog }          from './components/AccessLog';
import { CodeBreederBadge }   from './components/CodeBreederBadge';

// ── Domain types (consumed by child components in later steps) ────────────────

const SYSTEM_MAX_USERS = 10;

export interface ScanEntry {
  n:  number;
  at: string; // ISO timestamp
}

export interface ActiveSession {
  sessionId:    string;
  publicUrl:    string;
  qrDataUri:    string;
  expiresAt:    Date;
  ttl:          string;
  port:         number;
  pin?:         string;
  oneTimeScan?: boolean;
  maxUsers?:    number;
  scanCount:    number;
  scanLog:      ScanEntry[];
}

// ── State machine ─────────────────────────────────────────────────────────────

type AppState =
  | { status: 'loading' }
  | { status: 'idle' }
  | { status: 'active'; session: ActiveSession }
  | { status: 'expired' }
  | { status: 'relay-error'; message: string };

type Action =
  | { type: 'LOADED_IDLE' }
  | { type: 'SESSION_STARTED'; msg: SessionStartedMessage }
  | { type: 'SESSION_STOPPED' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SCAN_RECEIVED';   msg: ScanReceivedMessage }
  | { type: 'SESSION_UPDATED'; expiresAt?: string; maxUsers?: number | null }
  | { type: 'VIEWERS_RESET' }
  | { type: 'RELAY_ERROR';     message: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOADED_IDLE':
      return state.status === 'loading' ? { status: 'idle' } : state;

    case 'SESSION_STARTED': {
      const { msg } = action;
      return {
        status: 'active',
        session: {
          sessionId:    msg.sessionId,
          publicUrl:    msg.publicUrl,
          qrDataUri:    msg.qrDataUri,
          expiresAt:    new Date(msg.expiresAt),
          ttl:          msg.ttl,
          port:         msg.port,
          pin:          msg.pin,
          oneTimeScan:  msg.oneTimeScan,
          maxUsers:     msg.maxUsers,
          scanCount:    0,
          scanLog:      [],
        },
      };
    }

    case 'SESSION_UPDATED': {
      if (state.status !== 'active') return state;
      return {
        ...state,
        session: {
          ...state.session,
          ...(action.expiresAt && { expiresAt: new Date(action.expiresAt) }),
          ...(action.maxUsers !== undefined && {
            maxUsers: action.maxUsers === null ? undefined : action.maxUsers,
          }),
        },
      };
    }

    case 'SESSION_STOPPED':
      return { status: 'idle' };

    case 'SESSION_EXPIRED':
      return { status: 'expired' };

    case 'RELAY_ERROR':
      return { status: 'relay-error', message: action.message };

    case 'SCAN_RECEIVED': {
      if (state.status !== 'active') return state;
      const { msg } = action;
      return {
        ...state,
        session: {
          ...state.session,
          scanCount: msg.scanCount,
          scanLog:   [...state.session.scanLog, { n: msg.scanCount, at: msg.at }],
        },
      };
    }

    case 'VIEWERS_RESET': {
      if (state.status !== 'active') return state;
      return {
        ...state,
        session: { ...state.session, scanCount: 0, scanLog: [] },
      };
    }

    default:
      return state;
  }
}

// ── Outbound helper ───────────────────────────────────────────────────────────

function sendMsg(msg: WebviewMessage) {
  vscode.postMessage(msg);
}

// ── Flash button ─────────────────────────────────────────────────────────────

function FlashButton({
  className,
  label,
  flashLabel,
  duration = 1500,
  onClick,
}: {
  className?:  string;
  label:       string;
  flashLabel:  string;
  duration?:   number;
  onClick:     () => void;
}) {
  const [flashing, setFlashing] = useState(false);

  const handleClick = () => {
    onClick();
    setFlashing(true);
    setTimeout(() => setFlashing(false), duration);
  };

  return (
    <button className={className} onClick={handleClick} disabled={flashing}>
      {flashing ? flashLabel : label}
    </button>
  );
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="pd-skeleton">
      <div className="pd-skel-block pd-skel-logo" />
      <div className="pd-skel-block pd-skel-title" />
      <div className="pd-skel-block pd-skel-text" />
      <div className="pd-skel-block pd-skel-text short" />
    </div>
  );
}

function IdleView() {
  return (
    <div className="pd-idle">
      <div className="pd-idle-logo">
        {/* Tricolor logo — transparent bg, rings and plug only */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" width="96" height="96">
          {/* Outer tricolor arc */}
          <path d="M 0,-69 A 69,69 0 0,1 59.76,34.5" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M 59.76,34.5 A 69,69 0 0,1 -59.76,34.5" fill="none" stroke="#eab308" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M -59.76,34.5 A 69,69 0 0,1 0,-69" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="0" cy="-69" r="3" fill="#10b981"/>
          <circle cx="59.76" cy="34.5" r="3" fill="#eab308"/>
          <circle cx="-59.76" cy="34.5" r="3" fill="#ef4444"/>
          {/* Inner dashed tricolor ring */}
          <path d="M 0,-58 A 58,58 0 0,1 50.23,29" fill="none" stroke="#10b981" strokeWidth="1.0" strokeDasharray="6,4" strokeLinecap="round" opacity="0.85"/>
          <path d="M 50.23,29 A 58,58 0 0,1 -50.23,29" fill="none" stroke="#eab308" strokeWidth="1.0" strokeDasharray="6,4" strokeLinecap="round" opacity="0.85"/>
          <path d="M -50.23,29 A 58,58 0 0,1 0,-58" fill="none" stroke="#ef4444" strokeWidth="1.0" strokeDasharray="6,4" strokeLinecap="round" opacity="0.85"/>
          <circle cx="0" cy="-58" r="2" fill="#10b981"/>
          <circle cx="50.23" cy="29" r="2" fill="#eab308"/>
          <circle cx="-50.23" cy="29" r="2" fill="#ef4444"/>
          {/* Plug body */}
          <rect x="-20" y="-42" width="40" height="30" rx="4" fill="none" stroke="#10b981" strokeWidth="1.5"/>
          {/* Prongs */}
          <line x1="-10" y1="-12" x2="-10" y2="4" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="10" y1="-12" x2="10" y2="4" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="0" y1="4" x2="0" y2="10" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.6"/>
          {/* Socket */}
          <rect x="-26" y="10" width="52" height="30" rx="6" fill="none" stroke="#10b981" strokeWidth="1.5"/>
          <rect x="-14" y="17" width="12" height="16" rx="2" fill="#eab308" opacity="0.85"/>
          <rect x="2" y="17" width="12" height="16" rx="2" fill="#ef4444" opacity="0.85"/>
          {/* Corner rivets */}
          <circle cx="58" cy="-58" r="2.5" fill="#C48540" opacity="0.65"/>
          <circle cx="58" cy="58" r="2.5" fill="#C48540" opacity="0.65"/>
          <circle cx="-58" cy="58" r="2.5" fill="#C48540" opacity="0.65"/>
          <circle cx="-58" cy="-58" r="2.5" fill="#C48540" opacity="0.65"/>
        </svg>
        <span className="pd-wordmark">PortDrop</span>
      </div>
      <p>No active session.</p>
      <p>Run <code>PortDrop: Start Session</code><br />from the Command Palette.</p>
    </div>
  );
}

function ActiveView({ session }: { session: ActiveSession }) {
  return (
    <div className="pd-active">
      <QRPanel dataUri={session.qrDataUri} url={session.publicUrl} />
      <TTLClock expiresAt={session.expiresAt} />

      <div className="pd-scans">Scans: <strong>{session.scanCount}</strong></div>

      {session.oneTimeScan && (
        <div className="pd-ots">&#x26A1; One-time link — burns after first open</div>
      )}

      {session.pin && (
        <div className="pd-pin">
          <span>PIN</span>
          <span className="pd-pin-val">{session.pin}</span>
        </div>
      )}

      {/* ── Admin controls ──────────────────────────────────────────────── */}
      <div className="pd-admin">
        <div className="pd-admin-row">
          <span className="pd-admin-label">TTL</span>
          <button className="pd-adj-btn" onClick={() => sendMsg({ type: 'REQUEST_ADJUST_TTL', deltaMs: -15 * 60_000 })}>−15m</button>
          <button className="pd-adj-btn" onClick={() => sendMsg({ type: 'REQUEST_ADJUST_TTL', deltaMs: 15 * 60_000 })}>+15m</button>
          <button className="pd-adj-btn" onClick={() => sendMsg({ type: 'REQUEST_ADJUST_TTL', deltaMs: 60 * 60_000 })}>+1h</button>
        </div>
        {!session.oneTimeScan && (
          <div className="pd-admin-row">
            <span className="pd-admin-label">Cap</span>
            {session.maxUsers !== undefined && session.maxUsers > 1 && (
              <button className="pd-adj-btn" onClick={() => sendMsg({ type: 'REQUEST_UPDATE_USERS', maxUsers: session.maxUsers! - 1 })}>−1</button>
            )}
            <span className="pd-admin-val">{session.maxUsers ?? '∞'}</span>
            {(session.maxUsers === undefined || session.maxUsers < SYSTEM_MAX_USERS) && (
              <button className="pd-adj-btn" onClick={() => sendMsg({ type: 'REQUEST_UPDATE_USERS', maxUsers: (session.maxUsers ?? 0) + 1 })}>+1</button>
            )}
            {session.maxUsers !== undefined && (
              <button className="pd-adj-btn" onClick={() => sendMsg({ type: 'REQUEST_UPDATE_USERS', maxUsers: undefined })}>∞</button>
            )}
          </div>
        )}
      </div>

      <SessionConfig
        port={session.port}
        ttl={session.ttl}
        pin={session.pin}
        oneTimeScan={session.oneTimeScan}
      />
      <AccessLog
        scanLog={session.scanLog}
        scanCount={session.scanCount}
        maxUsers={session.maxUsers}
      />

      <div className="pd-actions">
        <FlashButton
          className="pd-btn primary"
          label="Copy URL"
          flashLabel="&#x2713; Copied!"
          duration={1500}
          onClick={() => sendMsg({ type: 'REQUEST_COPY_URL' })}
        />
        <FlashButton
          className="pd-btn"
          label="Open in Browser"
          flashLabel="&#x2197; Opening..."
          duration={1000}
          onClick={() => sendMsg({ type: 'REQUEST_OPEN_DASHBOARD' })}
        />
        <FlashButton
          className="pd-btn danger"
          label="Stop Session"
          flashLabel="&#x23F9; Stopping..."
          duration={2000}
          onClick={() => sendMsg({ type: 'REQUEST_STOP' })}
        />
      </div>
    </div>
  );
}

function ExpiredView() {
  return (
    <div className="pd-expired">
      <p>&#x23F1; Session expired.</p>
    </div>
  );
}

function RelayErrorView({ message }: { message: string }) {
  return (
    <div className="pd-relay-error">
      <p>&#x26A0; Relay failed to start.</p>
      <p className="pd-relay-error-detail">{message}</p>
      <p className="pd-relay-error-hint">Reload VS Code to try again.</p>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, { status: 'loading' });

  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'LOADED_IDLE' }), 400);

    const handler = (event: MessageEvent<ExtensionMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'SESSION_STARTED':
          clearTimeout(timer);
          dispatch({ type: 'SESSION_STARTED', msg });
          break;
        case 'SESSION_STOPPED':
          dispatch({ type: 'SESSION_STOPPED' });
          break;
        case 'SESSION_EXPIRED':
          dispatch({ type: 'SESSION_EXPIRED' });
          break;
        case 'SCAN_RECEIVED':
          dispatch({ type: 'SCAN_RECEIVED', msg });
          break;
        case 'SESSION_UPDATED':
          dispatch({ type: 'SESSION_UPDATED', expiresAt: msg.expiresAt, maxUsers: msg.maxUsers });
          break;
        case 'VIEWERS_RESET':
          dispatch({ type: 'VIEWERS_RESET' });
          break;
        case 'RELAY_ERROR':
          clearTimeout(timer);
          dispatch({ type: 'RELAY_ERROR', message: msg.message });
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handler);
    };
  }, []);

  if (state.status === 'loading') return <Skeleton />;

  const view = (() => {
    switch (state.status) {
      case 'idle':        return <IdleView />;
      case 'active':      return <ActiveView session={state.session} />;
      case 'expired':     return <ExpiredView />;
      case 'relay-error': return <RelayErrorView message={state.message} />;
    }
  })();

  return (
    <>
      {view}
      <CodeBreederBadge />
    </>
  );
}
