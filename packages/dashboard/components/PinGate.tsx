/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — PIN gate shown when a session requires a 4-digit code
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { KeyboardEvent, useRef, useState } from 'react';
import { AppPreview } from './AppPreview';
import { PortDropBadge } from './PortDropBadge';
import { TTLCountdown } from './TTLCountdown';

interface SessionData {
  sessionId:   string;
  publicUrl:   string;
  expiresAt:   Date;
  oneTimeScan: boolean;
  scanCount:   number;
}

function LogoMark({ size = 20 }: { size?: number }) {
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

export function PinGate({ sessionId }: { sessionId: string }) {
  const [digits, setDigits]   = useState(['', '', '', '']);
  const [error, setError]     = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);

  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3];

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const submit = async (pin: string) => {
    if (pin.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}?pin=${encodeURIComponent(pin)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pinRequired) {
          // Shouldn't happen — relay returned pin-required despite a pin being sent
          setError('Session requires a PIN.');
          shake();
          setDigits(['', '', '', '']);
          inputRefs[0].current?.focus();
        } else {
          setSession({
            sessionId:   data.sessionId,
            publicUrl:   data.publicUrl,
            expiresAt:   new Date(data.expiresAt),
            oneTimeScan: data.oneTimeScan,
            scanCount:   data.scanCount,
          });
        }
      } else if (res.status === 401) {
        setError('Incorrect PIN. Try again.');
        shake();
        setDigits(['', '', '', '']);
        inputRefs[0].current?.focus();
      } else {
        setError('Session not found or has expired.');
      }
    } catch {
      setError('Could not reach the session. Is VS Code running?');
    }
    setLoading(false);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError(null);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    if (value && index === 3) {
      const pin = next.join('');
      if (pin.length === 4) submit(pin);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      const pin = digits.join('');
      if (pin.length === 4) submit(pin);
    }
  };

  // ── Unlocked: render the full session view ──────────────────────────────────
  if (session) {
    const displayUrl = session.publicUrl.replace(/^https?:\/\//, '');
    return (
      <main className="relative flex min-h-screen flex-col bg-portdrop-bg">
        <header className="flex items-center justify-between border-b border-portdrop-border bg-portdrop-surface/60 px-5 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoMark />
            <span className="font-mono text-sm font-semibold tracking-widest text-portdrop-cyan uppercase">
              PortDrop
            </span>
            <span className="hidden sm:block text-portdrop-border font-mono">·</span>
            <span
              className="hidden sm:block font-mono text-[10px] text-portdrop-muted truncate max-w-[260px]"
              title={session.publicUrl}
            >
              {displayUrl}
            </span>
            {session.oneTimeScan && (
              <span className="hidden sm:flex items-center gap-1 rounded border border-[#eab308]/30 bg-[#eab308]/10 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-[#eab308] uppercase">
                ⚡ One-time link
              </span>
            )}
          </div>
          <TTLCountdown expiresAt={session.expiresAt} />
        </header>
        <div className="flex flex-1 overflow-hidden">
          <AppPreview tunnelUrl={session.publicUrl} expiresAt={session.expiresAt} />
        </div>
        <PortDropBadge
          expiresAt={session.expiresAt}
          scanCount={session.scanCount}
          oneTimeScan={session.oneTimeScan}
        />
      </main>
    );
  }

  // ── PIN entry ───────────────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-portdrop-bg px-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <LogoMark size={52} />
        <span className="font-mono text-sm font-semibold tracking-widest text-portdrop-cyan uppercase">
          PortDrop
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-xl border border-dashed border-[rgba(196,133,58,0.35)] bg-portdrop-surface/60 p-8 text-center backdrop-blur-sm">
        <h1 className="mb-1 font-mono text-base font-bold tracking-widest text-[#D4A853] uppercase">
          PIN Required
        </h1>
        <p className="mb-8 font-mono text-[11px] text-portdrop-muted">
          Ask the developer for the 4-digit code.
        </p>

        {/* 4-digit inputs */}
        <div
          className={`flex justify-center gap-3 ${shaking ? 'animate-[pin-shake_0.5s_ease-in-out]' : ''}`}
          style={shaking ? { animation: 'pin-shake 0.5s ease-in-out' } : undefined}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              autoFocus={i === 0}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={[
                'h-16 w-12 rounded-lg border bg-portdrop-bg text-center',
                'font-mono text-2xl font-bold text-[#D4A853]',
                'outline-none transition-all duration-150',
                'caret-transparent',
                error
                  ? 'border-[#ef4444]/60 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]'
                  : d
                  ? 'border-[#C48540] shadow-[0_0_0_1px_rgba(196,133,58,0.25)]'
                  : 'border-dashed border-[rgba(196,133,58,0.35)] focus:border-[#C48540] focus:shadow-[0_0_0_1px_rgba(196,133,58,0.2)]',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 font-mono text-[11px] text-[#ef4444]">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={() => submit(digits.join(''))}
          disabled={loading || digits.join('').length < 4}
          className="mt-6 w-full rounded-lg border border-dashed border-[rgba(196,133,58,0.4)] bg-[rgba(196,133,58,0.08)] py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#D4A853] transition-all hover:border-[#C48540] hover:bg-[rgba(196,133,58,0.14)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Verifying…' : 'Unlock →'}
        </button>
      </div>

      <p className="font-mono text-[10px] text-portdrop-muted">
        Powered by{' '}
        <a href="https://portdrop.dev" className="text-portdrop-cyan hover:underline" target="_blank" rel="noopener noreferrer">
          PortDrop
        </a>
      </p>

      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </main>
  );
}
