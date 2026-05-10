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
import { getRelayPort }            from './relay/server';
import { generateQRDataUri } from './qrGenerator';
import { sessionStore } from './store/sessionStore';
import { TTLOption, SYSTEM_MAX_USERS } from './store/types';
import { SidebarProvider } from './webview/SidebarProvider';
import { track } from './analytics';

const DASHBOARD_URL = 'https://portdrop.app';

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
  maxUsers: number | undefined;
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
    maxUsers: undefined,
  };

  private tunnelProcess: ChildProcess | null       = null;
  private relayTunnelProcess: ChildProcess | null  = null;
  private ttlTimer: NodeJS.Timeout | null     = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private currentSessionId: string | null     = null;
  private expiryListener:  ((id: string) => void) | null          = null;
  private scanListener:    ((id: string, count: number, at: Date) => void) | null = null;
  private updateListener:  ((id: string, update: { expiresAt?: Date; maxUsers?: number | null }) => void) | null = null;
  private stoppingIntentionally = false;
  private relayError: string | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly statusBar: StatusBarManager,
    private readonly sidebar: SidebarProvider,
  ) {
    // ── Handle messages sent from the sidebar React UI ───────────────────────
    sidebar.onMessage((msg) => {
      switch (msg.type) {
        case 'REQUEST_STOP':           this.stop();          break;
        case 'REQUEST_COPY_URL':       this.copyUrl();       break;
        case 'REQUEST_OPEN_DASHBOARD': this.openDashboard(); break;
        case 'REQUEST_ADJUST_TTL':
          if (this.currentSessionId) {
            sessionStore.adjustTTL(this.currentSessionId, msg.deltaMs);
            const rec = sessionStore.get(this.currentSessionId);
            if (rec) {
              fetch(`${DASHBOARD_URL}/api/sessions/${this.currentSessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expiresAt: rec.expiresAt.toISOString() }),
              }).catch(() => {});
            }
          }
          break;
        case 'REQUEST_UPDATE_USERS':
          if (this.currentSessionId) {
            const prevRec = sessionStore.get(this.currentSessionId);
            sessionStore.updateMaxUsers(this.currentSessionId, msg.maxUsers);
            this.state.maxUsers = msg.maxUsers;
            fetch(`${DASHBOARD_URL}/api/sessions/${this.currentSessionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ maxUsers: msg.maxUsers ?? null }),
            }).catch(() => {});
            // Warn if SA reduces cap below current viewer count
            if (prevRec && msg.maxUsers !== undefined && prevRec.scanCount > msg.maxUsers) {
              vscode.window.showWarningMessage(
                `[PortDrop] ${prevRec.scanCount} viewer${prevRec.scanCount !== 1 ? 's' : ''} are already in — new cap of ${msg.maxUsers} won't remove them. Open the access log to reset viewer count.`,
              );
            }
          }
          break;
        case 'REQUEST_RESET_VIEWERS':
          if (this.currentSessionId) {
            const rec = sessionStore.get(this.currentSessionId);
            if (rec) {
              rec.scanCount = 0;
              fetch(`${DASHBOARD_URL}/api/sessions/${this.currentSessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scanCount: 0 }),
              }).catch(() => {});
              this.sidebar.post({ type: 'VIEWERS_RESET' });
              this.statusBar.setScanCount(0);
            }
          }
          break;
      }
    });

    // ── Re-push session state whenever the webview becomes visible ────────────
    // Handles: opening sidebar after a session started, and returning to it
    // after navigating to another activity bar panel.
    sidebar.onViewReady(() => {
      if (this.relayError) {
        sidebar.post({ type: 'RELAY_ERROR', message: this.relayError });
        return;
      }
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
        maxUsers:    this.state.maxUsers,
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
    const defaultTTL = vscode.workspace.getConfiguration('portdrop').get<string>('defaultTTL', '1h');
    const ttlItems: { label: string; ttl: TTLOption | 'custom' }[] = [
      { label: '$(clock) 15 minutes', ttl: '15m' },
      { label: '$(clock) 1 hour',     ttl: '1h'  },
      { label: '$(clock) 4 hours',    ttl: '4h'  },
      { label: '$(edit) Custom...',   ttl: 'custom' },
    ];
    const ttlPick = await vscode.window.showQuickPick(
      [
        ...ttlItems.filter(i => i.ttl === defaultTTL),
        ...ttlItems.filter(i => i.ttl !== defaultTTL),
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

    // ── Max viewers (multi-use only) ─────────────────────────────────────────
    let maxUsers: number | undefined;
    if (!oneTimeScan) {
      const maxPick = await vscode.window.showQuickPick(
        [
          { label: `$(infinity) Unlimited`,                                      value: undefined as number | undefined },
          { label: `$(person)   2 viewers max`,                                  value: 2 },
          { label: `$(people)   5 viewers max`,                                  value: 5 },
          { label: `$(people)   ${SYSTEM_MAX_USERS} viewers max  (system cap)`,  value: SYSTEM_MAX_USERS },
          { label: `$(edit)     Custom (1–${SYSTEM_MAX_USERS})…`,                value: -1 },
        ],
        { title: 'PortDrop — How many viewers can access this session?' },
      );
      if (!maxPick) return;

      if (maxPick.value === -1) {
        const input = await vscode.window.showInputBox({
          title:         'PortDrop — Max viewers',
          prompt:        `Enter a number between 1 and ${SYSTEM_MAX_USERS}`,
          placeHolder:   '3',
          validateInput: (v) => {
            const n = parseInt(v, 10);
            if (isNaN(n) || n < 1 || n > SYSTEM_MAX_USERS) {
              return `Must be a whole number between 1 and ${SYSTEM_MAX_USERS}`;
            }
            return null;
          },
        });
        if (!input) return;
        maxUsers = parseInt(input, 10);
      } else {
        maxUsers = maxPick.value;
      }
    }

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

    // ── Code View opt-in ────────────────────────────────────────────────────
    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length;
    let codeViewEnabled = false;
    let allowlist: string[] | null = null;
    if (hasWorkspace) {
      const cvPick = await vscode.window.showQuickPick(
        [
          { label: '$(code)  Include code view — viewers can browse your files read-only', value: true  },
          { label: '$(globe) App preview only — no code access',                           value: false },
        ],
        { title: 'PortDrop — Share code alongside the app?' },
      );
      if (!cvPick) return;
      codeViewEnabled = cvPick.value;

      // ── Code View scope ───────────────────────────────────────────────────
      if (codeViewEnabled) {
        const scopePick = await vscode.window.showQuickPick(
          [
            { label: '$(folder-opened) Full workspace — viewers see every non-blocked file', value: 'all'    },
            { label: '$(checklist)      Pick specific files — only these are exposed',       value: 'pick'   },
          ],
          { title: 'PortDrop — How much of the workspace should viewers see?' },
        );
        if (!scopePick) return;

        if (scopePick.value === 'pick') {
          const picked = await this.pickAllowlistFiles();
          if (picked === undefined) return; // cancelled
          if (picked.length === 0) {
            vscode.window.showWarningMessage('[PortDrop] No files selected — code view will show an empty tree.');
          }
          allowlist = picked;
        }
      }
    }

    // ── Resolve binary ───────────────────────────────────────────────────────
    let binaryPath: string;
    try {
      binaryPath = await resolveCloudflared(this.context);
    } catch (err: unknown) {
      vscode.window.showErrorMessage(`[PortDrop] ${(err as Error).message}`);
      return;
    }

    // ── Spin up tunnel(s) ────────────────────────────────────────────────────
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

        // Resolve workspace root and user blocklist for Code View
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
        const blocklist     = vscode.workspace.getConfiguration('portdrop').get<string[]>('blocklist', []);

        // If code view is enabled, also tunnel the relay so Vercel can reach it
        let relayUrl: string | null = null;
        if (codeViewEnabled) {
          try {
            const relayResult = await startTunnel(binaryPath, getRelayPort());
            this.relayTunnelProcess = relayResult.process;
            relayUrl = relayResult.publicUrl;
          } catch (err) {
            console.error('[PortDrop] Failed to tunnel relay port:', err);
            vscode.window.showWarningMessage('[PortDrop] Could not open relay tunnel — code view will be unavailable.');
          }
        }

        // Register with the session store — store owns TTL scheduling
        const record = sessionStore.create({
          publicUrl: result.publicUrl, // raw tunnel URL — stored for the iframe
          qrDataUri: '',
          port,
          ttl,
          customMs,
          oneTimeScan,
          codeViewEnabled,
          pin,
          maxUsers,
          workspaceRoot: codeViewEnabled ? workspaceRoot : null,
          blocklist,
          allowlist,
        });

        // Session URL routes through the live dashboard — this is what gets shared.
        // The raw tunnel URL is stored in Redis by the dashboard and never exposed.
        const sessionUrl = `${DASHBOARD_URL}/s/${record.sessionId}`;

        // QR encodes the session URL, not the raw tunnel
        const qrDataUri  = await generateQRDataUri(sessionUrl);

        // Register session with the live dashboard so it can be reached by anyone
        try {
          await fetch(`${DASHBOARD_URL}/api/sessions/register`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId:       record.sessionId,
              publicUrl:       result.publicUrl,
              relayUrl,
              expiresAt:       record.expiresAt.toISOString(),
              pinHash:         record.pinHash   ?? null,
              oneTimeScan:     record.oneTimeScan,
              maxUsers:        record.maxUsers   ?? null,
              codeViewEnabled: record.codeViewEnabled,
              allowlist:       record.allowlist,
            }),
          });
        } catch (err) {
          console.error('[PortDrop] Failed to register session with dashboard:', err);
          vscode.window.showWarningMessage('[PortDrop] Could not reach portdrop.app — session may not be shareable remotely.');
        }
        record.qrDataUri = qrDataUri;

        // React to store-driven expiry (TTL reached or one-time-scan burned)
        this.expiryListener = (id: string) => {
          if (id !== record.sessionId) return;
          sessionStore.off('expired', this.expiryListener!);
          this.expiryListener = null;
          track('session_expired');
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

        // Forward admin updates (TTL / viewer cap) to sidebar and status bar
        this.updateListener = (id: string, update: { expiresAt?: Date; maxUsers?: number | null }) => {
          if (id !== record.sessionId) return;
          if (update.expiresAt) {
            this.state.expiresAt = update.expiresAt;
            this.statusBar.setActive(update.expiresAt, this.state.publicUrl!);
          }
          if (update.maxUsers !== undefined) {
            this.state.maxUsers = update.maxUsers === null ? undefined : update.maxUsers;
          }
          this.sidebar.post({
            type:      'SESSION_UPDATED',
            expiresAt: update.expiresAt?.toISOString(),
            maxUsers:  update.maxUsers,
          });
        };
        sessionStore.on('updated', this.updateListener);

        // Poll the dashboard for scan count changes every 15s.
        // Viewers hit portdrop.app/s/[id] → Redis increments scanCount.
        // The extension has no direct notification, so we poll peek.
        let lastSyncedScanCount = record.scanCount; // 0 on session create
        this.syncInterval = setInterval(async () => {
          if (!this.currentSessionId) return;
          try {
            const res = await fetch(
              `${DASHBOARD_URL}/api/sessions/${this.currentSessionId}/peek`,
              { signal: AbortSignal.timeout(5_000) },
            );
            if (!res.ok) return;
            const data = await res.json() as { scanCount: number; expiresAt: string; maxUsers: number | null };
            if (data.scanCount > lastSyncedScanCount) {
              for (let i = lastSyncedScanCount + 1; i <= data.scanCount; i++) {
                const at = new Date().toISOString();
                this.sidebar.post({ type: 'SCAN_RECEIVED', scanCount: i, at });
                this.statusBar.setScanCount(i);
                // Keep local store in sync so cap-check in REQUEST_UPDATE_USERS is accurate
                const localRec = sessionStore.get(this.currentSessionId!);
                if (localRec) localRec.scanCount = data.scanCount;
              }
              lastSyncedScanCount = data.scanCount;
            }
          } catch { /* network hiccup — keep going */ }
        }, 15_000);

        this.currentSessionId = record.sessionId;

        this.state = {
          active:    true,
          publicUrl: sessionUrl, // session URL is what the user copies / scans / opens
          qrDataUri,
          startedAt: record.startedAt,
          expiresAt: record.expiresAt,
          config:    { port, ttl, oneTimeScan, codeViewEnabled },
          pin,
          maxUsers:  record.maxUsers,
        };

        this.statusBar.setActive(record.expiresAt, sessionUrl);

        // ── Notify sidebar ─────────────────────────────────────────────────
        this.sidebar.post({
          type:        'SESSION_STARTED',
          sessionId:   record.sessionId,
          publicUrl:   sessionUrl,
          qrDataUri,
          expiresAt:   record.expiresAt.toISOString(),
          ttl,
          port,
          pin,
          oneTimeScan,
          maxUsers:    record.maxUsers,
        });

        track('session_started', {
          ttl:           customMs ? 'custom' : ttl,
          has_pin:       !!pin,
          one_time_scan: oneTimeScan,
          max_users_set: maxUsers !== undefined,
        });

        const pinNotice = pin         ? `  ·  PIN: ${pin}` : '';
        const otsNotice = oneTimeScan ? '  ·  ⚡ one-time link' : '';
        vscode.window.showInformationMessage(
          `[PortDrop] Session live → ${sessionUrl}${otsNotice}${pinNotice}`,
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
    if (this.relayTunnelProcess) {
      stopTunnel(this.relayTunnelProcess);
      this.relayTunnelProcess = null;
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

    if (this.updateListener) {
      sessionStore.off('updated', this.updateListener);
      this.updateListener = null;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.currentSessionId) {
      const stoppedId = this.currentSessionId;
      sessionStore.stop(stoppedId);
      this.currentSessionId = null;
      // Mark stopped in Redis so viewers get a clear "session ended" state
      fetch(`${DASHBOARD_URL}/api/sessions/register?sessionId=${stoppedId}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    this.state = {
      active: false,
      publicUrl: null,
      qrDataUri: null,
      startedAt: null,
      expiresAt: null,
      config: null,
      pin: undefined,
      maxUsers: undefined,
    };

    track('session_stopped');
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

  notifyRelayError(message: string): void {
    this.relayError = message;
    this.sidebar.post({ type: 'RELAY_ERROR', message });
  }

  /**
   * Workspace file picker for the Code View allowlist.
   * Returns the picked workspace-relative paths (forward-slash, sorted),
   * or undefined if the user cancelled.
   */
  private async pickAllowlistFiles(): Promise<string[] | undefined> {
    const root = vscode.workspace.workspaceFolders?.[0];
    if (!root) return [];

    const userBlocklist = vscode.workspace.getConfiguration('portdrop').get<string[]>('blocklist', []);
    const excludeGlobs = [
      '**/node_modules/**', '**/.git/**', '**/dist/**', '**/.next/**',
      '**/out/**', '**/build/**', '**/coverage/**', '**/.turbo/**',
      '**/.vscode/**', '**/__pycache__/**', '**/.venv/**', '**/venv/**',
      '**/.env*', '**/*.{key,pem,secret,p12,pfx}',
      ...userBlocklist.map((p) => `**/${p}/**`),
    ].join(',');

    const uris = await vscode.workspace.findFiles('**/*', `{${excludeGlobs}}`, 5000);
    const items = uris
      .map((uri) => vscode.workspace.asRelativePath(uri, false).split('\\').join('/'))
      .sort()
      .map((label) => ({ label, picked: false }));

    if (items.length === 0) {
      vscode.window.showWarningMessage('[PortDrop] No files matched — workspace may be empty after the blocklist.');
      return [];
    }

    const picked = await vscode.window.showQuickPick(items, {
      title:        'PortDrop — Pick files to expose',
      placeHolder:  `Select files (${items.length} available). Click each to include.`,
      canPickMany:  true,
      matchOnDetail: true,
    });

    if (picked === undefined) return undefined;
    return picked.map((p) => p.label).sort();
  }
}
