/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — dev-only access log panel (scan times, viewer info)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// TODO (Phase 1): receive viewer scan events via postMessage and render a
// timestamped list of scans, user-agents, and tab visits. Never visible
// to the viewer — extension host only passes this to the sidebar webview.

export function AccessLog() {
  return (
    <section className="access-log">
      <p>Access log — Phase 1</p>
    </section>
  );
}
