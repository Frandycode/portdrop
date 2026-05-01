/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — local HTTP relay, exposes session store to the dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as http from 'http';
import { sessionStore } from '../store/sessionStore';

/** Port the relay listens on — Next.js API route calls this */
const RELAY_PORT = 49_491; // fixed high port, unlikely to collide

let server: http.Server | null = null;

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * Handles all incoming requests to the relay.
 *
 * Routes:
 *  GET  /health                    — liveness check
 *  GET  /sessions/:sessionId       — validate + access a session (increments scan count)
 *  POST /sessions/:sessionId/stop  — stop a session from outside the extension (future)
 */
function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): void {
  const url    = req.url ?? '/';
  const method = req.method ?? 'GET';

  // ── CORS for localhost Next.js dev server ──────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── GET /health ────────────────────────────────────────────────────────────
  if (method === 'GET' && url === '/health') {
    json(res, 200, { ok: true, service: 'portdrop-relay' });
    return;
  }

  // ── GET /sessions/:sessionId ───────────────────────────────────────────────
  const sessionMatch = url.match(/^\/sessions\/([a-f0-9]{32})$/);
  if (method === 'GET' && sessionMatch) {
    const sessionId = sessionMatch[1];
    const data      = sessionStore.access(sessionId);

    if (!data) {
      json(res, 404, { error: 'Session not found or expired', sessionId });
      return;
    }

    json(res, 200, {
      sessionId:       data.sessionId,
      publicUrl:       data.publicUrl,
      // Serialize Date to ISO string for JSON transport
      expiresAt:       data.expiresAt.toISOString(),
      codeViewEnabled: data.codeViewEnabled,
      oneTimeScan:     data.oneTimeScan,
      scanCount:       data.scanCount,
    });
    return;
  }

  // ── 404 fallback ───────────────────────────────────────────────────────────
  json(res, 404, { error: 'Not found' });
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

/**
 * Starts the relay server if it isn't already running.
 * Safe to call multiple times — idempotent.
 */
export function startRelay(): Promise<void> {
  if (server) return Promise.resolve();

  return new Promise((resolve, reject) => {
    server = http.createServer(handleRequest);

    server.on('error', (err) => {
      console.error(`[PortDrop:Relay] Server error: ${err.message}`);
      reject(err);
    });

    server.listen(RELAY_PORT, '127.0.0.1', () => {
      console.log(`[PortDrop:Relay] Listening on http://127.0.0.1:${RELAY_PORT}`);
      resolve();
    });
  });
}

/**
 * Stops the relay server.
 * Called on extension deactivate.
 */
export function stopRelay(): Promise<void> {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close(() => {
      server = null;
      console.log('[PortDrop:Relay] Server stopped.');
      resolve();
    });
  });
}

export { RELAY_PORT };

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(res: http.ServerResponse, status: number, body: object): void {
  res.writeHead(status);
  res.end(JSON.stringify(body));
}
