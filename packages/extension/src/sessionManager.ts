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
import { ChildProcess } from 'child_process';
import { StatusBarManager } from './statusBar';
import { resolveCloudflared } from './tunnel/installer';
import { startTunnel, stopTunnel } from './tunnel/cloudflare';
import { generateQRDataUri } from './qrGenerator';
import { sessionStore } from './store/sessionStore';
import { TTLOption } from './store/types';
import { SidebarProvider } from './webview/SidebarProvider';

export interface SessionConfig {
  port: number;
  ttl: TTLOption;
  oneTimeScan: boolean;
  codeViewEnabled: boolean;
}

export interface SessionState {
  active: boolean;
  publicUrl: string | null;
  qrDataUri: string | null;
  startedAt: Date | null;
  expiresAt: Date | null;
  config: SessionConfig | null;
}

export class SessionManager {
  private state: SessionState = {
    active: false,
    publicUrl: null,
    qrDataUri: null,
    startedAt: null,
    expiresAt: null,
    config: null,
  };

  private tunnelProcess: ChildProcess | null  = null;
  private ttlTimer: NodeJS.Timeout | null     = null;
  private currentSessionId: string | null     = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly statusBar: StatusBarManager,
    private readonly sidebar: SidebarProvider,
  ) {
    // ── Handle messages sent from the sidebar React UI ───────────────────────
    sidebar.onMessage((msg) => {
      switch (msg.type) {
        case 'REQUEST_STOP':             this.stop();          break;
        case 'REQUEST_COPY_URL':         this.copyUrl();       break;
        case 'REQUEST_OPEN_DASHBOARD':   this.openDashboard(); break;
      }
    });
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  async start(port: number): Promise<void> {
    if (this.state.active) {
      vscode.window.showWarningMessage('[PortDrop] A session is already active. Stop it first.');
      return;
    }

    // ── Pick TTL ────────────────────────────────────────────────────────────
    const ttlPick = await vscode.window.showQuickPick(
      [
        { label: '$(clock) 15 minutes', ttl: '15m' as TTLOption },
        { label: '$(clock) 1 hour',     ttl: '1h'  as TTLOption },
        { label: '$(clock) 4 hours',    ttl: '4h'  as TTLOption },
      ],
      { title: 'PortDrop — How long should this session last?' },
    );
    if (!ttlPick) return;

    const ttl = ttlPick.ttl;

    // ── Resolve binary ───────────────────────────────────────────────────────
    let binaryPath: string;
    try {
      binaryPath = await resolveCloudflared(this.context);
    } catch (err: unknown) {
      vscode.window.showErrorMessage(`[PortDrop] ${(err as Error).message}`);
      return;
    }

    // ── Spin up tunnel ───────────────────────────────────────────────────────
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `PortDrop: Opening tunnel on :${port}…`,
        cancellable: false,
      },
      async () => {
        const result = await startTunnel(binaryPath, port);

        this.tunnelProcess = result.process;

        // Handle unexpected tunnel drop
        result.events.on('close', (code) => {
          vscode.window.showWarningMessage(
            `[PortDrop] Tunnel closed unexpectedly (code ${code}). Session ended.`,
          );
          this.stop();
        });

        const qrDataUri = await generateQRDataUri(result.publicUrl);

        // Register with the session store — store owns TTL scheduling
        const record = sessionStore.create({
          publicUrl:       result.publicUrl,
          qrDataUri,
          port,
          ttl,
          oneTimeScan:     false,
          codeViewEnabled: false,
        });

        // React to store-driven expiry (TTL reached or one-time-scan burned)
        sessionStore.once('expired', (id: string) => {
          if (id === record.sessionId) {
            this.sidebar.post({ type: 'SESSION_EXPIRED' });
            vscode.window.showInformationMessage('[PortDrop] Session TTL reached. Tunnel closed.');
            this.stop();
          }
        });

        // Forward scan events to sidebar in real time
        sessionStore.on('scanned', (id: string, count: number) => {
          if (id === record.sessionId) {
            this.sidebar.post({ type: 'SCAN_RECEIVED', scanCount: count });
          }
        });

        this.currentSessionId = record.sessionId;

        this.state = {
          active:    true,
          publicUrl: result.publicUrl,
          qrDataUri,
          startedAt: record.startedAt,
          expiresAt: record.expiresAt,
          config:    { port, ttl, oneTimeScan: false, codeViewEnabled: false },
        };

        this.statusBar.setActive(record.expiresAt, result.publicUrl);

        // ── Notify sidebar ─────────────────────────────────────────────────
        this.sidebar.post({
          type:      'SESSION_STARTED',
          sessionId: record.sessionId,
          publicUrl: result.publicUrl,
          qrDataUri,
          expiresAt: record.expiresAt.toISOString(),
          ttl,
          port,
        });

        vscode.window.showInformationMessage(
          `[PortDrop] Session live → ${result.publicUrl}`,
          'Copy URL',
          'Open Dashboard',
        ).then((action) => {
          if (action === 'Copy URL')       this.copyUrl();
          if (action === 'Open Dashboard') this.openDashboard();
        });
      },
    );
  }

  // ── Stop ──────────────────────────────────────────────────────────────────

  async stop(): Promise<void> {
    if (!this.state.active && !this.tunnelProcess) return;

    if (this.tunnelProcess) {
      stopTunnel(this.tunnelProcess);
      this.tunnelProcess = null;
    }

    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }

    if (this.currentSessionId) {
      sessionStore.stop(this.currentSessionId);
      this.currentSessionId = null;
    }

    this.state = {
      active: false,
      publicUrl: null,
      qrDataUri: null,
      startedAt: null,
      expiresAt: null,
      config: null,
    };

    this.statusBar.setIdle();
    this.sidebar.post({ type: 'SESSION_STOPPED' });
    vscode.window.showInformationMessage('[PortDrop] Session stopped.');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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
