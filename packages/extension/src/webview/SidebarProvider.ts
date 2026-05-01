/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — VS Code WebviewViewProvider, sidebar panel and postMessage bridge
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import { ExtensionMessage, WebviewMessage } from './messages';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly VIEW_ID = 'portdrop.sessionView';

  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  // ── VS Code calls this when the sidebar panel becomes visible ─────────────

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.buildHtml(webviewView.webview);

    // ── Webview → Extension ──────────────────────────────────────────────────
    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      this._onWebviewMessage?.(msg);
    });
  }

  // ── Extension → Webview ───────────────────────────────────────────────────

  /**
   * Sends a typed message to the React UI.
   * Safe to call even when the panel isn't visible — message is dropped silently.
   */
  post(message: ExtensionMessage): void {
    this.view?.webview.postMessage(message);
  }

  // ── Inbound message handler (set by SessionManager) ───────────────────────

  private _onWebviewMessage?: (msg: WebviewMessage) => void;

  onMessage(handler: (msg: WebviewMessage) => void): void {
    this._onWebviewMessage = handler;
  }

  // ── HTML shell ────────────────────────────────────────────────────────────

  /**
   * Builds the webview HTML. In production this would load a compiled React
   * bundle from the extension's dist folder. For now we ship an inline script
   * that renders the full sidebar UI without a separate build step, keeping
   * Phase 1 self-contained.
   *
   * Phase 1.5 (marketplace polish): replace with vite-built bundle loaded via
   * webview.asWebviewUri().
   */
  private buildHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const csp   = [
      `default-src 'none'`,
      `style-src 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `img-src data: ${webview.cspSource}`,
    ].join('; ');

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PortDrop</title>
  <style>
    :root {
      --pd-bg:      #020617;
      --pd-surface: #0f172a;
      --pd-border:  #1e293b;
      --pd-cyan:    #22d3ee;
      --pd-orange:  #c2410c;
      --pd-muted:   #64748b;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--pd-bg);
      color: #fff;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      padding: 12px;
      min-height: 100vh;
    }

    /* ── Idle state ── */
    .idle {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 32px 16px;
      text-align: center;
      color: var(--pd-muted);
    }
    .idle .logo { font-size: 22px; font-weight: 700; color: var(--pd-cyan); letter-spacing: 1px; }
    .idle code  { font-size: 11px; background: var(--pd-surface); padding: 2px 6px; border-radius: 4px; }

    /* ── Active state ── */
    .active { display: flex; flex-direction: column; gap: 12px; }
    .hidden { display: none !important; }

    /* QR */
    .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .qr-wrap img { width: 180px; height: 180px; border-radius: 8px; border: 1px solid var(--pd-border); }
    .qr-url { font-size: 10px; color: var(--pd-cyan); word-break: break-all; text-align: center; }

    /* Clock */
    .clock { text-align: center; }
    .clock .label { font-size: 10px; color: var(--pd-muted); }
    .clock .value { font-size: 20px; font-weight: 700; font-family: monospace; color: var(--pd-cyan); }
    .clock .value.warning { color: var(--pd-orange); }

    /* Scan badge */
    .scans { text-align: center; font-size: 11px; color: var(--pd-muted); }
    .scans span { color: #fff; font-weight: 600; }

    /* Actions */
    .actions { display: flex; flex-direction: column; gap: 6px; }
    button {
      width: 100%;
      padding: 7px 12px;
      border-radius: 6px;
      border: 1px solid var(--pd-border);
      background: var(--pd-surface);
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    button:hover   { background: #1e293b; }
    button.primary { background: var(--pd-cyan); color: #000; border-color: var(--pd-cyan); font-weight: 600; }
    button.primary:hover { background: #06b6d4; }
    button.danger  { border-color: var(--pd-orange); color: var(--pd-orange); }
    button.danger:hover  { background: #1f1007; }

    /* Expired */
    .expired { text-align: center; color: var(--pd-orange); padding: 24px 0; }
  </style>
</head>
<body>

  <!-- Idle -->
  <div id="view-idle" class="idle">
    <div class="logo">PortDrop</div>
    <p>No active session.</p>
    <p>Run <code>PortDrop: Start Session</code><br/>from the Command Palette.</p>
  </div>

  <!-- Active -->
  <div id="view-active" class="active hidden">
    <div class="qr-wrap">
      <img id="qr-img" src="" alt="QR code" />
      <div id="qr-url" class="qr-url"></div>
    </div>
    <div class="clock">
      <div class="label">Expires in</div>
      <div id="clock-value" class="value">--:--</div>
    </div>
    <div class="scans">Scans: <span id="scan-count">0</span></div>
    <div class="actions">
      <button class="primary" onclick="send('REQUEST_COPY_URL')">Copy URL</button>
      <button onclick="send('REQUEST_OPEN_DASHBOARD')">Open in Browser</button>
      <button class="danger" onclick="send('REQUEST_STOP')">Stop Session</button>
    </div>
  </div>

  <!-- Expired -->
  <div id="view-expired" class="expired hidden">
    <p>⏱ Session expired.</p>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let expiresAt = null;
    let ticker    = null;

    // ── Send message to extension ──────────────────────────────────────────
    function send(type) {
      vscode.postMessage({ type });
    }

    // ── Show a named view, hide the others ─────────────────────────────────
    function showView(name) {
      ['idle', 'active', 'expired'].forEach(v => {
        document.getElementById('view-' + v).classList.toggle('hidden', v !== name);
      });
    }

    // ── Countdown tick ─────────────────────────────────────────────────────
    function tick() {
      if (!expiresAt) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        document.getElementById('clock-value').textContent = '00:00';
        document.getElementById('clock-value').classList.add('warning');
        return;
      }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      const val = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
      document.getElementById('clock-value').textContent = val;

      // Warn when under 2 minutes
      document.getElementById('clock-value').classList.toggle('warning', remaining < 120_000);
    }

    // ── Handle messages from extension ─────────────────────────────────────
    window.addEventListener('message', ({ data }) => {
      switch (data.type) {

        case 'SESSION_STARTED':
          document.getElementById('qr-img').src = data.qrDataUri;
          document.getElementById('qr-url').textContent = data.publicUrl;
          document.getElementById('scan-count').textContent = '0';
          expiresAt = new Date(data.expiresAt).getTime();
          if (ticker) clearInterval(ticker);
          ticker = setInterval(tick, 1000);
          tick();
          showView('active');
          break;

        case 'SESSION_STOPPED':
          if (ticker) { clearInterval(ticker); ticker = null; }
          expiresAt = null;
          showView('idle');
          break;

        case 'SESSION_EXPIRED':
          if (ticker) { clearInterval(ticker); ticker = null; }
          expiresAt = null;
          showView('expired');
          break;

        case 'SCAN_RECEIVED':
          document.getElementById('scan-count').textContent = String(data.scanCount);
          break;
      }
    });
  </script>
</body>
</html>`;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
