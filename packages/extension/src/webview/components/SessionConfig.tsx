/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — read-only session config panel in the sidebar webview
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface SessionConfigProps {
  port:         number;
  ttl:          string;
  pin?:         string;
  oneTimeScan?: boolean;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="pd-config-row">
      <span className="pd-config-key">{label}</span>
      <span className="pd-config-val">{value}</span>
    </div>
  );
}

export function SessionConfig({ port, ttl, pin, oneTimeScan }: SessionConfigProps) {
  return (
    <div className="pd-config">
      <Row label="Port" value={`:${port}`} />
      <Row label="TTL"  value={ttl} />
      {pin         && <Row label="PIN"  value="set" />}
      {oneTimeScan && <Row label="Mode" value="one-time" />}
    </div>
  );
}
