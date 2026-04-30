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

import { useState } from 'react';
import { QRPanel } from './components/QRPanel';
import { SessionConfig } from './components/SessionConfig';
import { TTLClock } from './components/TTLClock';
import { AccessLog } from './components/AccessLog';

export type SessionStatus = 'idle' | 'active' | 'expired';

export interface Session {
  status: SessionStatus;
  publicUrl: string | null;
  expiresAt: Date | null;
  qrDataUri: string | null;
}

const INITIAL_SESSION: Session = {
  status: 'idle',
  publicUrl: null,
  expiresAt: null,
  qrDataUri: null,
};

export default function App() {
  const [session, setSession] = useState<Session>(INITIAL_SESSION);

  // TODO (Phase 1): wire up VS Code postMessage API to receive session updates
  // from the extension host and drive state here.

  return (
    <main className="portdrop-sidebar">
      {session.status === 'idle' && (
        <p className="idle-msg">No active session.<br />Run <code>PortDrop: Start Session</code> to begin.</p>
      )}

      {session.status === 'active' && session.qrDataUri && (
        <>
          <QRPanel dataUri={session.qrDataUri} url={session.publicUrl!} />
          <TTLClock expiresAt={session.expiresAt!} />
          <SessionConfig />
          <AccessLog />
        </>
      )}

      {session.status === 'expired' && (
        <p className="expired-msg">Session expired.</p>
      )}
    </main>
  );
}
