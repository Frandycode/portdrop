/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — TTL countdown clock displayed in the sidebar webview
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';

interface TTLClockProps {
  expiresAt: Date;
}

function warningClass(ms: number): string {
  if (ms <= 0)       return 'ended';
  if (ms <= 60_000)  return 'warn-red';
  if (ms <= 120_000) return 'warn-amber';
  return '';
}

export function TTLClock({ expiresAt }: TTLClockProps) {
  const [remaining, setRemaining] = useState(() => expiresAt.getTime() - Date.now());

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const r = expiresAt.getTime() - Date.now();
      setRemaining(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const ended = remaining <= 0;
  const m     = Math.floor(Math.max(0, remaining) / 60_000);
  const s     = Math.floor((Math.max(0, remaining) % 60_000) / 1000);
  const label = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const cls   = `pd-clock-value${warningClass(remaining) ? ' ' + warningClass(remaining) : ''}`;

  return (
    <div className="pd-clock">
      {!ended && <div className="pd-clock-label">Expires in</div>}
      <span className={cls}>{ended ? 'Session ended' : label}</span>
    </div>
  );
}
