/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — shared admin layout shell
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useRouter }         from 'next/navigation';
import { FiGrid, FiList, FiMessageSquare, FiSettings, FiLogOut } from 'react-icons/fi';

type NavTab = 'overview' | 'waitlist' | 'feedback' | 'settings';

interface AdminShellProps {
  title:    string;
  active:   NavTab;
  children: React.ReactNode;
}

const NAV: { key: NavTab; label: string; href: string; icon: React.ReactNode }[] = [
  { key: 'overview',  label: 'Overview',  href: '/admin',           icon: <FiGrid size={14} /> },
  { key: 'waitlist',  label: 'Waitlist',  href: '/admin/waitlist',  icon: <FiList size={14} /> },
  { key: 'feedback',  label: 'Feedback',  href: '/admin/feedback',  icon: <FiMessageSquare size={14} /> },
  { key: 'settings',  label: 'Settings',  href: '/admin/settings',  icon: <FiSettings size={14} /> },
];

export function AdminShell({ title, active, children }: AdminShellProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a1628',
      backgroundImage: [
        'repeating-linear-gradient(150deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 8px)',
        'repeating-linear-gradient(60deg,  rgba(255,255,255,0.007) 0px, rgba(255,255,255,0.007) 1px, transparent 1px, transparent 8px)',
      ].join(', '),
      fontFamily: 'var(--font-geist-mono), monospace',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '12px 28px',
        borderBottom: '1px solid #1e293b',
        background: 'rgba(10,22,40,0.95)',
        flexShrink: 0,
      }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', opacity:0.8 }}>
          <img src="/logo/portdrop-favicon-32.svg" alt="PortDrop" width={22} height={22} />
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'#22d3ee' }}>PortDrop</span>
        </a>

        <div style={{ width:1, height:14, background:'#1e293b' }} />
        <span style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(212,168,83,0.5)' }}>Admin</span>

        <div style={{ flex:1 }} />

        {/* Nav tabs */}
        <nav style={{ display:'flex', gap:4 }}>
          {NAV.map(item => (
            <a
              key={item.key}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 8,
                border: active === item.key ? '1px solid rgba(196,133,58,0.45)' : '1px solid transparent',
                background: active === item.key ? 'rgba(196,133,58,0.1)' : 'none',
                color: active === item.key ? '#D4A853' : 'rgba(212,168,83,0.4)',
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ width:1, height:14, background:'#1e293b' }} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid transparent',
            background: 'none',
            color: 'rgba(212,168,83,0.35)',
            fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'var(--font-geist-mono), monospace',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,168,83,0.35)')}
        >
          <FiLogOut size={13} />
          Logout
        </button>
      </header>

      {/* Page content */}
      <main style={{ flex:1, padding: '36px 40px', maxWidth: 900, width: '100%', margin: '0 auto' }}>
        <h2 style={{
          fontSize: 13, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#D4A853', margin: '0 0 28px',
        }}>
          {title}
        </h2>
        {children}
      </main>
    </div>
  );
}
