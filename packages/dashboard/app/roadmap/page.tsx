/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — public roadmap page
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap — PortDrop',
  description: 'See what shipped in V1 and what\'s coming in V2.',
  alternates: { canonical: '/roadmap' },
};

const V1_ITEMS = [
  'Session sharing via public Cloudflare tunnel URL',
  'QR code generation for instant mobile sharing',
  'TTL-controlled sessions (15 min, 1 h, 4 h, custom)',
  'PIN gate — optional 4-digit access code',
  'One-time scan link — auto-expires after first visit',
  'Viewer cap — limit concurrent connections',
  'Live admin controls — stop, extend, or copy URL mid-session',
];

const V2_ITEMS = [
  'Teams — shared sessions and org-level access',
  'Session history — searchable audit log',
  'Usage tiers — free, pro, and enterprise plans',
  'Code View — read-only file browser inside the session',
  'Billing — Stripe-powered subscription management',
  'CLI — start and manage sessions without VS Code',
];

export default function RoadmapPage() {
  return (
    <div className="pd-body">
      <div className="page-stitch" />

      {/* NAV */}
      <nav className="pd-nav">
        <div className="pd-brand">
          <img src="/logo/portdrop-navbar.svg" alt="PortDrop" width={28} height={28} />
          <a href="/" className="pd-brand-name" style={{ textDecoration: 'none' }}>PortDrop</a>
        </div>
        <div className="pd-nav-links">
          <a href="/#features">Features</a>
          <a href="/#how">How it works</a>
          <a href="/#docs">Docs</a>
          <a href="/#changelog">Changelog</a>
          <a href="/roadmap" style={{ color: '#D4A853' }}>Roadmap</a>
        </div>
        <a
          href="/#docs"
          className="pd-nav-cta"
          style={{ textDecoration: 'none' }}
        >
          Install <span className="pd-nav-arrow">↓</span>
        </a>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '140px 48px 0', position: 'relative', zIndex: 5 }}>
        <div className="pd-eyebrow" style={{ marginBottom: 20 }}>
          <span className="pd-pulse" />
          What&apos;s shipping
        </div>
        <h1 className="pd-h1">
          Built in the <span className="accent">open.</span>
        </h1>
        <p className="pd-lede" style={{ marginBottom: 0 }}>
          V1 ships everything a solo developer needs to share a running app. V2 is being built in parallel — shaped by feedback from real V1 users.
        </p>
      </div>

      {/* ROADMAP GRID */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 48px 0', position: 'relative', zIndex: 5 }}>
        <div className="pd-roadmap-grid">

          {/* V1 — Shipped */}
          <div className="pd-rm-col">
            <div className="pd-rm-col-badge">
              <span className="pd-pulse" />
              Shipped · V1
            </div>
            <div className="pd-rm-col-title">What&apos;s live today</div>
            <div className="pd-rm-items">
              {V1_ITEMS.map((item) => (
                <div key={item} className="pd-rm-item">
                  <span className="pd-rm-check">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* V2 — Coming */}
          <div className="pd-rm-col pd-rm-col--v2">
            <div className="pd-rm-col-badge">
              &#x1F512; Coming · V2
            </div>
            <div className="pd-rm-col-title">What&apos;s next</div>
            <div className="pd-rm-items">
              {V2_ITEMS.map((item) => (
                <div key={item} className="pd-rm-item">
                  <span className="pd-rm-lock">&#x1F512;</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CTA */}
        <div style={{ marginTop: 64, paddingBottom: 120, borderTop: '2px dashed rgba(196,133,58,0.22)', paddingTop: 48 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '2px', color: 'rgba(212,168,83,0.5)', textTransform: 'uppercase', marginBottom: 20 }}>
            Using V1? Your feedback shapes V2.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a
              href="/#docs"
              className="pd-btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Install V1 <span className="pd-nav-arrow" style={{ fontSize: 16 }}>↓</span>
            </a>
            <a
              href="https://github.com/Frandycode/portdrop"
              target="_blank"
              rel="noopener noreferrer"
              className="pd-btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pd-footer">
        <div>© 2026 · PortDrop</div>
        <a href="/roadmap" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '2px', color: 'rgba(212,168,83,0.5)', textDecoration: 'none', textTransform: 'uppercase' }}>
          Roadmap
        </a>
      </footer>
    </div>
  );
}
