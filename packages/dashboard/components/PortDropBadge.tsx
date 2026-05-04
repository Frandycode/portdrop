/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — floating session badge shown to the viewer (bottom-right)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import { TTLCountdown } from './TTLCountdown';

interface PortDropBadgeProps {
  expiresAt: Date;
  scanCount: number;
  oneTimeScan: boolean;
}

function LogoMark({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
      <circle cx="12" cy="12" r="11" stroke="#C48540" strokeWidth="1.2"/>
      <circle cx="12" cy="12" r="7.8" fill="rgba(13,30,56,0.95)" stroke="#C48540" strokeWidth="0.9"/>
      {/* r≈6, 8 dots — full opacity */}
      <circle cx="18.0" cy="12.0" r="0.65" fill="#C48540"/>
      <circle cx="16.2" cy="16.2" r="0.65" fill="#C48540"/>
      <circle cx="12.0" cy="18.0" r="0.65" fill="#C48540"/>
      <circle cx="7.8"  cy="16.2" r="0.65" fill="#C48540"/>
      <circle cx="6.0"  cy="12.0" r="0.65" fill="#C48540"/>
      <circle cx="7.8"  cy="7.8"  r="0.65" fill="#C48540"/>
      <circle cx="12.0" cy="6.0"  r="0.65" fill="#C48540"/>
      <circle cx="16.2" cy="7.8"  r="0.65" fill="#C48540"/>
      {/* r≈4.2, 6 dots — mid opacity */}
      <circle cx="16.2" cy="12.0" r="0.60" fill="#C48540" opacity="0.52"/>
      <circle cx="14.1" cy="15.6" r="0.60" fill="#C48540" opacity="0.52"/>
      <circle cx="9.9"  cy="15.6" r="0.60" fill="#C48540" opacity="0.52"/>
      <circle cx="7.8"  cy="12.0" r="0.60" fill="#C48540" opacity="0.52"/>
      <circle cx="9.9"  cy="8.4"  r="0.60" fill="#C48540" opacity="0.52"/>
      <circle cx="14.1" cy="8.4"  r="0.60" fill="#C48540" opacity="0.52"/>
      {/* r≈2.4, 4 dots — faint */}
      <circle cx="14.4" cy="12.0" r="0.55" fill="#C48540" opacity="0.18"/>
      <circle cx="12.0" cy="14.4" r="0.55" fill="#C48540" opacity="0.18"/>
      <circle cx="9.6"  cy="12.0" r="0.55" fill="#C48540" opacity="0.18"/>
      <circle cx="12.0" cy="9.6"  r="0.55" fill="#C48540" opacity="0.18"/>
      <rect x="8.8" y="5.8" width="6.4" height="4.2" rx="0.7" fill="#D4A853" fillOpacity="0.14" stroke="#D4A853" strokeWidth="0.7"/>
      <line x1="10.4" y1="10.0" x2="10.4" y2="12.1" stroke="#D4A853" strokeWidth="0.95" strokeLinecap="round"/>
      <line x1="13.6" y1="10.0" x2="13.6" y2="12.1" stroke="#D4A853" strokeWidth="0.95" strokeLinecap="round"/>
      <line x1="12" y1="12.1" x2="12" y2="13.2" stroke="#C48540" strokeWidth="0.65" strokeDasharray="0.9,0.9" opacity="0.85"/>
      <rect x="8.2" y="13.2" width="7.6" height="5.0" rx="0.8" fill="rgba(196,133,58,0.09)" stroke="#C48540" strokeWidth="0.7"/>
      <rect x="9.2"  y="14.1" width="2.3" height="3.2" rx="0.4" fill="#C48540" fillOpacity="0.92"/>
      <rect x="12.5" y="14.1" width="2.3" height="3.2" rx="0.4" fill="#C48540" fillOpacity="0.92"/>
      <circle cx="12.0" cy="1.0"  r="0.8" fill="#C48540" opacity="0.65"/>
      <circle cx="23.0" cy="12.0" r="0.8" fill="#C48540" opacity="0.65"/>
      <circle cx="12.0" cy="23.0" r="0.8" fill="#C48540" opacity="0.65"/>
      <circle cx="1.0"  cy="12.0" r="0.8" fill="#C48540" opacity="0.65"/>
    </svg>
  );
}

export function PortDropBadge({ expiresAt, scanCount, oneTimeScan }: PortDropBadgeProps) {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-portdrop-surface px-3 py-1.5 font-mono text-xs text-portdrop-cyan shadow-lg border border-portdrop-border"
      >
        <LogoMark size={13} />
        PortDrop
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2.5 rounded-lg bg-portdrop-surface border border-portdrop-border px-3.5 py-2 font-mono text-xs text-white shadow-xl">
      <LogoMark size={15} />
      <span className="text-portdrop-cyan font-semibold">PortDrop</span>
      <span className="text-portdrop-border">|</span>
      <TTLCountdown expiresAt={expiresAt} />
      <span className="text-portdrop-border">|</span>
      <span className="text-portdrop-muted">
        {scanCount} scan{scanCount !== 1 ? 's' : ''}
      </span>
      {oneTimeScan && (
        <>
          <span className="text-portdrop-border">|</span>
          <span className="text-[#eab308]" title="This link can only be opened once">⚡ one-time</span>
        </>
      )}
      <button
        onClick={() => setMinimized(true)}
        className="ml-0.5 text-portdrop-muted hover:text-white transition-colors leading-none"
        aria-label="Minimize badge"
      >
        ✕
      </button>
    </div>
  );
}
