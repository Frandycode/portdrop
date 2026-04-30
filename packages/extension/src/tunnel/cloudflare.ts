/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — cloudflared binary wrapper, tunnel lifecycle
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ChildProcess } from 'child_process';

export interface TunnelResult {
  publicUrl: string;
  process: ChildProcess;
}

/**
 * Spawns a `cloudflared tunnel --url http://localhost:<port>` process,
 * parses the public URL from stdout, and returns it alongside the process
 * handle so the caller can kill it on session end.
 *
 * TODO (Phase 1):
 *  - Resolve cloudflared binary path (bundled or system)
 *  - Spawn process and parse URL from stderr/stdout
 *  - Emit lifecycle events: 'ready', 'error', 'closed'
 *  - Handle binary not found with a clear user-facing error
 */
export async function startTunnel(_port: number): Promise<TunnelResult> {
  throw new Error('[PortDrop] Tunnel not implemented yet — coming in Phase 1.');
}

export function stopTunnel(proc: ChildProcess): void {
  if (!proc.killed) {
    proc.kill('SIGTERM');
  }
}
