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

import { Redis } from '@upstash/redis';
import { AdminShell } from '@/components/AdminShell';
import { WaitlistTable } from '@/components/WaitlistTable';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface WaitlistEntry { email: string; ts: string }

async function readWaitlist(): Promise<WaitlistEntry[]> {
  const raw = await redis.lrange<string>('waitlist', 0, -1);
  return raw.map(item => {
    try { return typeof item === 'string' ? JSON.parse(item) : item; }
    catch { return null; }
  }).filter(Boolean) as WaitlistEntry[];
}

export default async function WaitlistPage() {
  const entries = await readWaitlist();

  return (
    <AdminShell title="Waitlist" active="waitlist">
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#D4A853', letterSpacing: '-0.02em' }}>
            {entries.length}
          </span>
          <span style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            signups
          </span>
        </div>
        {entries.length > 0 && (
          <a
            href="/api/admin/export/waitlist"
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

      <WaitlistTable entries={entries} />
    </AdminShell>
  );
}
