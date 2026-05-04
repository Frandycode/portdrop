/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — VS Code sidebar webview root component
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';

// ── View status ───────────────────────────────────────────────────────────────

type AppStatus = 'loading' | 'idle' | 'active' | 'expired';

// ── Sub-views ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="pd-skeleton">
      <div className="pd-skel-block pd-skel-logo" />
      <div className="pd-skel-block pd-skel-title" />
      <div className="pd-skel-block pd-skel-text" />
      <div className="pd-skel-block pd-skel-text short" />
    </div>
  );
}

function IdleView() {
  return (
    <div className="pd-idle">
      <div className="pd-idle-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="96" height="96" fill="none">
          <defs>
            <clipPath id="sb-inner-clip"><circle cx="60" cy="60" r="37" /></clipPath>
            <linearGradient id="sb-dot-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#000" />
              <stop offset="30%"  stopColor="#000" />
              <stop offset="70%"  stopColor="#888" />
              <stop offset="100%" stopColor="#fff" />
            </linearGradient>
            <mask id="sb-dot-mask" maskUnits="userSpaceOnUse" x="23" y="23" width="74" height="74">
              <rect x="23" y="23" width="74" height="74" fill="url(#sb-dot-fade)" />
            </mask>
          </defs>

          {/* Outer ring */}
          <circle cx="60" cy="60" r="56" stroke="#C48540" strokeWidth="2" />

          {/* Inner ring */}
          <circle cx="60" cy="60" r="44" fill="rgba(14,31,58,0.96)" stroke="#C48540" strokeWidth="1.4" />

          {/* Dot field */}
          <g clipPath="url(#sb-inner-clip)" mask="url(#sb-dot-mask)">
            <circle cx="40" cy="97"  r="1.6" fill="#C48540" opacity="0.85" />
            <circle cx="48" cy="99"  r="1.7" fill="#D4A853" opacity="0.85" />
            <circle cx="56" cy="100" r="1.7" fill="#C48540" opacity="0.85" />
            <circle cx="64" cy="100" r="1.7" fill="#D4A853" opacity="0.85" />
            <circle cx="72" cy="99"  r="1.7" fill="#C48540" opacity="0.85" />
            <circle cx="80" cy="97"  r="1.6" fill="#D4A853" opacity="0.85" />
            <circle cx="36" cy="91"  r="1.5" fill="#C48540" opacity="0.75" />
            <circle cx="44" cy="93"  r="1.6" fill="#D4A853" opacity="0.80" />
            <circle cx="52" cy="94"  r="1.6" fill="#C48540" opacity="0.80" />
            <circle cx="60" cy="94"  r="1.6" fill="#D4A853" opacity="0.80" />
            <circle cx="68" cy="94"  r="1.6" fill="#C48540" opacity="0.80" />
            <circle cx="76" cy="93"  r="1.6" fill="#D4A853" opacity="0.80" />
            <circle cx="84" cy="91"  r="1.5" fill="#C48540" opacity="0.75" />
            <circle cx="38" cy="84"  r="1.4" fill="#D4A853" opacity="0.65" />
            <circle cx="46" cy="86"  r="1.5" fill="#C48540" opacity="0.70" />
            <circle cx="54" cy="87"  r="1.5" fill="#D4A853" opacity="0.70" />
            <circle cx="62" cy="87"  r="1.5" fill="#C48540" opacity="0.70" />
            <circle cx="70" cy="87"  r="1.5" fill="#D4A853" opacity="0.70" />
            <circle cx="78" cy="86"  r="1.5" fill="#C48540" opacity="0.65" />
            <circle cx="84" cy="84"  r="1.4" fill="#D4A853" opacity="0.60" />
            <circle cx="34" cy="77"  r="1.2" fill="#C48540" opacity="0.50" />
            <circle cx="42" cy="79"  r="1.3" fill="#D4A853" opacity="0.55" />
            <circle cx="50" cy="80"  r="1.4" fill="#C48540" opacity="0.58" />
            <circle cx="58" cy="80"  r="1.4" fill="#D4A853" opacity="0.55" />
            <circle cx="66" cy="80"  r="1.4" fill="#C48540" opacity="0.55" />
            <circle cx="74" cy="79"  r="1.3" fill="#D4A853" opacity="0.55" />
            <circle cx="82" cy="77"  r="1.2" fill="#C48540" opacity="0.50" />
            <circle cx="36" cy="70"  r="1.1" fill="#D4A853" opacity="0.40" />
            <circle cx="44" cy="72"  r="1.2" fill="#C48540" opacity="0.42" />
            <circle cx="52" cy="73"  r="1.2" fill="#D4A853" opacity="0.42" />
            <circle cx="60" cy="73"  r="1.2" fill="#C48540" opacity="0.42" />
            <circle cx="68" cy="73"  r="1.2" fill="#D4A853" opacity="0.40" />
            <circle cx="76" cy="72"  r="1.2" fill="#C48540" opacity="0.40" />
            <circle cx="82" cy="70"  r="1.1" fill="#D4A853" opacity="0.35" />
            <circle cx="30" cy="63"  r="1.0" fill="#C48540" opacity="0.28" />
            <circle cx="38" cy="65"  r="1.1" fill="#D4A853" opacity="0.30" />
            <circle cx="46" cy="66"  r="1.1" fill="#C48540" opacity="0.30" />
            <circle cx="76" cy="65"  r="1.1" fill="#D4A853" opacity="0.28" />
            <circle cx="84" cy="63"  r="1.0" fill="#C48540" opacity="0.25" />
            <circle cx="90" cy="63"  r="1.0" fill="#D4A853" opacity="0.22" />
          </g>

          {/* Plug */}
          <rect x="48" y="32" width="24" height="18" rx="3"
            fill="#D4A853" fillOpacity="0.13" stroke="#D4A853" strokeWidth="1.4" />
          <line x1="54" y1="50" x2="54" y2="60" stroke="#D4A853" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="66" y1="50" x2="66" y2="60" stroke="#D4A853" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="60" y1="60" x2="60" y2="66"
            stroke="#C48540" strokeWidth="1.2" strokeDasharray="2,2" opacity="0.85" />
          <rect x="44" y="66" width="32" height="22" rx="4"
            fill="rgba(196,133,58,0.08)" stroke="#C48540" strokeWidth="1.4" />
          <rect x="50" y="71" width="9" height="12" rx="2" fill="#C48540" opacity="0.92" />
          <rect x="61" y="71" width="9" height="12" rx="2" fill="#C48540" opacity="0.92" />

          {/* Cardinal rivets */}
          <circle cx="60"  cy="4"   r="2.5" fill="#C48540" opacity="0.70" />
          <circle cx="116" cy="60"  r="2.5" fill="#C48540" opacity="0.70" />
          <circle cx="60"  cy="116" r="2.5" fill="#C48540" opacity="0.70" />
          <circle cx="4"   cy="60"  r="2.5" fill="#C48540" opacity="0.70" />
        </svg>
        <span className="pd-wordmark">PortDrop</span>
      </div>
      <p>No active session.</p>
      <p>Run <code>PortDrop: Start Session</code><br />from the Command Palette.</p>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [status, setStatus] = useState<AppStatus>('loading');

  useEffect(() => {
    // If the extension sends no message (no active session), fall through to idle.
    const timer = setTimeout(
      () => setStatus(s => (s === 'loading' ? 'idle' : s)),
      400,
    );
    return () => clearTimeout(timer);
  }, []);

  if (status === 'loading') return <Skeleton />;
  if (status === 'idle')    return <IdleView />;

  // active / expired handled in Step 9
  return null;
}
