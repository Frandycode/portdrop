/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — app preview iframe that renders the tunneled dev server
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';

interface AppPreviewProps {
  tunnelUrl: string;
  expiresAt: Date;
}

export function AppPreview({ tunnelUrl, expiresAt }: AppPreviewProps) {
  const [loaded, setLoaded]   = useState(false);
  const [expired, setExpired] = useState(() => expiresAt.getTime() <= Date.now());

  useEffect(() => {
    const ms = expiresAt.getTime() - Date.now();
    if (ms <= 0) { setExpired(true); return; }
    const t = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(t);
  }, [expiresAt]);

  return (
    <div className="relative flex-1 h-full w-full">
      {/* Loading state */}
      {!loaded && !expired && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-portdrop-bg">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-portdrop-border border-t-portdrop-cyan" />
          <span className="font-mono text-[10px] tracking-widest text-portdrop-muted uppercase">
            Connecting…
          </span>
        </div>
      )}

      {/* Session expired overlay */}
      {expired && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-portdrop-bg/95 backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="56" height="56" fill="none">
            <circle cx="12" cy="12" r="11" stroke="#64748b" strokeWidth="1.2"/>
            <circle cx="12" cy="12" r="7.8" stroke="#64748b" strokeWidth="0.9" fill="rgba(13,30,56,0.95)"/>
            <rect x="8.8" y="5.8" width="6.4" height="4.2" rx="0.7" fill="#64748b" fillOpacity="0.14" stroke="#64748b" strokeWidth="0.7"/>
            <line x1="10.4" y1="10.0" x2="10.4" y2="12.1" stroke="#64748b" strokeWidth="0.95" strokeLinecap="round"/>
            <line x1="13.6" y1="10.0" x2="13.6" y2="12.1" stroke="#64748b" strokeWidth="0.95" strokeLinecap="round"/>
            <rect x="8.2" y="13.2" width="7.6" height="5.0" rx="0.8" fill="rgba(100,116,139,0.09)" stroke="#64748b" strokeWidth="0.7"/>
            <rect x="9.2"  y="14.1" width="2.3" height="3.2" rx="0.4" fill="#64748b" fillOpacity="0.6"/>
            <rect x="12.5" y="14.1" width="2.3" height="3.2" rx="0.4" fill="#64748b" fillOpacity="0.6"/>
          </svg>
          <div className="text-center">
            <h2 className="font-mono text-lg font-bold text-white mb-2">Session Ended</h2>
            <p className="text-sm text-portdrop-muted max-w-[280px] leading-relaxed">
              This PortDrop session has expired. Ask the developer to start a new one.
            </p>
          </div>
        </div>
      )}

      <iframe
        src={tunnelUrl}
        className="h-full w-full border-0"
        title="PortDrop app preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
