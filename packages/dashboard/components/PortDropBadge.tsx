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

export function PortDropBadge({ expiresAt }: PortDropBadgeProps) {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 rounded-full bg-portdrop-surface px-3 py-1 font-mono text-xs text-portdrop-cyan shadow-lg border border-portdrop-border"
      >
        PortDrop
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-3 rounded-lg bg-portdrop-surface border border-portdrop-border px-4 py-2 font-mono text-xs text-white shadow-xl">
      <span className="text-portdrop-cyan font-semibold">PortDrop</span>
      <span className="text-portdrop-muted">|</span>
      <TTLCountdown expiresAt={expiresAt} />
      <button
        onClick={() => setMinimized(true)}
        className="ml-1 text-portdrop-muted hover:text-white transition-colors"
        aria-label="Minimize badge"
      >
        ✕
      </button>
    </div>
  );
}
