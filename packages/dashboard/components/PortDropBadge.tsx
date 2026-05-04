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
}

function LogoMark({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
      <circle cx="12" cy="12" r="11" stroke="#C48540" strokeWidth="1.2"/>
      <circle cx="12" cy="12" r="7.8" stroke="#C48540" strokeWidth="0.9" fill="rgba(13,30,56,0.95)"/>
      <rect x="8.8" y="5.8" width="6.4" height="4.2" rx="0.7" fill="#D4A853" fillOpacity="0.14" stroke="#D4A853" strokeWidth="0.7"/>
      <line x1="10.4" y1="10.0" x2="10.4" y2="12.1" stroke="#D4A853" strokeWidth="0.95" strokeLinecap="round"/>
      <line x1="13.6" y1="10.0" x2="13.6" y2="12.1" stroke="#D4A853" strokeWidth="0.95" strokeLinecap="round"/>
      <rect x="8.2" y="13.2" width="7.6" height="5.0" rx="0.8" fill="rgba(196,133,58,0.09)" stroke="#C48540" strokeWidth="0.7"/>
      <rect x="9.2"  y="14.1" width="2.3" height="3.2" rx="0.4" fill="#C48540" fillOpacity="0.92"/>
      <rect x="12.5" y="14.1" width="2.3" height="3.2" rx="0.4" fill="#C48540" fillOpacity="0.92"/>
    </svg>
  );
}

export function PortDropBadge({ expiresAt }: PortDropBadgeProps) {
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
