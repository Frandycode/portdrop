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

import { Redis } from '@upstash/redis';
import { AdminShell } from '@/components/AdminShell';
import { FeedbackPanel } from '@/components/FeedbackPanel';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface FeedbackEntry { text: string; stars?: number; ts: string }

async function readFeedback(): Promise<FeedbackEntry[]> {
  const raw = await redis.lrange<string>('feedback', 0, -1);
  return raw.map(item => {
    try { return typeof item === 'string' ? JSON.parse(item) : item; }
    catch { return null; }
  }).filter(Boolean) as FeedbackEntry[];
}

function avgStars(entries: FeedbackEntry[]): string {
  const rated = entries.filter(e => typeof e.stars === 'number');
  if (!rated.length) return '—';
  return (rated.reduce((s, e) => s + (e.stars ?? 0), 0) / rated.length).toFixed(1);
}

export default async function FeedbackPage() {
  const entries = await readFeedback();
  const avg     = avgStars(entries);

  return (
    <AdminShell title="Feedback" active="feedback">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#D4A853' }}>{entries.length}</span>
            <span style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>responses</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#D4A853' }}>{avg}</span>
            <span style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>avg stars</span>
          </div>
        </div>
        {entries.length > 0 && (
          <a
            href="/api/admin/export/feedback"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid rgba(196,133,58,0.3)',
              background: 'rgba(196,133,58,0.07)',
              color: '#D4A853', fontSize: 10,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              textDecoration: 'none', fontFamily: 'var(--font-geist-mono), monospace',
            }}
          >
            ↓ Export CSV
          </a>
        )}
      </div>

      <FeedbackPanel entries={entries} />
    </AdminShell>
  );
}
