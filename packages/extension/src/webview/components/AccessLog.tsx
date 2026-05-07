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
import { vscode }    from '../vscode-api';

interface AccessLogProps {
  scanLog:   ScanEntry[];
  scanCount: number;
  maxUsers?: number;
}

export function AccessLog({ scanLog, scanCount, maxUsers }: AccessLogProps) {
  const [open, setOpen] = useState(false);

  const capExceeded = maxUsers !== undefined && scanCount > maxUsers;

  // Auto-open when cap is exceeded so the SA sees it immediately
  if (capExceeded && !open) setOpen(true);

  return (
    <div className="pd-log">
      <div className="pd-log-header" onClick={() => setOpen(o => !o)}>
        <span>Access log</span>
        <span className={`pd-log-chevron${open ? ' open' : ''}`}>&#x203A;</span>
      </div>
      {open && (
        <div className="pd-log-entries">
          {capExceeded && (
            <div className="pd-log-cap-warn">
              <span>
                {scanCount} viewer{scanCount !== 1 ? 's' : ''} in ·{' '}
                cap is {maxUsers}. Reset to enforce new limit.
              </span>
              <button
                className="pd-log-reset-btn"
                onClick={() => vscode.postMessage({ type: 'REQUEST_RESET_VIEWERS' })}
              >
                Reset Access
              </button>
            </div>
          )}

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
