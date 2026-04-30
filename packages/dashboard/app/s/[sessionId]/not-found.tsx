/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — 404 / not-found page shown when session is invalid or expired
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-portdrop-bg px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-6xl text-portdrop-orange">✕</span>
        <h1 className="font-mono text-2xl font-bold text-white">Session Expired</h1>
        <p className="max-w-sm text-portdrop-muted">
          This PortDrop session has expired or the link has already been used.
          Ask the developer to start a new session.
        </p>
      </div>
      <p className="text-xs text-portdrop-muted">
        Powered by{' '}
        <a
          href="https://portdrop.dev"
          className="text-portdrop-cyan hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          PortDrop
        </a>
      </p>
    </main>
  );
}
