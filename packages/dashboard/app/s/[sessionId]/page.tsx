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
import { validateSession } from '@/lib/session';

interface SessionPageProps {
  params: { sessionId: string };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const session = await validateSession(params.sessionId);

  if (!session) notFound();

  return (
    <main className="relative flex min-h-screen flex-col bg-portdrop-bg">
      <header className="flex items-center justify-between border-b border-portdrop-border px-6 py-3">
        <span className="font-mono text-sm text-portdrop-cyan">PortDrop</span>
        <TTLCountdown expiresAt={session.expiresAt} />
      </header>

      {/* App preview fills remaining height */}
      <div className="flex flex-1 overflow-hidden">
        <AppPreview tunnelUrl={session.tunnelUrl} />

        {/* TODO (Phase 2): CodeView tab rendered here when session.codeViewEnabled */}
      </div>

      <PortDropBadge expiresAt={session.expiresAt} />
    </main>
  );
}
