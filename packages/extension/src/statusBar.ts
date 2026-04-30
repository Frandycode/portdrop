/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — VS Code status bar item with live session state
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';

export class StatusBarManager implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private tickInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.setIdle();
    this.item.show();
  }

  setIdle(): void {
    this.stopTick();
    this.item.text        = '$(broadcast) PortDrop';
    this.item.tooltip     = 'PortDrop — click to start a session';
    this.item.command     = 'portdrop.start';
    this.item.color       = undefined;
    this.item.backgroundColor = undefined;
  }

  setActive(expiresAt: Date, url: string): void {
    this.stopTick();
    this.tickInterval = setInterval(() => this.tick(expiresAt, url), 1000);
    this.tick(expiresAt, url);
  }

  setExpired(): void {
    this.stopTick();
    this.item.text             = '$(warning) PortDrop — Expired';
    this.item.tooltip          = 'Session expired — click to start a new one';
    this.item.command          = 'portdrop.start';
    this.item.backgroundColor  = new vscode.ThemeColor('statusBarItem.warningBackground');
  }

  private tick(expiresAt: Date, url: string): void {
    const remaining = expiresAt.getTime() - Date.now();
    if (remaining <= 0) {
      this.setExpired();
      return;
    }
    const m = Math.floor(remaining / 60_000);
    const s = Math.floor((remaining % 60_000) / 1000);
    const clock = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    this.item.text    = `$(broadcast) PortDrop | ${clock}`;
    this.item.tooltip = `Active session: ${url}\nClick to open dashboard`;
    this.item.command = 'portdrop.openDashboard';
  }

  private stopTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  dispose(): void {
    this.stopTick();
    this.item.dispose();
  }
}
