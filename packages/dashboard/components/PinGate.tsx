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

import { useRef, useState } from 'react';
import { FiLock } from 'react-icons/fi';
import { SessionLaunch } from './SessionLaunch';
import { CodeBreederBadge } from './CodeBreederBadge';

interface SessionData {
  sessionId:   string;
  publicUrl:   string;
  expiresAt:   Date;
  oneTimeScan: boolean;
  scanCount:   number;
}

function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <img src="/logo/portdrop-favicon-32.svg" alt="PortDrop" width={size} height={size} />
  );
}

// ── PIN slot component ────────────────────────────────────────────────────────

function PinSlot({ filled, error, permanent }: { filled: boolean; error: boolean; permanent: boolean }) {
  const borderColor = permanent
    ? 'rgba(196,133,58,0.4)'
    : error ? '#ef4444'
    : filled ? '#22d3ee'
    : '#1e293b';
  const bg = permanent
    ? 'rgba(196,133,58,0.06)'
    : error ? 'rgba(239,68,68,0.08)'
    : filled ? 'rgba(34,211,238,0.08)'
    : 'rgba(15,23,42,0.8)';
  const dotColor = permanent ? '#C48540' : error ? '#ef4444' : '#22d3ee';

  return (
    <div style={{
      width: 56, height: 64, borderRadius: 14,
      border: `2px solid ${borderColor}`,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color 0.15s, background 0.15s',
      boxShadow: filled && !error && !permanent ? '0 0 12px rgba(34,211,238,0.18)' : 'none',
      opacity: permanent ? 0.55 : 1,
    }}>
      {filled && (
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: dotColor, transition: 'background 0.15s',
        }} />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PinGate({ sessionId }: { sessionId: string }) {
  const [value,     setValue]     = useState('');
  const [error,     setError]     = useState<string | null>(null);
  const [permanent, setPermanent] = useState(false); // error the user cannot retry
  const [shaking,   setShaking]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [session,   setSession]   = useState<SessionData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => { if (!permanent) inputRef.current?.focus(); };

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 520);
  };

  const submit = async (pin: string) => {
    if (pin.length !== 4 || loading || permanent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}?pin=${encodeURIComponent(pin)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pinRequired) {
          // Shouldn't happen when a PIN is supplied, but guard anyway
          setError('Incorrect PIN. Try again.');
          shake();
          setValue('');
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
        setValue('');
      } else if (res.status === 410) {
        // One-time PIN already consumed — retrying will never work
        setError('This PIN has already been claimed by someone else.');
        setPermanent(true);
      } else if (res.status === 403) {
        // Session viewer cap reached
        setError('This session is full — no more viewers are allowed.');
        setPermanent(true);
      } else {
        setError('Session not found or has expired.');
        shake();
        setValue('');
      }
    } catch {
      setError('Could not reach the session. Is VS Code running?');
      shake();
    }
    setLoading(false);
    if (!permanent) setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setValue(raw);
    setError(null);
    if (raw.length === 4) submit(raw);
  };

  // ── Unlocked: session launch portal ──────────────────────────────────────
  if (session) {
    return (
      <SessionLaunch
        sessionId={session.sessionId}
        publicUrl={session.publicUrl}
        expiresAt={session.expiresAt}
        scanCount={session.scanCount}
        oneTimeScan={session.oneTimeScan}
        pinProtected
      />
    );
  }

  // ── PIN entry screen ──────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          18%       { transform: translateX(-10px); }
          36%       { transform: translateX(10px); }
          54%       { transform: translateX(-6px); }
          72%       { transform: translateX(6px); }
          88%       { transform: translateX(-3px); }
        }
        .pin-shake { animation: pin-shake 0.52s ease-in-out; }

        @keyframes slot-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .slot-pop { animation: slot-pop 0.18s ease-out; }
      `}</style>

      <main
        className="jeans-raw jeans-stitch"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'var(--font-geist-mono), monospace',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,211,238,0.04) 0%, transparent 70%)',
        }} />

        {/* Card */}
        <div
          style={{
            width: '100%',
            maxWidth: 360,
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid #1e293b',
            borderRadius: 24,
            padding: '40px 36px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
            position: 'relative',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}
        >
          {/* Logo + wordmark */}
          <a
            href="/"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              textDecoration: 'none',
              opacity: 0.9,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.9')}
          >
            <LogoMark size={48} />
            <span style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#22d3ee',
              fontWeight: 600,
            }}>
              PortDrop
            </span>
          </a>

          {/* Divider */}
          <div style={{ width: '100%', height: 1, background: '#1e293b' }} />

          {/* Lock icon + heading */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(196,133,58,0.1)',
              border: '1px solid rgba(196,133,58,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#D4A853',
            }}>
              <FiLock size={20} />
            </div>
            <h1 style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#D4A853',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              PIN Required
            </h1>
            <p style={{
              fontSize: 11,
              color: '#64748b',
              letterSpacing: '0.05em',
              margin: 0,
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              Ask the developer for the 4‑digit code
            </p>
          </div>

          {/* PIN slots */}
          <div
            onClick={focusInput}
            style={{ position: 'relative', cursor: 'text' }}
          >
            {/* Hidden real input — disabled once a permanent error is shown */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={value}
              onChange={handleChange}
              autoFocus
              autoComplete="one-time-code"
              disabled={permanent}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                cursor: permanent ? 'default' : 'text',
                fontSize: 16,
                border: 'none',
                outline: 'none',
                zIndex: 1,
              }}
            />

            {/* Visual slots */}
            <div
              className={shaking ? 'pin-shake' : ''}
              style={{ display: 'flex', gap: 12 }}
            >
              {[0, 1, 2, 3].map(i => (
                <PinSlot key={i} filled={value.length > i} error={!!error && !permanent} permanent={permanent} />
              ))}
            </div>
          </div>

          {/* Error message */}
          <div style={{ minHeight: 18, textAlign: 'center' }}>
            {error && (
              <p style={{
                fontSize: 11,
                color: '#ef4444',
                letterSpacing: '0.05em',
                margin: 0,
              }}>
                {error}
              </p>
            )}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11, letterSpacing: '0.1em' }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '2px solid #1e293b',
                borderTopColor: '#22d3ee',
                animation: 'spin 0.7s linear infinite',
              }} />
              Verifying…
            </div>
          )}
        </div>

        {/* Credit */}
        <div style={{ marginTop: 32, opacity: 0.45 }}>
          <CodeBreederBadge />
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </main>
    </>
  );
}
