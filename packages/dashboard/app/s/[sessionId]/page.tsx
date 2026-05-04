/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — viewer session page, app preview and code view tabs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { notFound } from 'next/navigation';
import { AppPreview } from '@/components/AppPreview';
import { PortDropBadge } from '@/components/PortDropBadge';
import { TTLCountdown } from '@/components/TTLCountdown';
import { PinGate } from '@/components/PinGate';
import { validateSession } from '@/lib/session';

interface SessionPageProps {
  params: { sessionId: string };
}

function LogoMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none">
      <circle cx="12" cy="12" r="11" stroke="#C48540" strokeWidth="1.2"/>
      <circle cx="12" cy="12" r="7.8" stroke="#C48540" strokeWidth="0.9" fill="rgba(13,30,56,0.95)"/>
      <rect x="8.8" y="5.8" width="6.4" height="4.2" rx="0.7" fill="#D4A853" fillOpacity="0.14" stroke="#D4A853" strokeWidth="0.7"/>
      <line x1="10.4" y1="10.0" x2="10.4" y2="12.1" stroke="#D4A853" strokeWidth="0.95" strokeLinecap="round"/>
      <line x1="13.6" y1="10.0" x2="13.6" y2="12.1" stroke="#D4A853" strokeWidth="0.95" strokeLinecap="round"/>
      <rect x="8.2" y="13.2" width="7.6" height="5.0" rx="0.8" fill="rgba(196,133,58,0.09)" stroke="#C48540" strokeWidth="0.7"/>
      <rect x="9.2"  y="14.1" width="2.3" height="3.2" rx="0.4" fill="#C48540" fillOpacity="0.92"/>
      <rect x="12.5" y="14.1" width="2.3" height="3.2" rx="0.4" fill="#C48540" fillOpacity="0.92"/>
    </svg>
  );
}

export default async function SessionPage({ params }: SessionPageProps) {
  const result = await validateSession(params.sessionId);

  if (result.type === 'not-found') notFound();
  if (result.type === 'pin-required') return <PinGate sessionId={params.sessionId} />;

  const session = result.data;
  const displayUrl = session.publicUrl.replace(/^https?:\/\//, '');

  return (
    <main className="relative flex min-h-screen flex-col bg-portdrop-bg">
      <header className="flex items-center justify-between border-b border-portdrop-border bg-portdrop-surface/60 px-5 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <LogoMark />
          <span className="font-mono text-sm font-semibold tracking-widest text-portdrop-cyan uppercase">
            PortDrop
          </span>
          <span className="hidden sm:block text-portdrop-border font-mono">·</span>
          <span
            className="hidden sm:block font-mono text-[10px] text-portdrop-muted truncate max-w-[260px]"
            title={session.publicUrl}
          >
            {displayUrl}
          </span>
          {session.oneTimeScan && (
            <span className="hidden sm:flex items-center gap-1 rounded border border-[#eab308]/30 bg-[#eab308]/10 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-[#eab308] uppercase">
              ⚡ One-time link
            </span>
          )}
        </div>
        <TTLCountdown expiresAt={session.expiresAt} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AppPreview tunnelUrl={session.publicUrl} expiresAt={session.expiresAt} />
        {/* TODO (Phase 2): CodeView tab rendered here when session.codeViewEnabled */}
      </div>

      <PortDropBadge
        expiresAt={session.expiresAt}
        scanCount={session.scanCount}
        oneTimeScan={session.oneTimeScan}
      />
    </main>
  );
}
