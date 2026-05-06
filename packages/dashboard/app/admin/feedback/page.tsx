/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin feedback panel
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'fs';
import path from 'path';
import { AdminShell } from '@/components/AdminShell';

interface FeedbackEntry { text: string; stars?: number; ts: string }

function readFeedback(): FeedbackEntry[] {
  const file = path.join(process.cwd(), 'data', 'feedback.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean) as FeedbackEntry[];
}

function avgStars(entries: FeedbackEntry[]): string {
  const rated = entries.filter(e => typeof e.stars === 'number');
  if (!rated.length) return '—';
  const avg = rated.reduce((s, e) => s + (e.stars ?? 0), 0) / rated.length;
  return avg.toFixed(1);
}

export default function FeedbackPage() {
  const entries = readFeedback().reverse();
  const avg     = avgStars(entries);

  return (
    <AdminShell title="Feedback" active="feedback">
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#D4A853' }}>{entries.length}</span>
          <span style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>responses</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#D4A853' }}>{avg}</span>
          <span style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>avg stars</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <p style={{ color: 'rgba(212,168,83,0.3)', fontSize: 12, letterSpacing: '0.05em' }}>
          No feedback yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((e, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              borderRadius: 10,
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
    </AdminShell>
  );
}
