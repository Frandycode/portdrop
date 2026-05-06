/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin waitlist panel
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'fs';
import path from 'path';
import { AdminShell } from '@/components/AdminShell';

interface WaitlistEntry { email: string; ts: string }

function readWaitlist(): WaitlistEntry[] {
  const file = path.join(process.cwd(), 'data', 'waitlist.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean) as WaitlistEntry[];
}

export default function WaitlistPage() {
  const entries = readWaitlist().reverse();

  return (
    <AdminShell title="Waitlist" active="waitlist">
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#D4A853', letterSpacing: '-0.02em' }}>
          {entries.length}
        </span>
        <span style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          signups
        </span>
      </div>

      {entries.length === 0 ? (
        <p style={{ color: 'rgba(212,168,83,0.3)', fontSize: 12, letterSpacing: '0.05em' }}>
          No signups yet.
        </p>
      ) : (
        <div style={{
          border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto',
            padding: '8px 16px',
            borderBottom: '1px solid #1e293b',
            background: 'rgba(255,255,255,0.02)',
            fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#475569',
          }}>
            <span>Email</span>
            <span>Signed up</span>
          </div>

          {/* Rows */}
          {entries.map((e, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              padding: '10px 16px',
              borderBottom: i < entries.length - 1 ? '1px solid #1e293b' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              fontSize: 12,
              alignItems: 'center',
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
    </AdminShell>
  );
}
