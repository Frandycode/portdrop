/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin feedback panel with distribution + filter
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';

interface FeedbackEntry { text: string; stars?: number; ts: string }

export function FeedbackPanel({ entries }: { entries: FeedbackEntry[] }) {
  const [filter, setFilter] = useState<number | null>(null);

  const rated   = entries.filter(e => typeof e.stars === 'number');
  const dist    = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: rated.filter(e => e.stars === s).length,
  }));
  const maxCount = Math.max(...dist.map(d => d.count), 1);

  const visible = filter !== null
    ? entries.filter(e => e.stars === filter)
    : entries;

  const CHIP = (s: number): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 10,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    border: filter === s ? '1px solid rgba(196,133,58,0.6)' : '1px solid #1e293b',
    background: filter === s ? 'rgba(196,133,58,0.12)' : 'transparent',
    color: filter === s ? '#D4A853' : '#475569',
    fontFamily: 'var(--font-geist-mono), monospace',
    transition: 'all 0.15s',
  });

  return (
    <>
      {/* Star distribution */}
      {rated.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid #1e293b',
          borderRadius: 12, padding: '18px 20px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#475569', marginBottom: 14 }}>
            Rating Breakdown
          </div>
          {dist.map(({ stars, count }) => (
            <div
              key={stars}
              onClick={() => setFilter(filter === stars ? null : stars)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 11, color: '#64748b', width: 14, textAlign: 'right', flexShrink: 0 }}>{stars}</span>
              <span style={{ fontSize: 11, color: '#D4A853' }}>★</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#1e293b', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${(count / maxCount) * 100}%`,
                  background: filter === stars ? '#D4A853' : 'rgba(196,133,58,0.5)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 10, color: '#475569', width: 20, flexShrink: 0 }}>{count}</span>
            </div>
          ))}
          {filter !== null && (
            <button
              onClick={() => setFilter(null)}
              style={{
                marginTop: 8, padding: '3px 10px', borderRadius: 6, border: '1px solid #1e293b',
                background: 'none', color: '#475569', fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'var(--font-geist-mono), monospace',
              }}
            >
              Clear filter ×
            </button>
          )}
        </div>
      )}

      {/* Filter chips */}
      {rated.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[5, 4, 3, 2, 1].map(s => (
            <button key={s} style={CHIP(s)} onClick={() => setFilter(filter === s ? null : s)}>
              {'★'.repeat(s)}
            </button>
          ))}
        </div>
      )}

      {/* Entries */}
      {visible.length === 0 ? (
        <p style={{ color: 'rgba(212,168,83,0.3)', fontSize: 12, letterSpacing: '0.05em' }}>
          {filter !== null ? `No ${filter}-star responses.` : 'No feedback yet.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((e, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: 10,
              border: '1px solid #1e293b',
              background: 'rgba(255,255,255,0.015)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                {typeof e.stars === 'number' ? (
                  <span style={{ fontSize: 14, letterSpacing: 2 }}>
                    {'★'.repeat(e.stars)}{'☆'.repeat(5 - e.stars)}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: '#475569', letterSpacing: '0.05em' }}>No rating</span>
                )}
                <span style={{ fontSize: 10, color: '#475569', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {new Date(e.ts).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, letterSpacing: '0.02em' }}>
                {e.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
