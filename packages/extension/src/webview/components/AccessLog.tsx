/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — collapsible scan access log in the sidebar webview
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { ScanEntry } from '../App';

interface AccessLogProps {
  scanLog: ScanEntry[];
}

export function AccessLog({ scanLog }: AccessLogProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pd-log">
      <div className="pd-log-header" onClick={() => setOpen(o => !o)}>
        <span>Access log</span>
        <span className={`pd-log-chevron${open ? ' open' : ''}`}>&#x203A;</span>
      </div>
      {open && (
        <div className="pd-log-entries">
          {scanLog.length === 0 ? (
            <div className="pd-log-empty">No scans yet.</div>
          ) : (
            scanLog.map(entry => (
              <div key={entry.n} className="pd-log-entry">
                <span className="pd-log-n">#{entry.n}</span>
                <span className="pd-log-time">
                  {new Date(entry.at).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
