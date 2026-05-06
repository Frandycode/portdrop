/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin login page
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter }           from 'next/navigation';
import { FiLock }              from 'react-icons/fi';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Login failed.');
      }
    } catch {
      setError('Network error — try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0d1b33',
      backgroundImage: [
        'repeating-linear-gradient(150deg, rgba(255,255,255,0.013) 0px, rgba(255,255,255,0.013) 1px, transparent 1px, transparent 8px)',
        'repeating-linear-gradient(60deg,  rgba(255,255,255,0.009) 0px, rgba(255,255,255,0.009) 1px, transparent 1px, transparent 8px)',
      ].join(', '),
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-geist-mono), monospace',
    }}>
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'rgba(13,23,42,0.9)',
        border: '1px solid #1e293b',
        borderRadius: 20,
        padding: '40px 32px',
        backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
      }}>

        {/* Logo */}
        <a href="/" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, textDecoration:'none', opacity:0.9 }}>
          <img src="/logo/portdrop-favicon-32.svg" alt="PortDrop" width={40} height={40} />
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'#22d3ee' }}>
            PortDrop
          </span>
        </a>

        <div style={{ width:'100%', height:1, background:'#1e293b' }} />

        {/* Lock icon + title */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{
            width:40, height:40, borderRadius:12,
            background:'rgba(196,133,58,0.1)', border:'1px solid rgba(196,133,58,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <FiLock size={18} color="#C48540" />
          </div>
          <h1 style={{ fontSize:13, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'#D4A853', margin:0 }}>
            Admin Access
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width:'100%', display:'flex', flexDirection:'column', gap:14 }}>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: 10,
              border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid #1e293b',
              background: 'rgba(15,23,42,0.7)',
              color: '#f8fafc',
              fontSize: 12, letterSpacing: '0.05em',
              fontFamily: 'var(--font-geist-mono), monospace',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e  => { e.currentTarget.style.borderColor = 'rgba(196,133,58,0.5)'; }}
            onBlur={e   => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : '#1e293b'; }}
          />

          {error && (
            <p style={{ margin:0, fontSize:10, color:'#ef4444', letterSpacing:'0.05em', textAlign:'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 0',
              borderRadius: 10,
              border: 'none',
              background: loading ? 'rgba(196,133,58,0.4)' : '#D4A853',
              color: '#0d1e38',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontFamily: 'var(--font-geist-mono), monospace',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Checking…' : 'Sign In'}
          </button>
        </form>

        <div style={{ width:'100%', height:1, background:'#1e293b' }} />

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <a href="/admin/reset" style={{ fontSize:10, color:'rgba(212,168,83,0.45)', letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none' }}>
            Forgot password?
          </a>
          <a href="/admin/setup" style={{ fontSize:10, color:'rgba(34,211,238,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none' }}>
            First time? Create account
          </a>
        </div>
      </div>
    </main>
  );
}
