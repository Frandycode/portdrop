/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — 404 / not-found page shown when session is invalid or expired
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { CodeBreederBadge } from '@/components/CodeBreederBadge';
import { FiWifiOff } from 'react-icons/fi';

export default function NotFound() {
  return (
    <main className="jeans-distressed jeans-stitch flex min-h-screen flex-col items-center justify-center gap-10 px-6 text-center">

      {/* Muted plug icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="60" height="60" fill="none">
        <circle cx="12" cy="12" r="11" stroke="#1e293b" strokeWidth="1.2"/>
        <circle cx="12" cy="12" r="7.8" stroke="#1e293b" strokeWidth="0.9" fill="rgba(13,30,56,0.95)"/>
        <rect x="8.8" y="5.8" width="6.4" height="4.2" rx="0.7" fill="#1e293b" fillOpacity="0.3" stroke="#1e293b" strokeWidth="0.7"/>
        <line x1="10.4" y1="10.0" x2="10.4" y2="12.1" stroke="#334155" strokeWidth="0.95" strokeLinecap="round"/>
        <line x1="13.6" y1="10.0" x2="13.6" y2="12.1" stroke="#334155" strokeWidth="0.95" strokeLinecap="round"/>
        <rect x="8.2" y="13.2" width="7.6" height="5.0" rx="0.8" fill="rgba(30,41,59,0.3)" stroke="#1e293b" strokeWidth="0.7"/>
        <rect x="9.2"  y="14.1" width="2.3" height="3.2" rx="0.4" fill="#334155" fillOpacity="0.7"/>
        <rect x="12.5" y="14.1" width="2.3" height="3.2" rx="0.4" fill="#334155" fillOpacity="0.7"/>
      </svg>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2.5 text-portdrop-muted">
          <FiWifiOff size={16} />
          <span className="font-mono text-xs tracking-widest uppercase">Session Unavailable</span>
        </div>
        <h1 className="font-mono text-2xl font-bold text-white tracking-wide">Not Found</h1>
        <p className="max-w-sm text-sm leading-relaxed text-portdrop-muted">
          This PortDrop session has expired, been burned, or the link is invalid.
          Ask the developer to start a new session.
        </p>
      </div>

      <div className="opacity-50 hover:opacity-90 transition-opacity">
        <CodeBreederBadge />
      </div>
    </main>
  );
}
