/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — session launch portal shown to the viewer
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { FiExternalLink, FiZap, FiEye, FiClock, FiCopy, FiCheck, FiLock, FiRefreshCw, FiCode, FiMonitor } from 'react-icons/fi';
import { TTLCountdown } from './TTLCountdown';
import { CodeBreederBadge } from './CodeBreederBadge';
import { FileTree } from './FileTree';
import { CodeViewer } from './CodeViewer';

interface SessionLaunchProps {
  publicUrl:        string;
  expiresAt:        Date;
  scanCount:        number;
  oneTimeScan:      boolean;
  sessionId:        string;
  pinProtected?:    boolean;
  codeViewEnabled?: boolean;
}

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <img src="/logo/portdrop-favicon-32.svg" alt="PortDrop" width={size} height={size} />
  );
}

export function SessionLaunch({
  publicUrl,
  expiresAt,
  scanCount,
  oneTimeScan,
  sessionId,
  pinProtected     = false,
  codeViewEnabled  = false,
}: SessionLaunchProps) {
  const [tab,              setTab]              = useState<'preview' | 'code'>('preview');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [copied,           setCopied]           = useState(false);
  const [liveExpiresAt, setLiveExpiresAt] = useState<Date>(expiresAt);
  const [expired,       setExpired]       = useState(() => expiresAt.getTime() <= Date.now());
  const [banner,        setBanner]        = useState<{ text: string; positive: boolean } | null>(null);
  const liveExpiresAtRef = useRef<Date>(expiresAt);

  // Keep ref in sync so the poll closure always sees the latest value
  useEffect(() => { liveExpiresAtRef.current = liveExpiresAt; }, [liveExpiresAt]);

  // URL sharing is allowed only for open (no-PIN, no-one-time-scan) sessions.
  const urlShareable = !pinProtected && !oneTimeScan;

  // Expire timer — resets when liveExpiresAt changes
  useEffect(() => {
    const ms = liveExpiresAt.getTime() - Date.now();
    if (ms <= 0) { setExpired(true); return; }
    const t = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(t);
  }, [liveExpiresAt]);

  // Poll for admin-driven updates (TTL change, viewer cap change) every 20s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/peek`);
        if (res.status === 404) { setExpired(true); return; }
        if (!res.ok) return;

        const data = await res.json();
        const newExpiry = new Date(data.expiresAt);
        const delta = newExpiry.getTime() - liveExpiresAtRef.current.getTime();

        if (Math.abs(delta) > 5_000) {
          const mins = Math.round(Math.abs(delta) / 60_000);
          const label = mins >= 1 ? `${mins} min` : 'less than a minute';
          setBanner({
            text: delta > 0 ? `Session extended by ${label}` : `Session shortened by ${label}`,
            positive: delta > 0,
          });
          setLiveExpiresAt(newExpiry);
          setTimeout(() => setBanner(null), 7_000);
        }
      } catch { /* relay temporarily unavailable — keep current state */ }
    }, 20_000);
    return () => clearInterval(id);
  }, [sessionId]);

  const displayUrl = publicUrl.replace(/^https?:\/\//, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sharedStyle = `
    @keyframes spin-slow { to { transform: rotate(360deg); } }
    @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
  `;

  const tabBtn = (label: string, icon: React.ReactNode, value: 'preview' | 'code') => (
    <button
      onClick={() => setTab(value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 14px', borderRadius: 8,
        border: tab === value ? '1px solid rgba(196,133,58,0.5)' : '1px solid transparent',
        background: tab === value ? 'rgba(196,133,58,0.1)' : 'none',
        color: tab === value ? '#D4A853' : 'rgba(212,168,83,0.45)',
        fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
        cursor: 'pointer', fontFamily: 'var(--font-geist-mono), monospace',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );

  if (tab === 'code' && codeViewEnabled) {
    return (
      <>
        <style>{sharedStyle}</style>
        <main style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d1b33',
          backgroundImage: [
            'repeating-linear-gradient(150deg, rgba(255,255,255,0.013) 0px, rgba(255,255,255,0.013) 1px, transparent 1px, transparent 8px)',
            'repeating-linear-gradient(60deg,  rgba(255,255,255,0.009) 0px, rgba(255,255,255,0.009) 1px, transparent 1px, transparent 8px)',
          ].join(', '),
          fontFamily: 'var(--font-geist-mono), monospace',
          overflow: 'hidden',
        }}>
          {/* Code view header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 20px',
            borderBottom: '1px solid #1e293b',
            background: 'rgba(13,23,42,0.95)',
            flexShrink: 0,
          }}>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', opacity:0.85, flexShrink:0 }}>
              <LogoMark size={24} />
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'#22d3ee' }}>PortDrop</span>
            </a>
            <div style={{ width:1, height:16, background:'#1e293b', flexShrink:0 }} />
            <div style={{ display:'flex', gap:4 }}>
              {tabBtn('Preview', <FiMonitor size={11} />, 'preview')}
              {tabBtn('Code', <FiCode size={11} />, 'code')}
            </div>
            <div style={{ flex:1 }} />
            <TTLCountdown expiresAt={liveExpiresAt} />
          </div>

          {/* Split panel */}
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* File tree sidebar */}
            <div style={{
              width: 240, flexShrink: 0,
              borderRight: '1px solid #1e293b',
              overflowY: 'auto',
              background: 'rgba(13,23,42,0.6)',
            }}>
              <FileTree
                sessionId={sessionId}
                selectedPath={selectedFilePath}
                onSelectFile={setSelectedFilePath}
              />
            </div>

            {/* Code viewer */}
            <div style={{ flex:1, overflow:'hidden', background:'rgba(13,23,42,0.4)' }}>
              <CodeViewer sessionId={sessionId} filePath={selectedFilePath} />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{sharedStyle}</style>

      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#0d1b33',
          backgroundImage: [
            'repeating-linear-gradient(150deg, rgba(255,255,255,0.013) 0px, rgba(255,255,255,0.013) 1px, transparent 1px, transparent 8px)',
            'repeating-linear-gradient(60deg,  rgba(255,255,255,0.009) 0px, rgba(255,255,255,0.009) 1px, transparent 1px, transparent 8px)',
            'repeating-linear-gradient(150deg, rgba(30,50,100,0.06)   0px, rgba(30,50,100,0.06)   2px, transparent 2px, transparent 40px)',
          ].join(', '),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          fontFamily: 'var(--font-geist-mono), monospace',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stitch border — real div, not ::before */}
        <div style={{
          position: 'fixed',
          inset: 12,
          border: '2px dashed rgba(196,133,58,0.22)',
          borderRadius: 10,
          pointerEvents: 'none',
          zIndex: 50,
        }} />

        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(34,211,238,0.05) 0%, transparent 70%)',
        }} />

        {/* ── Wordmark ──────────────────────────────────────────────────────── */}
        <a
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: codeViewEnabled ? 16 : 40,
            textDecoration: 'none',
            opacity: 0.9,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.9')}
        >
          <LogoMark size={36} />
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#22d3ee',
          }}>
            PortDrop
          </span>
        </a>

        {/* ── Tab switcher (only when code view is enabled) ─────────────────── */}
        {codeViewEnabled && (
          <div style={{
            display: 'flex', gap: 4, marginBottom: 20,
            padding: '4px',
            borderRadius: 10,
            border: '1px solid #1e293b',
            background: 'rgba(13,23,42,0.6)',
          }}>
            {tabBtn('Preview', <FiMonitor size={11} />, 'preview')}
            {tabBtn('Code', <FiCode size={11} />, 'code')}
          </div>
        )}

        {/* ── Status bar ────────────────────────────────────────────────────── */}
        <div style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          padding: '0 4px',
        }}>
          {expired ? (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 10, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#C48540',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C48540' }} />
              Session ended
            </span>
          ) : (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 10, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#10b981',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                animation: 'pulse-dot 1.4s ease-in-out infinite',
              }} />
              Live
            </span>
          )}
          <TTLCountdown expiresAt={liveExpiresAt} />
        </div>

        {/* ── Main card ─────────────────────────────────────────────────────── */}
        <div style={{
          width: '100%',
          maxWidth: 520,
          background: 'rgba(13,23,42,0.88)',
          border: '1px solid #1e293b',
          borderRadius: 20,
          overflow: 'hidden',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}>

          {/* URL bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid #1e293b',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {/* Traffic lights */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            </div>

            {/* URL display */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              borderRadius: 8,
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid #1e293b',
              minWidth: 0,
            }}>
              {!urlShareable && (
                <FiLock size={10} color="#C48540" style={{ flexShrink: 0 }} />
              )}
              <span style={{
                fontSize: 11,
                color: '#475569',
                letterSpacing: '0.04em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                userSelect: urlShareable ? 'auto' : 'none',
              }}
                title={urlShareable ? publicUrl : undefined}
              >
                {urlShareable ? displayUrl : displayUrl.replace(/\/.*/, '')}
              </span>
            </div>

            {/* Copy button — only for open (shareable) sessions */}
            {urlShareable ? (
              <button
                onClick={handleCopy}
                title="Copy URL"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: `1px solid ${copied ? '#10b981' : '#1e293b'}`,
                  background: copied ? 'rgba(16,185,129,0.10)' : 'transparent',
                  color: copied ? '#10b981' : '#475569',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            ) : (
              /* Locked indicator replacing the copy button */
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid rgba(196,133,58,0.25)',
                background: 'rgba(196,133,58,0.06)',
                color: '#C48540',
                fontSize: 10,
                letterSpacing: '0.12em',
                fontFamily: 'var(--font-geist-mono), monospace',
                flexShrink: 0,
              }}>
                <FiLock size={11} />
                <span>Secured</span>
              </div>
            )}
          </div>

          {/* Update banner — shown when admin adjusts TTL or viewer cap */}
          {banner && (
            <div style={{
              padding: '9px 18px',
              background: banner.positive ? 'rgba(16,185,129,0.10)' : 'rgba(234,179,8,0.10)',
              borderBottom: `1px solid ${banner.positive ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.2)'}`,
              fontSize: 10,
              letterSpacing: '0.1em',
              color: banner.positive ? '#10b981' : '#eab308',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontFamily: 'var(--font-geist-mono), monospace',
            }}>
              <FiRefreshCw size={10} />
              {banner.text}
            </div>
          )}

          {/* Card body */}
          <div style={{
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 36,
          }}>

            {/* Status icon + headline */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              {expired ? (
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'rgba(196,133,58,0.1)',
                  border: '1px solid rgba(196,133,58,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FiClock size={22} color="#C48540" />
                </div>
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FiZap size={22} color="#10b981" />
                </div>
              )}

              <h1 style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: expired ? '#C48540' : '#f8fafc',
                margin: 0,
              }}>
                {expired ? 'Session Ended' : 'Session Ready'}
              </h1>
              <p style={{
                fontSize: 12,
                color: '#475569',
                letterSpacing: '0.05em',
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                {expired
                  ? 'This session has expired. Ask the developer to start a new one.'
                  : 'The developer has shared a live preview with you.'}
              </p>
            </div>

            {/* Open App CTA */}
            {!expired && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 36px',
                  borderRadius: 14,
                  background: '#D4A853',
                  color: '#0d1e38',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  boxShadow: '0 4px 0 #8a5a26, 0 8px 28px rgba(0,0,0,0.45)',
                  transition: 'transform 0.12s, box-shadow 0.12s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = '0 6px 0 #8a5a26, 0 14px 32px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.transform = '';
                  el.style.boxShadow = '0 4px 0 #8a5a26, 0 8px 28px rgba(0,0,0,0.45)';
                }}
              >
                Open App
                <FiExternalLink size={16} />
              </a>
            )}

            {/* Divider */}
            <div style={{ width: '100%', height: 1, background: '#1e293b' }} />

            {/* Meta pills */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid #1e293b',
                background: 'rgba(255,255,255,0.02)',
                fontSize: 10,
                letterSpacing: '0.12em',
                color: '#475569',
                fontFamily: 'var(--font-geist-mono), monospace',
              }}>
                <FiEye size={11} />
                {scanCount} {scanCount === 1 ? 'open' : 'opens'}
              </span>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid #1e293b',
                background: 'rgba(255,255,255,0.02)',
                fontSize: 10,
                letterSpacing: '0.12em',
                color: '#475569',
                fontFamily: 'var(--font-geist-mono), monospace',
              }}>
                <FiClock size={11} />
                <TTLCountdown expiresAt={liveExpiresAt} compact />
              </span>

              {oneTimeScan && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(234,179,8,0.3)',
                  background: 'rgba(234,179,8,0.06)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: '#eab308',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}>
                  <FiZap size={11} />
                  One-time link
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Credit ────────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 40, opacity: 0.45 }}>
          <CodeBreederBadge />
        </div>
      </main>
    </>
  );
}
