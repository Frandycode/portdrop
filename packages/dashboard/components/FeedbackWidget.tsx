/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — floating feedback widget
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useEffect, useRef, useState } from 'react';

export function FeedbackWidget() {
  const [open,   setOpen]   = useState(false);
  const [text,   setText]   = useState('');
  const [stars,  setStars]  = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const panelRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 120);
  }, [open]);

  const reset = () => {
    setText('');
    setStars(null);
    setStatus('idle');
    setErrMsg('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text, stars }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrMsg(data.error ?? 'Something went wrong.');
      } else {
        setStatus('success');
        setTimeout(() => { setOpen(false); reset(); }, 1800);
      }
    } catch {
      setStatus('error');
      setErrMsg('Network error — please try again.');
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) reset(); }}
        style={{
          position:'fixed', bottom:80, left:20, zIndex:70,
          fontFamily:"'JetBrains Mono',monospace", fontSize:10,
          letterSpacing:'2px', textTransform:'uppercase',
          color:'rgba(212,168,83,0.45)', background:'rgba(196,133,58,0.07)',
          border:'1.5px dashed rgba(196,133,58,0.28)',
          borderRadius:8, padding:'8px 14px', cursor:'pointer',
          transition:'opacity 0.2s, color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(212,168,83,0.8)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(196,133,58,0.6)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(212,168,83,0.45)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(196,133,58,0.28)';
        }}
        aria-label="Give feedback"
      >
        Feedback
      </button>

      {/* Slide-up panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position:'fixed', bottom:120, left:20, zIndex:70,
            width:300,
            background:'rgba(12,22,50,0.97)',
            border:'1.5px dashed rgba(196,133,58,0.4)',
            borderRadius:12,
            padding:20,
            boxShadow:'0 12px 48px rgba(0,0,0,0.6)',
            backdropFilter:'blur(14px)',
            animation:'pd-feedback-up 0.22s ease-out both',
          }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontFamily:"'Fjalla One',sans-serif", fontSize:14, letterSpacing:1, color:'#D4A853' }}>
              Share Feedback
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background:'none', border:'none', color:'rgba(212,168,83,0.45)', cursor:'pointer', fontSize:16, lineHeight:1, padding:2 }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {status === 'success' ? (
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#D4A853', letterSpacing:1 }}>
              Thanks — we read every response.
            </p>
          ) : (
            <form onSubmit={submit}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => { setText(e.target.value); setStatus('idle'); }}
                placeholder="What's working? What's broken?"
                required
                rows={4}
                style={{
                  width:'100%', resize:'vertical',
                  fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                  color:'#D4A853', background:'rgba(196,133,58,0.07)',
                  border:'1.5px dashed rgba(196,133,58,0.35)',
                  borderRadius:8, padding:'10px 12px', outline:'none',
                  boxSizing:'border-box',
                }}
              />

              {/* Stars */}
              <div style={{ display:'flex', gap:6, margin:'12px 0 14px' }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(stars === n ? null : n)}
                    style={{
                      background:'none', border:'none', cursor:'pointer', padding:2,
                      fontSize:18, lineHeight:1,
                      color: stars !== null && n <= stars ? '#D4A853' : 'rgba(212,168,83,0.2)',
                      transition:'color 0.15s',
                    }}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
                {stars && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'rgba(212,168,83,0.4)', alignSelf:'center', letterSpacing:1 }}>
                    {['','awful','poor','okay','good','great'][stars]}
                  </span>
                )}
              </div>

              {status === 'error' && (
                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#ef4444', marginBottom:10 }}>
                  {errMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width:'100%',
                  fontFamily:"'Fjalla One',sans-serif", fontSize:12,
                  letterSpacing:'1.5px', textTransform:'uppercase',
                  color:'#0d1e38', background:'#C48540',
                  border:'none', borderRadius:8, padding:'10px 0', cursor:'pointer',
                  boxShadow:'0 2px 0 #7a4a20',
                  opacity: status === 'loading' ? 0.55 : 1,
                  transition:'opacity 0.15s',
                }}
              >
                {status === 'loading' ? 'Sending…' : 'Send Feedback'}
              </button>
            </form>
          )}
        </div>
      )}

      <style>{`
        @keyframes pd-feedback-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
