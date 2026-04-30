/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — cloudflared spawn, URL parsing, tunnel lifecycle
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TunnelResult {
  /** The public trycloudflare.com URL assigned to this tunnel */
  publicUrl: string;
  /** The spawned cloudflared process — keep a reference to kill it later */
  process: ChildProcess;
  /** EventEmitter that fires 'close' and 'error' after the tunnel is up */
  events: TunnelEvents;
}

export type TunnelEvents = EventEmitter & {
  on(event: 'close', listener: (code: number | null) => void): TunnelEvents;
  on(event: 'error', listener: (err: Error) => void): TunnelEvents;
};

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * cloudflared writes the public URL to stderr, not stdout.
 * This regex captures the trycloudflare.com URL from lines like:
 *   "Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): https://xxxx.trycloudflare.com"
 *   or the shorter:
 *   "https://xxxx.trycloudflare.com"
 */
const TUNNEL_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

/** How long to wait for the tunnel URL before giving up (ms) */
const STARTUP_TIMEOUT_MS = 30_000;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Spawns `cloudflared tunnel --url http://localhost:<port>` and resolves
 * with the public URL once cloudflared emits it on stderr.
 *
 * Rejects if:
 *  - The URL is not emitted within STARTUP_TIMEOUT_MS
 *  - The process exits before emitting a URL
 *  - The process fails to spawn
 *
 * @param binaryPath - Absolute path to the cloudflared binary
 * @param port       - Local port of the running dev server
 */
export function startTunnel(binaryPath: string, port: number): Promise<TunnelResult> {
  return new Promise((resolve, reject) => {
    const args = [
      'tunnel',
      '--url', `http://localhost:${port}`,
      '--no-autoupdate',
    ];

    const proc = spawn(binaryPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const emitter = new EventEmitter() as TunnelEvents;
    let resolved  = false;
    let buffer    = '';

    const cleanup = (reason: string, err?: Error) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      if (err) {
        reject(err);
      } else {
        reject(new Error(`[PortDrop] Tunnel failed before URL was ready: ${reason}`));
      }
    };

    // ── Timeout guard ───────────────────────────────────────────────────────
    const timer = setTimeout(() => {
      cleanup(`no URL received within ${STARTUP_TIMEOUT_MS / 1000}s`);
      stopTunnel(proc);
    }, STARTUP_TIMEOUT_MS);

    // ── Parse URL from stderr ───────────────────────────────────────────────
    // cloudflared writes connection info to stderr
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      const match = buffer.match(TUNNEL_URL_RE);
      if (!match) return;

      const publicUrl = match[0];
      resolved        = true;
      clearTimeout(timer);

      console.log(`[PortDrop] Tunnel ready: ${publicUrl}`);
      resolve({ publicUrl, process: proc, events: emitter });
    };

    proc.stderr?.on('data', onData);
    proc.stdout?.on('data', onData); // belt-and-suspenders: some versions use stdout

    // ── Process lifecycle ───────────────────────────────────────────────────
    proc.on('error', (err) => {
      cleanup('spawn error', new Error(`[PortDrop] Failed to spawn cloudflared: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (!resolved) {
        cleanup(`process exited with code ${code}`);
      } else {
        // Tunnel was running but dropped — notify callers
        emitter.emit('close', code);
      }
    });
  });
}

/**
 * Gracefully terminates a running cloudflared tunnel process.
 * Sends SIGTERM first; forces SIGKILL after 3 seconds if still alive.
 */
export function stopTunnel(proc: ChildProcess): void {
  if (proc.killed || proc.exitCode !== null) return;

  proc.kill('SIGTERM');

  const forceKill = setTimeout(() => {
    if (!proc.killed) {
      proc.kill('SIGKILL');
    }
  }, 3_000);

  proc.once('close', () => clearTimeout(forceKill));
}
