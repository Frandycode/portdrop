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
import { QRPanel }       from './components/QRPanel';
import { TTLClock }      from './components/TTLClock';
import { SessionConfig } from './components/SessionConfig';
import { AccessLog }     from './components/AccessLog';

// ── Domain types (consumed by child components in later steps) ────────────────

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
  scanCount:    number;
  scanLog:      ScanEntry[];
}

// ── State machine ─────────────────────────────────────────────────────────────

type AppState =
  | { status: 'loading' }
  | { status: 'idle' }
  | { status: 'active'; session: ActiveSession }
  | { status: 'expired' };

type Action =
  | { type: 'LOADED_IDLE' }
  | { type: 'SESSION_STARTED'; msg: SessionStartedMessage }
  | { type: 'SESSION_STOPPED' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SCAN_RECEIVED';   msg: ScanReceivedMessage };

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
          scanCount:    0,
          scanLog:      [],
        },
      };
    }

    case 'SESSION_STOPPED':
      return { status: 'idle' };

    case 'SESSION_EXPIRED':
      return { status: 'expired' };

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

    default:
      return state;
  }
}

// ── Outbound helper ───────────────────────────────────────────────────────────

function send(type: 'REQUEST_STOP' | 'REQUEST_COPY_URL' | 'REQUEST_OPEN_DASHBOARD') {
  vscode.postMessage({ type });
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

// Dot grid for the idle logo — 16×16 regular grid, radial mask fades toward center.
const LOGO_DOTS: JSX.Element[] = [];
for (let row = 0; row < 16; row++) {
  for (let col = 0; col < 16; col++) {
    LOGO_DOTS.push(
      <circle key={`${row}-${col}`} cx={38 + col * 7} cy={38 + row * 7} r={1.3} />,
    );
  }
}

function IdleView() {
  return (
    <div className="pd-idle">
      <div className="pd-idle-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="96" height="96" fill="none">
          <defs>
            <clipPath id="pd-inner-clip">
              <circle cx="90" cy="90" r="60" />
            </clipPath>
            <radialGradient id="pd-mask-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="black" />
              <stop offset="45%"  stopColor="black" />
              <stop offset="100%" stopColor="white" />
            </radialGradient>
            <mask id="pd-dot-mask">
              <circle cx="90" cy="90" r="60" fill="url(#pd-mask-grad)" />
            </mask>
          </defs>

          {/* Outer ring */}
          <circle cx="90" cy="90" r="82" stroke="#C48540" strokeWidth="2.5" />
          {/* Inner ring */}
          <circle cx="90" cy="90" r="62" fill="rgba(28,59,107,0.9)" stroke="#C48540" strokeWidth="1.8" />

          {/* Dot grid — clipped to inner ring, fades toward center */}
          <g clipPath="url(#pd-inner-clip)" mask="url(#pd-dot-mask)" fill="#C48540">
            {LOGO_DOTS}
          </g>

          {/* Plug */}
          <rect x="72" y="52" width="36" height="26" rx="4"
            fill="#D4A853" fillOpacity="0.12" stroke="#D4A853" strokeWidth="1.8" />
          <line x1="81" y1="78" x2="81" y2="90"
            stroke="#D4A853" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="99" y1="78" x2="99" y2="90"
            stroke="#D4A853" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="90" y1="90" x2="90" y2="96"
            stroke="#C48540" strokeWidth="1.8" strokeDasharray="2.5,2.5" opacity="0.8" />
          <rect x="67" y="97" width="46" height="28" rx="5"
            fill="rgba(196,133,58,0.07)" stroke="#C48540" strokeWidth="1.8" />
          <rect x="75"  y="102" width="12" height="16" rx="2.5" fill="#C48540" opacity="0.9" />
          <rect x="93"  y="102" width="12" height="16" rx="2.5" fill="#C48540" opacity="0.9" />

          {/* Cardinal rivets on outer ring */}
          <circle cx="90"  cy="8"   r="3.5" fill="#C48540" opacity="0.7" />
          <circle cx="172" cy="90"  r="3.5" fill="#C48540" opacity="0.7" />
          <circle cx="90"  cy="172" r="3.5" fill="#C48540" opacity="0.7" />
          <circle cx="8"   cy="90"  r="3.5" fill="#C48540" opacity="0.7" />
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

      <SessionConfig
        port={session.port}
        ttl={session.ttl}
        pin={session.pin}
        oneTimeScan={session.oneTimeScan}
      />
      <AccessLog scanLog={session.scanLog} />

      <div className="pd-actions">
        <FlashButton
          className="pd-btn primary"
          label="Copy URL"
          flashLabel="&#x2713; Copied!"
          duration={1500}
          onClick={() => send('REQUEST_COPY_URL')}
        />
        <FlashButton
          className="pd-btn"
          label="Open in Browser"
          flashLabel="&#x2197; Opening..."
          duration={1000}
          onClick={() => send('REQUEST_OPEN_DASHBOARD')}
        />
        <FlashButton
          className="pd-btn danger"
          label="Stop Session"
          flashLabel="&#x23F9; Stopping..."
          duration={2000}
          onClick={() => send('REQUEST_STOP')}
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
      }
    };

    window.addEventListener('message', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handler);
    };
  }, []);

  switch (state.status) {
    case 'loading': return <Skeleton />;
    case 'idle':    return <IdleView />;
    case 'active':  return <ActiveView session={state.session} />;
    case 'expired': return <ExpiredView />;
  }
}
