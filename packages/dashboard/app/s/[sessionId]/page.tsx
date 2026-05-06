/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — viewer session page, launch portal
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { notFound } from 'next/navigation';
import { PinGate }            from '@/components/PinGate';
import { SessionLaunch }      from '@/components/SessionLaunch';
import { SessionPageTracker } from '@/components/SessionPageTracker';
import { validateSession }    from '@/lib/session';
import { FiUsers, FiZap, FiPower } from 'react-icons/fi';

interface SessionPageProps {
  params: { sessionId: string };
}

function BlockedView({
  icon, headline, body, action,
}: {
  icon:     React.ReactNode;
  headline: string;
  body:     string;
  action?:  React.ReactNode;
}) {
  return (
    <main className="jeans-stonewash jeans-stitch" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'var(--font-geist-mono), monospace',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid #1e293b', borderRadius: 24,
        padding: '40px 36px', backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        <a href="/" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, textDecoration:'none', opacity:0.9 }}>
          <img src="/logo/portdrop-favicon-32.svg" alt="PortDrop" width={48} height={48} />
          <span style={{ fontSize:11, letterSpacing:'0.25em', textTransform:'uppercase', color:'#22d3ee', fontWeight:600 }}>PortDrop</span>
        </a>
        <div style={{ width:'100%', height:1, background:'#1e293b' }} />
        <div style={{
          width:44, height:44, borderRadius:14,
          background:'rgba(196,133,58,0.1)', border:'1px solid rgba(196,133,58,0.28)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'#C48540',
        }}>{icon}</div>
        <h1 style={{ fontSize:15, fontWeight:700, color:'#D4A853', letterSpacing:'0.15em', textTransform:'uppercase', margin:0, textAlign:'center' }}>
          {headline}
        </h1>
        <p style={{ fontSize:11, color:'#64748b', letterSpacing:'0.05em', margin:0, textAlign:'center', lineHeight:1.7 }}>
          {body}
        </p>
        {action}
      </div>
    </main>
  );
}

export default async function SessionPage({ params }: SessionPageProps) {
  const result = await validateSession(params.sessionId);

  if (result.type === 'not-found')   notFound();
  if (result.type === 'pin-required') return <PinGate sessionId={params.sessionId} />;

  if (result.type === 'relay-down') return (
    <BlockedView
      icon={<FiPower size={20} />}
      headline="Extension Not Running"
      body="PortDrop is not active in VS Code. Ask the developer to open VS Code and start a new session, then try again."
      action={
        <a
          href={`/s/${params.sessionId}`}
          style={{
            display: 'inline-block',
            marginTop: 4,
            padding: '8px 22px',
            borderRadius: 10,
            border: '1px solid rgba(196,133,58,0.35)',
            background: 'rgba(196,133,58,0.08)',
            color: '#D4A853',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          Try Again
        </a>
      }
    />
  );

  if (result.type === 'one-time-burned') return (
    <BlockedView
      icon={<FiZap size={20} />}
      headline="Link Already Used"
      body="This was a one-time link. It has already been opened and cannot be used again. Ask the developer for a new session."
    />
  );

  if (result.type === 'capacity-full') return (
    <BlockedView
      icon={<FiUsers size={20} />}
      headline="Session Full"
      body="This session has reached its viewer limit. Ask the developer to increase the limit or start a new session."
    />
  );

  const { data: session } = result;

  return (
    <>
      <SessionPageTracker />
      <SessionLaunch
        sessionId={session.sessionId}
        publicUrl={session.publicUrl}
        expiresAt={session.expiresAt}
        scanCount={session.scanCount}
        oneTimeScan={session.oneTimeScan}
        codeViewEnabled={session.codeViewEnabled}
      />
    </>
  );
}
