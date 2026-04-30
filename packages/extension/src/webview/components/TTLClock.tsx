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

export function TTLClock({ expiresAt }: TTLClockProps) {
  const [remaining, setRemaining] = useState(expiresAt.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(expiresAt.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const m = Math.max(0, Math.floor(remaining / 60_000));
  const s = Math.max(0, Math.floor((remaining % 60_000) / 1000));
  const clock = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <section className="ttl-clock">
      <span className="ttl-label">Expires in</span>
      <span className="ttl-value">{clock}</span>
    </section>
  );
}
