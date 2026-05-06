/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — browser-chrome app preview wrapping the tunnel iframe
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { FiLock, FiRefreshCw, FiExternalLink, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface AppPreviewProps {
  tunnelUrl: string;
  expiresAt: Date;
}

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
      <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
      <div className="w-3 h-3 rounded-full bg-[#28c840]" />
    </div>
  );
}

export function AppPreview({ tunnelUrl, expiresAt }: AppPreviewProps) {
  const [loaded,  setLoaded]  = useState(false);
  const [expired, setExpired] = useState(() => expiresAt.getTime() <= Date.now());
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const ms = expiresAt.getTime() - Date.now();
    if (ms <= 0) { setExpired(true); return; }
    const t = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(t);
  }, [expiresAt]);

  const handleReload = () => {
    setLoaded(false);
    setReloadKey(k => k + 1);
  };

  const displayUrl = tunnelUrl.replace(/^https?:\/\//, '');

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4 gap-0">

      {/* ── Browser chrome bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#080d18] border border-portdrop-border rounded-t-2xl shrink-0">
        <TrafficLights />

        {/* Nav buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            className="w-6 h-6 flex items-center justify-center rounded text-portdrop-muted/30 cursor-default select-none"
            tabIndex={-1}
          >
            <FiChevronLeft size={14} />
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center rounded text-portdrop-muted/30 cursor-default select-none"
            tabIndex={-1}
          >
            <FiChevronRight size={14} />
          </button>
        </div>

        {/* Address bar */}
        <div className="flex flex-1 items-center gap-2 px-3 py-1.5 rounded-lg bg-portdrop-surface border border-portdrop-border min-w-0">
          <FiLock size={10} className="shrink-0 text-portdrop-muted" />
          <span
            className="flex-1 font-mono text-[11px] text-portdrop-muted truncate"
            title={tunnelUrl}
          >
            {displayUrl}
          </span>
        </div>

        {/* Reload */}
        <button
          onClick={handleReload}
          title="Reload"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-portdrop-muted hover:text-white hover:bg-portdrop-surface border border-transparent hover:border-portdrop-border transition-all shrink-0"
        >
          <FiRefreshCw size={13} />
        </button>

        {/* Pop out */}
        <a
          href={tunnelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-portdrop-surface border border-portdrop-border font-mono text-[10px] tracking-wider text-portdrop-cyan hover:border-portdrop-cyan hover:bg-portdrop-cyan/10 transition-all shrink-0"
        >
          <FiExternalLink size={12} />
          <span className="hidden sm:inline">Pop out</span>
        </a>
      </div>

      {/* ── iframe container ────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 border border-t-0 border-portdrop-border rounded-b-2xl overflow-hidden bg-portdrop-bg">

        {/* Loading */}
        {!loaded && !expired && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-portdrop-bg">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-portdrop-border border-t-portdrop-cyan" />
            <span className="font-mono text-[10px] tracking-widest text-portdrop-muted uppercase">
              Connecting…
            </span>
          </div>
        )}

        {/* Expired overlay */}
        {expired && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 bg-portdrop-bg/96 backdrop-blur-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="52" height="52" fill="none">
              <circle cx="12" cy="12" r="11" stroke="#1e293b" strokeWidth="1.2"/>
              <circle cx="12" cy="12" r="7.8" stroke="#1e293b" strokeWidth="0.9" fill="rgba(13,30,56,0.95)"/>
              <rect x="8.8" y="5.8" width="6.4" height="4.2" rx="0.7" fill="#1e293b" fillOpacity="0.3" stroke="#1e293b" strokeWidth="0.7"/>
              <line x1="10.4" y1="10.0" x2="10.4" y2="12.1" stroke="#334155" strokeWidth="0.95" strokeLinecap="round"/>
              <line x1="13.6" y1="10.0" x2="13.6" y2="12.1" stroke="#334155" strokeWidth="0.95" strokeLinecap="round"/>
              <rect x="8.2" y="13.2" width="7.6" height="5.0" rx="0.8" fill="rgba(30,41,59,0.3)" stroke="#1e293b" strokeWidth="0.7"/>
              <rect x="9.2"  y="14.1" width="2.3" height="3.2" rx="0.4" fill="#334155" fillOpacity="0.7"/>
              <rect x="12.5" y="14.1" width="2.3" height="3.2" rx="0.4" fill="#334155" fillOpacity="0.7"/>
            </svg>
            <div className="text-center space-y-2">
              <h2 className="font-mono text-lg font-bold text-white tracking-widest uppercase">Session Ended</h2>
              <p className="text-sm text-portdrop-muted max-w-[260px] leading-relaxed">
                This PortDrop session has expired. Ask the developer to start a new one.
              </p>
            </div>
          </div>
        )}

        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={tunnelUrl}
          className="h-full w-full border-0"
          title="PortDrop app preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
