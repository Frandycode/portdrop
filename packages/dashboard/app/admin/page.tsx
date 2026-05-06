/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin overview dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Redis } from '@upstash/redis';
import { AdminShell } from '@/components/AdminShell';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface WaitlistEntry { email: string; ts: string }
interface FeedbackEntry { text: string; stars?: number; ts: string }

function avgStars(entries: FeedbackEntry[]): string {
  const rated = entries.filter(e => typeof e.stars === 'number');
  if (!rated.length) return '—';
  return (rated.reduce((s, e) => s + (e.stars ?? 0), 0) / rated.length).toFixed(1);
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function AdminOverview() {
  const [rawWaitlist, rawFeedback] = await Promise.all([
    redis.lrange<string>('waitlist', 0, -1),
    redis.lrange<string>('feedback', 0, -1),
  ]);

  const waitlist: WaitlistEntry[] = rawWaitlist.map(r => {
    try { return typeof r === 'string' ? JSON.parse(r) : r; } catch { return null; }
  }).filter(Boolean) as WaitlistEntry[];

  const feedback: FeedbackEntry[] = rawFeedback.map(r => {
    try { return typeof r === 'string' ? JSON.parse(r) : r; } catch { return null; }
  }).filter(Boolean) as FeedbackEntry[];

  const avg = avgStars(feedback);
  const ratedCount = feedback.filter(e => typeof e.stars === 'number').length;

  const recentWaitlist = waitlist.slice(0, 5);
  const recentFeedback = feedback.slice(0, 5);

  const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid #1e293b',
    borderRadius: 14,
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  return (
    <AdminShell title="Overview" active="overview">

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        <div style={CARD}>
          <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#475569' }}>Waitlist</span>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#D4A853', letterSpacing: '-0.02em' }}>{waitlist.length}</span>
          <span style={{ fontSize: 10, color: '#334155' }}>total signups</span>
        </div>
        <div style={CARD}>
          <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#475569' }}>Feedback</span>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#D4A853', letterSpacing: '-0.02em' }}>{feedback.length}</span>
          <span style={{ fontSize: 10, color: '#334155' }}>{ratedCount} with star rating</span>
        </div>
        <div style={CARD}>
          <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#475569' }}>Avg Rating</span>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#D4A853', letterSpacing: '-0.02em' }}>{avg}</span>
          <span style={{ fontSize: 10, color: '#334155' }}>out of 5 stars</span>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Recent signups */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#475569' }}>Recent Signups</span>
            <a href="/admin/waitlist" style={{ fontSize: 10, color: 'rgba(212,168,83,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>View all →</a>
          </div>
          {recentWaitlist.length === 0 ? (
            <p style={{ fontSize: 11, color: '#334155', letterSpacing: '0.05em' }}>No signups yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentWaitlist.map((e, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 14px', borderRadius: 8,
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.02em' }}>{e.email}</span>
                  <span style={{ fontSize: 10, color: '#334155', whiteSpace: 'nowrap', marginLeft: 12 }}>{timeAgo(e.ts)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent feedback */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#475569' }}>Recent Feedback</span>
            <a href="/admin/feedback" style={{ fontSize: 10, color: 'rgba(212,168,83,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>View all →</a>
          </div>
          {recentFeedback.length === 0 ? (
            <p style={{ fontSize: 11, color: '#334155', letterSpacing: '0.05em' }}>No feedback yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentFeedback.map((e, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid #1e293b',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12 }}>
                      {typeof e.stars === 'number' ? '★'.repeat(e.stars) + '☆'.repeat(5 - e.stars) : '—'}
                    </span>
                    <span style={{ fontSize: 10, color: '#334155' }}>{timeAgo(e.ts)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {e.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </AdminShell>
  );
}
