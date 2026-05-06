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
import { FiX, FiZap } from 'react-icons/fi';
import { TTLCountdown } from './TTLCountdown';

interface PortDropBadgeProps {
  expiresAt: Date;
  scanCount: number;
  oneTimeScan: boolean;
}

function LogoMark({ size = 16 }: { size?: number }) {
  return (
    <img src="/logo/portdrop-favicon-16.svg" alt="PortDrop" width={size} height={size} />
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
          <span className="flex items-center gap-1 text-[#eab308]" title="This link can only be opened once">
            <FiZap size={11} /> one-time
          </span>
        </>
      )}
      <button
        onClick={() => setMinimized(true)}
        className="ml-0.5 flex items-center text-portdrop-muted hover:text-white transition-colors"
        aria-label="Minimize badge"
      >
        <FiX size={13} />
      </button>
    </div>
  );
}
