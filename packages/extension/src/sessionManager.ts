/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — session lifecycle, TTL enforcement, state management
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import { StatusBarManager } from './statusBar';

export type TTLOption = '15m' | '1h' | '4h';

export interface SessionConfig {
  port: number;
  ttl: TTLOption;
  oneTimeScan: boolean;
  codeViewEnabled: boolean;
}

export interface SessionState {
  active: boolean;
  publicUrl: string | null;
  startedAt: Date | null;
  expiresAt: Date | null;
  config: SessionConfig | null;
}

export class SessionManager {
  private state: SessionState = {
    active: false,
    publicUrl: null,
    startedAt: null,
    expiresAt: null,
    config: null,
  };

  private ttlTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly statusBar: StatusBarManager,
  ) {}

  async start(port: number): Promise<void> {
    if (this.state.active) {
      vscode.window.showWarningMessage('[PortDrop] A session is already active. Stop it first.');
      return;
    }

    // TODO (Phase 1): prompt TTL + options, spin up cloudflared, generate QR
    vscode.window.showInformationMessage(`[PortDrop] Starting session on port ${port}… (stub)`);
  }

  async stop(): Promise<void> {
    if (!this.state.active) return;

    // TODO (Phase 1): kill cloudflared process, clear timer, update webview
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }

    this.state = {
      active: false,
      publicUrl: null,
      startedAt: null,
      expiresAt: null,
      config: null,
    };

    this.statusBar.setIdle();
    vscode.window.showInformationMessage('[PortDrop] Session stopped.');
  }

  openDashboard(): void {
    if (!this.state.publicUrl) {
      vscode.window.showWarningMessage('[PortDrop] No active session.');
      return;
    }
    vscode.env.openExternal(vscode.Uri.parse(this.state.publicUrl));
  }

  copyUrl(): void {
    if (!this.state.publicUrl) {
      vscode.window.showWarningMessage('[PortDrop] No active session.');
      return;
    }
    vscode.env.clipboard.writeText(this.state.publicUrl);
    vscode.window.showInformationMessage('[PortDrop] Session URL copied to clipboard.');
  }

  getState(): Readonly<SessionState> {
    return this.state;
  }
}
