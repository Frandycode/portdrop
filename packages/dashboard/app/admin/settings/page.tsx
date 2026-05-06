/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin settings page (change password)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/AdminShell';
import { FiLock, FiCheckCircle } from 'react-icons/fi';

export default function SettingsPage() {
  const router = useRouter();
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    if (next.length < 8)  { setError('New password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/admin/login?changed=1'), 1800);
      } else {
        setError(data.error ?? 'Update failed.');
      }
    } catch {
      setError('Network error — try again.');
    } finally {
      setLoading(false);
    }
  }

  const FIELD: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #1e293b', background: 'rgba(15,23,42,0.6)',
    color: '#f8fafc', fontSize: 12, letterSpacing: '0.05em',
    fontFamily: 'var(--font-geist-mono), monospace',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <AdminShell title="Settings" active="settings">
      <div style={{ maxWidth: 420 }}>

        {/* Change password card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid #1e293b',
          borderRadius: 14, padding: '28px 32px',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
            <div style={{
              width:32, height:32, borderRadius:9,
              background:'rgba(196,133,58,0.1)', border:'1px solid rgba(196,133,58,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <FiLock size={14} color="#C48540" />
            </div>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#D4A853' }}>
              Change Password
            </span>
          </div>

          {success ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'16px 0' }}>
              <FiCheckCircle size={32} color="#22d3ee" />
              <p style={{ margin:0, fontSize:11, color:'#22d3ee', letterSpacing:'0.08em', textAlign:'center' }}>
                Password updated. Redirecting to login…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#475569', display:'block', marginBottom:6 }}>
                  Current Password
                </label>
                <input type="password" value={current} onChange={e => { setCurrent(e.target.value); setError(''); }}
                  required autoFocus style={FIELD}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,133,58,0.5)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = '#1e293b'; }} />
              </div>
              <div>
                <label style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#475569', display:'block', marginBottom:6 }}>
                  New Password
                </label>
                <input type="password" value={next} onChange={e => { setNext(e.target.value); setError(''); }}
                  required placeholder="Min 8 characters" style={FIELD}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,133,58,0.5)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = '#1e293b'; }} />
              </div>
              <div>
                <label style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#475569', display:'block', marginBottom:6 }}>
                  Confirm New Password
                </label>
                <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
                  required style={FIELD}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,133,58,0.5)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = '#1e293b'; }} />
              </div>

              {error && (
                <p style={{ margin:0, fontSize:10, color:'#ef4444', letterSpacing:'0.05em' }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop:4, padding:'10px 0', borderRadius:10, border:'none',
                background: loading ? 'rgba(196,133,58,0.4)' : '#D4A853',
                color:'#0d1e38', fontSize:11, fontWeight:700,
                letterSpacing:'0.18em', textTransform:'uppercase',
                fontFamily:'var(--font-geist-mono), monospace',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        <p style={{ marginTop:20, fontSize:10, color:'#334155', letterSpacing:'0.05em', lineHeight:1.7 }}>
          After updating, your current session will be invalidated and you will be redirected to login with your new password.
        </p>
      </div>
    </AdminShell>
  );
}
