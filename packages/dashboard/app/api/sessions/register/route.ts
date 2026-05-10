/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — session registration API called by the VS Code extension
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export interface RedisSession {
  sessionId:       string;
  publicUrl:       string;
  relayUrl:        string | null;
  expiresAt:       string;
  pinHash:         string | null;
  oneTimeScan:     boolean;
  maxUsers:        number | null;
  codeViewEnabled: boolean;
  /** Forward-slash workspace-relative file paths viewers may read; null = full tree */
  allowlist:       string[] | null;
  scanCount:       number;
  burned:          boolean;
  status:          'active' | 'stopped';
}

/** POST /api/sessions/register — called by the extension when a session starts */
export async function POST(req: NextRequest) {
  let body: {
    sessionId?: string;
    publicUrl?: string;
    relayUrl?: string | null;
    expiresAt?: string;
    pinHash?: string | null;
    oneTimeScan?: boolean;
    maxUsers?: number | null;
    codeViewEnabled?: boolean;
    allowlist?: string[] | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { sessionId, publicUrl, expiresAt } = body;
  if (!sessionId || !publicUrl || !expiresAt) {
    return NextResponse.json({ error: 'sessionId, publicUrl, and expiresAt are required' }, { status: 400 });
  }

  const expiresMs  = new Date(expiresAt).getTime();
  const ttlSeconds = Math.max(60, Math.ceil((expiresMs - Date.now()) / 1000));

  const session: RedisSession = {
    sessionId,
    publicUrl,
    relayUrl:        body.relayUrl         ?? null,
    expiresAt,
    pinHash:         body.pinHash          ?? null,
    oneTimeScan:     body.oneTimeScan      ?? false,
    maxUsers:        body.maxUsers         ?? null,
    codeViewEnabled: body.codeViewEnabled  ?? false,
    allowlist:       body.allowlist        ?? null,
    scanCount:       0,
    burned:          false,
    status:          'active',
  };

  await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: ttlSeconds });

  return NextResponse.json({ ok: true, sessionId }, { status: 201 });
}

/** DELETE /api/sessions/register?sessionId=xxx — called by the extension on stop */
export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const raw = await redis.get(`session:${sessionId}`);
  if (raw) {
    const session = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RedisSession;
    session.status = 'stopped';
    const ttl = await redis.ttl(`session:${sessionId}`);
    await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: Math.max(60, ttl) });
  }

  return NextResponse.json({ ok: true });
}
