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
  pin: string | undefined;
}

export class SessionManager {
  private state: SessionState = {
    active: false,
    publicUrl: null,
    qrDataUri: null,
    startedAt: null,
    expiresAt: null,
    config: null,
    pin: undefined,
  };

  private tunnelProcess: ChildProcess | null  = null;
  private ttlTimer: NodeJS.Timeout | null     = null;
  private currentSessionId: string | null     = null;
  private expiryListener: ((id: string) => void) | null          = null;
  private scanListener:   ((id: string, count: number, at: Date) => void) | null = null;
  private stoppingIntentionally = false;

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

    // ── Re-push session state whenever the webview becomes visible ────────────
    // Handles: opening sidebar after a session started, and returning to it
    // after navigating to another activity bar panel.
    sidebar.onViewReady(() => {
      if (!this.state.active || !this.currentSessionId) return;
      sidebar.post({
        type:        'SESSION_STARTED',
        sessionId:   this.currentSessionId,
        publicUrl:   this.state.publicUrl!,
        qrDataUri:   this.state.qrDataUri!,
        expiresAt:   this.state.expiresAt!.toISOString(),
        ttl:         this.state.config!.ttl,
        port:        this.state.config!.port,
        pin:         this.state.pin,
        oneTimeScan: this.state.config!.oneTimeScan,
      });
    });
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  async start(port: number): Promise<void> {
    this.stoppingIntentionally = false;

    if (this.state.active) {
      vscode.window.showWarningMessage('[PortDrop] A session is already active. Stop it first.');
      return;
    }

    // ── Pick TTL ────────────────────────────────────────────────────────────
    const ttlPick = await vscode.window.showQuickPick(
      [
        { label: '$(clock) 15 minutes', ttl: '15m' as TTLOption | 'custom' },
        { label: '$(clock) 1 hour',     ttl: '1h'  as TTLOption | 'custom' },
        { label: '$(clock) 4 hours',    ttl: '4h'  as TTLOption | 'custom' },
        { label: '$(edit) Custom...',   ttl: 'custom' as TTLOption | 'custom' },
      ],
      { title: 'PortDrop — How long should this session last?' },
    );
    if (!ttlPick) return;

    let ttl: TTLOption;
    let customMs: number | undefined;

    if (ttlPick.ttl === 'custom') {
      const input = await vscode.window.showInputBox({
        title: 'PortDrop — Custom TTL',
        prompt: 'Enter duration (e.g. 30m, 2h, 90m)',
        placeHolder: '30m',
        validateInput: (v) => {
          if (/^\d+[mh]$/.test(v)) return null;
          return 'Format: number + m or h (e.g. 30m, 2h)';
        },
      });
      if (!input) return;

      const trimmed = input.trim();
      const num = parseInt(trimmed);
      const mins = trimmed.endsWith('h') ? num * 60 : num;
      customMs = mins * 60 * 1000;
      ttl = '1h'; // placeholder, customMs overrides
      vscode.window.showInformationMessage(`[PortDrop] Custom session: ${trimmed}`);
    } else {
      ttl = ttlPick.ttl as TTLOption;
    }

    // ── One-time scan ───────────────────────────────────────────────────────
    const otsPick = await vscode.window.showQuickPick(
      [
        { label: '$(globe)    Multi-use link — anyone with the URL can open it', oneTimeScan: false },
        { label: '$(flame)    One-time link — burns after the first open',       oneTimeScan: true  },
      ],
      { title: 'PortDrop — How many times can this link be opened?' },
    );
    if (!otsPick) return;
    const oneTimeScan = otsPick.oneTimeScan;

    // ── Optional PIN ────────────────────────────────────────────────────────
    const pinPick = await vscode.window.showQuickPick(
      [
        { label: '$(globe) No PIN — open access',     pin: false },
        { label: '$(lock)  PIN protection — 4 digits', pin: true  },
      ],
      { title: 'PortDrop — Require a PIN to view this session?' },
    );
    if (!pinPick) return;

    let pin: string | undefined;
    if (pinPick.pin) {
      const pinInput = await vscode.window.showInputBox({
        title:         'PortDrop — Set PIN',
        prompt:        'Enter a 4-digit PIN. Share this with whoever you want to let in.',
        placeHolder:   '0000',
        password:      true,
        validateInput: (v) => /^\d{4}$/.test(v) ? null : 'PIN must be exactly 4 digits (0–9)',
      });
      if (!pinInput) return;
      pin = pinInput;
    }

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

        // Handle unexpected tunnel drop — ignore close events triggered by our own stop()
        result.events.on('close', (code) => {
          if (this.stoppingIntentionally) return;
          vscode.window.showWarningMessage(
            `[PortDrop] Tunnel closed unexpectedly (code ${code}). Session ended.`,
          );
          this.stop();
        });

        // Register with the session store — store owns TTL scheduling
        const record = sessionStore.create({
          publicUrl:       result.publicUrl,
          qrDataUri:       '',
          port,
          ttl,
          customMs,
          oneTimeScan,
          codeViewEnabled: false,
          pin,
        });


        // Generate QR — points to relay redirect which logs scan then redirects to app
        const qrDataUri  = await generateQRDataUri(result.publicUrl);
        record.qrDataUri = qrDataUri;
        // React to store-driven expiry (TTL reached or one-time-scan burned)
        this.expiryListener = (id: string) => {
          if (id !== record.sessionId) return;
          sessionStore.off('expired', this.expiryListener!);
          this.expiryListener = null;
          this.sidebar.post({ type: 'SESSION_EXPIRED' });
          vscode.window.showInformationMessage('[PortDrop] Session TTL reached. Tunnel closed.');
          this.stop();
        };
        sessionStore.on('expired', this.expiryListener);

        // Forward scan events to sidebar and status bar in real time
        this.scanListener = (id: string, count: number, at: Date) => {
          if (id !== record.sessionId) return;
          this.sidebar.post({ type: 'SCAN_RECEIVED', scanCount: count, at: at.toISOString() });
          this.statusBar.setScanCount(count);
        };
        sessionStore.on('scanned', this.scanListener);

        this.currentSessionId = record.sessionId;

        this.state = {
          active:    true,
          publicUrl: result.publicUrl,
          qrDataUri,
          startedAt: record.startedAt,
          expiresAt: record.expiresAt,
          config:    { port, ttl, oneTimeScan, codeViewEnabled: false },
          pin,
        };

        this.statusBar.setActive(record.expiresAt, result.publicUrl);

        // ── Notify sidebar ─────────────────────────────────────────────────
        this.sidebar.post({
          type:        'SESSION_STARTED',
          sessionId:   record.sessionId,
          publicUrl:   result.publicUrl,
          qrDataUri,
          expiresAt:   record.expiresAt.toISOString(),
          ttl,
          port,
          pin,
          oneTimeScan,
        });

        const pinNotice = pin         ? `  ·  PIN: ${pin}` : '';
        const otsNotice = oneTimeScan ? '  ·  ⚡ one-time link' : '';
        vscode.window.showInformationMessage(
          `[PortDrop] Session live → ${result.publicUrl}${otsNotice}${pinNotice}`,
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

    this.stoppingIntentionally = true;
    if (this.tunnelProcess) {
      stopTunnel(this.tunnelProcess);
      this.tunnelProcess = null;
    }
    // Do NOT reset stoppingIntentionally here — the 'close' event fires async
    // after the process actually dies, so the flag must stay true until then.
    // It is reset at the top of start() before the next session registers its handler.

    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }

    if (this.expiryListener) {
      sessionStore.off('expired', this.expiryListener);
      this.expiryListener = null;
    }

    if (this.scanListener) {
      sessionStore.off('scanned', this.scanListener);
      this.scanListener = null;
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
