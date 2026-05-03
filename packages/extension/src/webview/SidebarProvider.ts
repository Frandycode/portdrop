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
    .idle .logo { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .idle .logo svg { filter: drop-shadow(0 4px 12px rgba(196,133,58,0.35)); }
    .idle .logo-wordmark { font-size: 15px; font-weight: 700; color: #D4A853; letter-spacing: 3px; text-transform: uppercase; }
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
    <div class="logo">
      <!-- Double-ring logo · Old Jeans palette · dot fill fades bottom→top -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="96" height="96" fill="none">
        <defs>
          <!-- clip to inner ring so dots + plug never touch it -->
          <clipPath id="sb-inner-clip"><circle cx="60" cy="60" r="37"/></clipPath>
          <!-- vertical gradient mask: solid at bottom, transparent at top -->
          <linearGradient id="sb-dot-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#000"/>
            <stop offset="30%"  stop-color="#000"/>
            <stop offset="70%"  stop-color="#888"/>
            <stop offset="100%" stop-color="#fff"/>
          </linearGradient>
          <mask id="sb-dot-mask" maskUnits="userSpaceOnUse" x="23" y="23" width="74" height="74">
            <rect x="23" y="23" width="74" height="74" fill="url(#sb-dot-fade)"/>
          </mask>
        </defs>

        <!-- OUTER ring -->
        <circle cx="60" cy="60" r="56" stroke="#C48540" stroke-width="2"/>

        <!-- INNER ring — 10px gap from outer -->
        <circle cx="60" cy="60" r="44" fill="rgba(14,31,58,0.96)" stroke="#C48540" stroke-width="1.4"/>

        <!-- dot field inside inner ring, fading upward -->
        <g clip-path="url(#sb-inner-clip)" mask="url(#sb-dot-mask)">
          <!-- row 1 — bottom, full opacity -->
          <circle cx="40" cy="97" r="1.6" fill="#C48540" opacity="0.85"/>
          <circle cx="48" cy="99" r="1.7" fill="#D4A853" opacity="0.85"/>
          <circle cx="56" cy="100" r="1.7" fill="#C48540" opacity="0.85"/>
          <circle cx="64" cy="100" r="1.7" fill="#D4A853" opacity="0.85"/>
          <circle cx="72" cy="99" r="1.7" fill="#C48540" opacity="0.85"/>
          <circle cx="80" cy="97" r="1.6" fill="#D4A853" opacity="0.85"/>
          <!-- row 2 -->
          <circle cx="36" cy="91" r="1.5" fill="#C48540" opacity="0.75"/>
          <circle cx="44" cy="93" r="1.6" fill="#D4A853" opacity="0.80"/>
          <circle cx="52" cy="94" r="1.6" fill="#C48540" opacity="0.80"/>
          <circle cx="60" cy="94" r="1.6" fill="#D4A853" opacity="0.80"/>
          <circle cx="68" cy="94" r="1.6" fill="#C48540" opacity="0.80"/>
          <circle cx="76" cy="93" r="1.6" fill="#D4A853" opacity="0.80"/>
          <circle cx="84" cy="91" r="1.5" fill="#C48540" opacity="0.75"/>
          <!-- row 3 -->
          <circle cx="38" cy="84" r="1.4" fill="#D4A853" opacity="0.65"/>
          <circle cx="46" cy="86" r="1.5" fill="#C48540" opacity="0.70"/>
          <circle cx="54" cy="87" r="1.5" fill="#D4A853" opacity="0.70"/>
          <circle cx="62" cy="87" r="1.5" fill="#C48540" opacity="0.70"/>
          <circle cx="70" cy="87" r="1.5" fill="#D4A853" opacity="0.70"/>
          <circle cx="78" cy="86" r="1.5" fill="#C48540" opacity="0.65"/>
          <circle cx="84" cy="84" r="1.4" fill="#D4A853" opacity="0.60"/>
          <!-- row 4 -->
          <circle cx="34" cy="77" r="1.2" fill="#C48540" opacity="0.50"/>
          <circle cx="42" cy="79" r="1.3" fill="#D4A853" opacity="0.55"/>
          <circle cx="50" cy="80" r="1.4" fill="#C48540" opacity="0.58"/>
          <circle cx="58" cy="80" r="1.4" fill="#D4A853" opacity="0.55"/>
          <circle cx="66" cy="80" r="1.4" fill="#C48540" opacity="0.55"/>
          <circle cx="74" cy="79" r="1.3" fill="#D4A853" opacity="0.55"/>
          <circle cx="82" cy="77" r="1.2" fill="#C48540" opacity="0.50"/>
          <!-- row 5 -->
          <circle cx="36" cy="70" r="1.1" fill="#D4A853" opacity="0.40"/>
          <circle cx="44" cy="72" r="1.2" fill="#C48540" opacity="0.42"/>
          <circle cx="52" cy="73" r="1.2" fill="#D4A853" opacity="0.42"/>
          <circle cx="60" cy="73" r="1.2" fill="#C48540" opacity="0.42"/>
          <circle cx="68" cy="73" r="1.2" fill="#D4A853" opacity="0.40"/>
          <circle cx="76" cy="72" r="1.2" fill="#C48540" opacity="0.40"/>
          <circle cx="82" cy="70" r="1.1" fill="#D4A853" opacity="0.35"/>
          <!-- row 6 — fading out -->
          <circle cx="30" cy="63" r="1.0" fill="#C48540" opacity="0.28"/>
          <circle cx="38" cy="65" r="1.1" fill="#D4A853" opacity="0.30"/>
          <circle cx="46" cy="66" r="1.1" fill="#C48540" opacity="0.30"/>
          <circle cx="76" cy="65" r="1.1" fill="#D4A853" opacity="0.28"/>
          <circle cx="84" cy="63" r="1.0" fill="#C48540" opacity="0.25"/>
          <circle cx="90" cy="63" r="1.0" fill="#D4A853" opacity="0.22"/>
        </g>

        <!-- PLUG — centered in inner ring: span y=32→88, center y=60 = ring center ✓ -->
        <!-- top gap: 32-16=16px  bottom gap: 104-88=16px  equal on both sides     -->
        <rect x="48" y="32" width="24" height="18" rx="3"
              fill="#D4A853" fill-opacity="0.13" stroke="#D4A853" stroke-width="1.4"/>
        <!-- prongs -->
        <line x1="54" y1="50" x2="54" y2="60" stroke="#D4A853" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="66" y1="50" x2="66" y2="60" stroke="#D4A853" stroke-width="1.8" stroke-linecap="round"/>
        <!-- dashed connector -->
        <line x1="60" y1="60" x2="60" y2="66"
              stroke="#C48540" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.85"/>
        <!-- socket box -->
        <rect x="44" y="66" width="32" height="22" rx="4"
              fill="rgba(196,133,58,0.08)" stroke="#C48540" stroke-width="1.4"/>
        <!-- left port -->
        <rect x="50" y="71" width="9" height="12" rx="2" fill="#C48540" opacity="0.92"/>
        <!-- right port -->
        <rect x="61" y="71" width="9" height="12" rx="2" fill="#C48540" opacity="0.92"/>

        <!-- rivet dots on outer ring, cardinal points -->
        <circle cx="60"  cy="4"   r="2.5" fill="#C48540" opacity="0.70"/>
        <circle cx="116" cy="60"  r="2.5" fill="#C48540" opacity="0.70"/>
        <circle cx="60"  cy="116" r="2.5" fill="#C48540" opacity="0.70"/>
        <circle cx="4"   cy="60"  r="2.5" fill="#C48540" opacity="0.70"/>
      </svg>
      <span class="logo-wordmark">PortDrop</span>
    </div>
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
      <button class="primary" id="btn-copy">Copy URL</button>
      <button id="btn-dashboard">Open in Browser</button>
      <button class="danger" id="btn-stop">Stop Session</button>
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

    // ── Button feedback — flash label then restore ─────────────────────────
    function flashButton(id, feedback, duration) {
      const btn = document.getElementById(id);
      const original = btn.textContent;
      btn.textContent = feedback;
      btn.disabled = true;
      btn.style.opacity = '0.7';
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        btn.style.opacity = '1';
      }, duration || 1500);
    }

    // ── Button event listeners (inline onclick blocked by CSP) ─────────────
    document.getElementById('btn-copy').addEventListener('click', () => {
      send('REQUEST_COPY_URL');
      flashButton('btn-copy', '\u2713 Copied!', 1500);
    });
    document.getElementById('btn-dashboard').addEventListener('click', () => {
      send('REQUEST_OPEN_DASHBOARD');
      flashButton('btn-dashboard', '\u2197 Opening...', 1000);
    });
    document.getElementById('btn-stop').addEventListener('click', () => {
      send('REQUEST_STOP');
      flashButton('btn-stop', '\u23f9 Stopping...', 2000);
    });

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
