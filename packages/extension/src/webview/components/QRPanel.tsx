/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — QR code display panel in the sidebar webview
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface QRPanelProps {
  dataUri: string;
  url:     string;
}

export function QRPanel({ dataUri, url }: QRPanelProps) {
  return (
    <div className="pd-qr">
      <img src={dataUri} alt="PortDrop session QR code" />
      <div className="pd-qr-url">{url}</div>
    </div>
  );
}
