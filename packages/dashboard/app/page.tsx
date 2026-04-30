/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — root page placeholder (landing page in Phase 1.5)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-portdrop-bg">
      <h1 className="font-mono text-4xl font-bold text-portdrop-cyan">PortDrop</h1>
      <p className="text-portdrop-muted">You control the window. You control the clock.</p>
      <p className="text-sm text-portdrop-muted">
        Landing page coming in Phase 1.5 — scan a QR code to view a session at{' '}
        <code className="text-portdrop-cyan">/s/[sessionId]</code>
      </p>
    </main>
  );
}
