/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — detect running dev servers and present port picker
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import * as net from 'net';

/** Ports commonly used by dev servers (Vite, Next.js, CRA, Express, FastAPI, Django) */
const CANDIDATE_PORTS = [3000, 3001, 4000, 4321, 5000, 5173, 8000, 8080, 8888];

export class PortDetector {
  /**
   * Scans candidate ports, presents any open ones to the user as a quick-pick,
   * and returns the selected port number — or undefined if cancelled.
   */
  async pickPort(): Promise<number | undefined> {
    const open = await this.scanPorts(CANDIDATE_PORTS);

    if (open.length === 0) {
      const manual = await vscode.window.showInputBox({
        title: 'PortDrop — No dev servers detected',
        prompt: 'Enter the port your app is running on',
        placeHolder: '3000',
        validateInput: (v) => (isNaN(Number(v)) ? 'Must be a number' : null),
      });
      return manual ? Number(manual) : undefined;
    }

    const items = open.map((p) => ({
      label: `$(broadcast) :${p}`,
      description: this.guessFramework(p),
      port: p,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      title: 'PortDrop — Select a running dev server',
      placeHolder: 'Choose a port to share',
    });

    return picked?.port;
  }

  /** Returns which candidate ports have something actively listening. */
  private scanPorts(ports: number[]): Promise<number[]> {
    return Promise.all(ports.map((p) => this.isPortOpen(p))).then((results) =>
      ports.filter((_, i) => results[i]),
    );
  }

  private isPortOpen(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(150);
      socket
        .once('connect', () => { socket.destroy(); resolve(true); })
        .once('error', () => { socket.destroy(); resolve(false); })
        .once('timeout', () => { socket.destroy(); resolve(false); })
        .connect(port, '127.0.0.1');
    });
  }

  private guessFramework(port: number): string {
    const map: Record<number, string> = {
      5173: 'Vite',
      3000: 'Next.js / Express / CRA',
      3001: 'Express / CRA',
      4321: 'Astro',
      8000: 'FastAPI / Django',
      8080: 'Generic HTTP',
      5000: 'Flask / Express',
    };
    return map[port] ?? 'Dev server';
  }
}
