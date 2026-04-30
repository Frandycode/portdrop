/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — client-side TTL countdown displayed in the viewer dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useEffect, useState } from 'react';

interface TTLCountdownProps {
  expiresAt: Date;
}

export function TTLCountdown({ expiresAt }: TTLCountdownProps) {
  const [remaining, setRemaining] = useState(expiresAt.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(expiresAt.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const expired = remaining <= 0;
  const m = Math.max(0, Math.floor(remaining / 60_000));
  const s = Math.max(0, Math.floor((remaining % 60_000) / 1000));
  const clock = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <span className={`font-mono text-sm ${expired ? 'text-portdrop-orange' : 'text-portdrop-cyan'}`}>
      {expired ? 'Expired' : `Expires in ${clock}`}
    </span>
  );
}
