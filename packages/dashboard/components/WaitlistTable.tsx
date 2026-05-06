/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin waitlist table with live search
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';

interface WaitlistEntry { email: string; ts: string }

export function WaitlistTable({ entries }: { entries: WaitlistEntry[] }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? entries.filter(e => e.email.toLowerCase().includes(query.toLowerCase()))
    : entries;

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '8px 14px',
    borderRadius: 8, border: '1px solid #1e293b',
    background: 'rgba(15,23,42,0.6)',
    color: '#f8fafc', fontSize: 11,
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-geist-mono), monospace',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={INPUT}
          onFocus={e  => { e.currentTarget.style.borderColor = 'rgba(196,133,58,0.4)'; }}
          onBlur={e   => { e.currentTarget.style.borderColor = '#1e293b'; }}
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'rgba(212,168,83,0.3)', fontSize: 12, letterSpacing: '0.05em' }}>
          {query ? `No results for "${query}".` : 'No signups yet.'}
        </p>
      ) : (
        <div style={{ border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto',
            padding: '8px 16px', borderBottom: '1px solid #1e293b',
            background: 'rgba(255,255,255,0.02)',
            fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#475569',
          }}>
            <span>Email {query && <span style={{ color: '#D4A853' }}>({filtered.length} match{filtered.length !== 1 ? 'es' : ''})</span>}</span>
            <span>Signed up</span>
          </div>

          {filtered.map((e, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              padding: '10px 16px',
              borderBottom: i < filtered.length - 1 ? '1px solid #1e293b' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              fontSize: 12, alignItems: 'center',
            }}>
              <span style={{ color: '#cbd5e1', letterSpacing: '0.02em' }}>{e.email}</span>
              <span style={{ color: '#475569', fontSize: 10, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {new Date(e.ts).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
