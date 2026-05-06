/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin setup page (first-time account creation)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiShield } from 'react-icons/fi';

export default function AdminSetupPage() {
  const router = useRouter();
  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [error,    setError]      = useState('');
  const [loading,  setLoading]    = useState(false);
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    fetch('/api/admin/setup')
      .then(r => r.json())
      .then(d => { if (d.exists) router.replace('/admin/login'); })
      .finally(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push('/admin/login?setup=1');
      } else {
        setError(data.error ?? 'Setup failed. Try again.');
      }
    } catch {
      setError('Network error — try again.');
    } finally {
      setLoading(false);
    }
  }

  const FIELD: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #1e293b', background: 'rgba(15,23,42,0.7)',
    color: '#f8fafc', fontSize: 12, letterSpacing: '0.05em',
    fontFamily: 'var(--font-geist-mono), monospace',
    outline: 'none', boxSizing: 'border-box',
  };

  if (checking) return null;

  return (
    <main style={{
      minHeight: '100vh', backgroundColor: '#0d1b33',
      backgroundImage: [
        'repeating-linear-gradient(150deg, rgba(255,255,255,0.013) 0px, rgba(255,255,255,0.013) 1px, transparent 1px, transparent 8px)',
        'repeating-linear-gradient(60deg,  rgba(255,255,255,0.009) 0px, rgba(255,255,255,0.009) 1px, transparent 1px, transparent 8px)',
      ].join(', '),
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'var(--font-geist-mono), monospace',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(13,23,42,0.9)', border: '1px solid #1e293b',
        borderRadius: 20, padding: '40px 32px',
        backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
      }}>
        <a href="/" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, textDecoration:'none', opacity:0.9 }}>
          <img src="/logo/portdrop-favicon-32.svg" alt="PortDrop" width={40} height={40} />
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'#22d3ee' }}>PortDrop</span>
        </a>

        <div style={{ width:'100%', height:1, background:'#1e293b' }} />

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{
            width:40, height:40, borderRadius:12,
            background:'rgba(196,133,58,0.1)', border:'1px solid rgba(196,133,58,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <FiShield size={18} color="#C48540" />
          </div>
          <h1 style={{ fontSize:13, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'#D4A853', margin:0 }}>
            Create Admin Account
          </h1>
          <p style={{ fontSize:10, color:'#475569', letterSpacing:'0.05em', margin:0, textAlign:'center', lineHeight:1.6 }}>
            Set up your admin password. This runs once — use Settings to change it later.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width:'100%', display:'flex', flexDirection:'column', gap:12 }}>
          <input
            type="password" placeholder="New password (min 8 chars)"
            value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            required autoFocus style={FIELD}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,133,58,0.5)'; }}
            onBlur={e  => { e.currentTarget.style.borderColor = '#1e293b'; }}
          />
          <input
            type="password" placeholder="Confirm password"
            value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
            required style={FIELD}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,133,58,0.5)'; }}
            onBlur={e  => { e.currentTarget.style.borderColor = '#1e293b'; }}
          />

          {error && (
            <p style={{ margin:0, fontSize:10, color:'#ef4444', letterSpacing:'0.05em', textAlign:'center' }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{
            padding:'10px 0', borderRadius:10, border:'none',
            background: loading ? 'rgba(196,133,58,0.4)' : '#D4A853',
            color:'#0d1e38', fontSize:11, fontWeight:700,
            letterSpacing:'0.18em', textTransform:'uppercase',
            fontFamily:'var(--font-geist-mono), monospace',
            cursor: loading ? 'not-allowed' : 'pointer', transition:'background 0.15s',
          }}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <a href="/admin/login" style={{ fontSize:10, color:'rgba(212,168,83,0.4)', letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none' }}>
          Back to login
        </a>
      </div>
    </main>
  );
}
