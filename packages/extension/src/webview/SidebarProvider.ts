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

    // Fire ready handler now, and again each time the panel becomes visible
    // so SessionManager can re-push current state after a hide/show cycle.
    this._onViewReady?.();
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) this._onViewReady?.();
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
  private _onViewReady?: () => void;

  onMessage(handler: (msg: WebviewMessage) => void): void {
    this._onWebviewMessage = handler;
  }

  onViewReady(handler: () => void): void {
    this._onViewReady = handler;
  }

  // ── HTML shell ────────────────────────────────────────────────────────────

  private buildHtml(webview: vscode.Webview): string {
    const nonce     = getNonce();
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'index.js'),
    );
    const csp = [
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
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#020617;min-height:100vh;padding:12px}
    @keyframes pd-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    .pd-skeleton{display:flex;flex-direction:column;align-items:center;gap:14px;padding:32px 16px}
    .pd-skel-block{border-radius:6px;background:linear-gradient(90deg,#0f172a 25%,#1a2744 50%,#0f172a 75%);background-size:800px 100%;animation:pd-shimmer 1.6s ease-in-out infinite}
    .pd-skel-logo{width:80px;height:80px;border-radius:50%}
    .pd-skel-title{width:90px;height:12px;margin-top:4px}
    .pd-skel-text{width:140px;height:10px}
    .pd-skel-text.short{width:100px}
    .pd-relay-error{display:flex;flex-direction:column;align-items:center;gap:10px;padding:32px 16px;text-align:center}
    .pd-relay-error p{color:#ef4444;font-size:13px;line-height:1.5}
    .pd-relay-error-detail{font-size:10px;color:#94a3b8;font-family:monospace;word-break:break-all;max-width:200px}
    .pd-relay-error-hint{font-size:10px;color:#475569}
  </style>
</head>
<body>
  <div id="root">
    <div class="pd-skeleton">
      <div class="pd-skel-block pd-skel-logo"></div>
      <div class="pd-skel-block pd-skel-title"></div>
      <div class="pd-skel-block pd-skel-text"></div>
      <div class="pd-skel-block pd-skel-text short"></div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
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
