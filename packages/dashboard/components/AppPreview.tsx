/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — app preview iframe that renders the tunneled dev server
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface AppPreviewProps {
  tunnelUrl: string;
}

export function AppPreview({ tunnelUrl }: AppPreviewProps) {
  return (
    <iframe
      src={tunnelUrl}
      className="h-full w-full flex-1 border-0"
      title="PortDrop app preview"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}
