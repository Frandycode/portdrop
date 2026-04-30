/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — extension entry point, activate/deactivate lifecycle
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import { StatusBarManager } from './statusBar';
import { SessionManager } from './sessionManager';
import { PortDetector } from './portDetector';

let statusBar: StatusBarManager;
let session: SessionManager;

export function activate(context: vscode.ExtensionContext): void {
  console.log('[PortDrop] Extension activated.');

  statusBar = new StatusBarManager();
  session   = new SessionManager(context, statusBar);

  const detector = new PortDetector();

  // ── Commands ──────────────────────────────────────────────────────────────

  const startCmd = vscode.commands.registerCommand('portdrop.start', async () => {
    const port = await detector.pickPort();
    if (!port) return;
    await session.start(port);
  });

  const stopCmd = vscode.commands.registerCommand('portdrop.stop', async () => {
    await session.stop();
  });

  const openDashboardCmd = vscode.commands.registerCommand(
    'portdrop.openDashboard',
    () => session.openDashboard(),
  );

  const copyUrlCmd = vscode.commands.registerCommand(
    'portdrop.copyUrl',
    () => session.copyUrl(),
  );

  context.subscriptions.push(startCmd, stopCmd, openDashboardCmd, copyUrlCmd, statusBar);
}

export function deactivate(): void {
  session?.stop();
  console.log('[PortDrop] Extension deactivated.');
}
