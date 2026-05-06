/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — root layout, global metadata and font config
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const SITE_URL = 'https://portdrop.app';

export const metadata: Metadata = {
  title: 'PortDrop — Share your local app instantly',
  description:
    'Share a running local app with anyone in seconds. You control the window, the clock, and who gets in.',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type:        'website',
    url:         SITE_URL,
    siteName:    'PortDrop',
    title:       'PortDrop — Share your local app instantly',
    description: 'Share a running local app with anyone in seconds. You control the window, the clock, and who gets in.',
    images: [{ url: '/logo/portdrop-master.svg', width: 1200, height: 630, alt: 'PortDrop' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'PortDrop — Share your local app instantly',
    description: 'Share a running local app with anyone in seconds. You control the window, the clock, and who gets in.',
    images:      ['/logo/portdrop-master.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fjalla+One&family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-portdrop-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}
