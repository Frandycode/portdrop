/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : @CodeBreeder
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
import { resolveCloudflared } from './tunnel/installer';
import { sessionStore } from './store/sessionStore';
import { startRelay, stopRelay } from './relay/server';
import { SidebarProvider } from './webview/SidebarProvider';

let statusBar: StatusBarManager;
let session: SessionManager;

export function activate(context: vscode.ExtensionContext): void {
  console.log('[PortDrop] Extension activated.');

  statusBar = new StatusBarManager();

  const sidebar = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.VIEW_ID, sidebar),
  );

  session = new SessionManager(context, statusBar, sidebar);

  const detector = new PortDetector();

  // ── Preflight: resolve cloudflared in background on startup ──────────────
  // Resolved eagerly so the first "Start Session" feels instant.
  // Errors surface only when the user actually tries to start a session.
  resolveCloudflared(context).catch((err) => {
    console.warn('[PortDrop] cloudflared preflight skipped:', err.message);
  });

  // ── Start local relay server ───────────────────────────────────────────────
  startRelay().catch((err) => {
    vscode.window.showErrorMessage(`[PortDrop] Relay failed to start: ${err.message}`);
  });

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
  sessionStore.clear();
  stopRelay();
  console.log('[PortDrop] Extension deactivated.');
}
