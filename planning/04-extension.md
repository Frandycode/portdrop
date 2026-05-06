# PortDrop V2 — VS Code Extension Stack

---

## Two Distinct Runtime Environments

The extension has two separate runtime environments that must work together:

```
┌─────────────────────────────────────────────┐
│  Extension Host (Node.js)                   │
│  • Full Node.js APIs available              │
│  • VS Code Extension API                   │
│  • WebSocket relay connection (mTLS)        │
│  • Cloudflare tunnel process management     │
│  • Port detection & file watching           │
│  • Execute sandbox (node-pty + Docker)      │
│  • Secrets storage (OS keychain)            │
│  • No React, no DOM                         │
└──────────────┬──────────────────────────────┘
               │ postMessage (type-safe message protocol)
┌──────────────▼──────────────────────────────┐
│  Webview (Chromium iframe)                  │
│  • React UI (the sidebar panel)             │
│  • Cannot open external WebSockets directly │
│  • No localStorage (use VS Code state API)  │
│  • Strict Content Security Policy           │
│  • All relay comms routed through host      │
└─────────────────────────────────────────────┘
```

**All real-time updates flow:** Relay → Extension Host → `postMessage` → Webview.

The webview never talks to the relay directly. The extension host is the bridge.

---

## Message Protocol

Defined in `packages/shared/src/messages/` — both sides use the same discriminated union types. TypeScript catches any message type mismatch at compile time.

```typescript
// host → webview
type HostToWebview =
  | { type: 'SESSION_STARTED'; payload: SessionState }
  | { type: 'GUEST_JOINED'; payload: Guest }
  | { type: 'GUEST_LEFT'; payload: { guestId: string } }
  | { type: 'WRITE_SUBMITTED'; payload: WriteSubmission }
  | { type: 'EXECUTE_SUBMITTED'; payload: ExecuteSubmission }
  | { type: 'PERMISSION_UPDATED'; payload: PermissionUpdate }
  | { type: 'SESSION_STOPPED' }

// webview → host
type WebviewToHost =
  | { type: 'START_SESSION'; payload: SessionConfig }
  | { type: 'STOP_SESSION' }
  | { type: 'APPROVE_WRITE'; payload: { submissionId: string } }
  | { type: 'REJECT_WRITE'; payload: { submissionId: string; reason?: string } }
  | { type: 'APPROVE_EXECUTE'; payload: { submissionId: string } }
  | { type: 'REJECT_EXECUTE'; payload: { submissionId: string; reason?: string } }
  | { type: 'REVOKE_GUEST'; payload: { guestId: string } }
  | { type: 'UPDATE_PERMISSION'; payload: PermissionUpdate }
  | { type: 'COPY_URL' }
```

---

## Extension Host Stack

### Build
**esbuild** — bundles the extension host. Fast, tree-shaking, outputs a single CommonJS file. Configuration in `esbuild.js` at the extension root.

### Core VS Code APIs Used

| API | Purpose |
|---|---|
| `SecretStorage` | OS keychain (Keychain/Credential Manager). Stores auth tokens, mTLS client cert, relay credentials. Never `globalState`. |
| `vscode.authentication` | Built-in OAuth flow support. GitHub auth without rolling a custom redirect. |
| `TreeDataProvider` | Ports and sessions shown in the VS Code Explorer sidebar as native tree views. |
| `vscode.diff()` | Opens write submissions as a native VS Code diff editor tab. Admin reviews exactly like a Git change. |
| `vscode.workspace.fs` | Virtual file system — serves files to read-permission guests without exposing raw paths. |
| `StatusBarItem` | Session status (active, guests connected, TTL). Clicking opens the sidebar. |
| `ExtensionContext.globalState` | Non-sensitive persistent state (session history, preferences). |
| `ExtensionContext.workspaceState` | Workspace-specific state (last port, last session config). |

### Relay Client
- `ws` package — same library as the relay server (symmetric protocol)
- Node.js `tls` module for mTLS
- On first install: generates client certificate, stores in SecretStorage, registers with relay
- Reconnection with exponential backoff + jitter
- Connection is persistent for the lifetime of the VS Code session

### Port Detection
Cross-platform implementation:
- **Linux**: reads `/proc/net/tcp` directly
- **macOS**: executes `netstat -anv`
- **Windows**: executes `netstat -ano`
- Polling every 2–3 seconds + `chokidar` watching for process changes
- Filters system ports, maps port → process name → workspace folder when possible

### File Watching
**chokidar** — the de facto standard (VS Code uses it internally). Watches the workspace, notifies file-view guests when files change.

### Execute Sandbox
Two layers of isolation:

**node-pty** — pseudo-terminal (exactly what VS Code's integrated terminal uses). Gives proper TTY behavior, color output, progress bars.

**Docker CLI** — true container isolation. Extension spawns `docker run --rm --memory 256m --cpus 0.5 [allowlisted-image] [command]`. Requires Docker to be installed. Gracefully falls back to process-level restriction with a clear warning if Docker is unavailable.

**Allowlist validation:**
- Command checked against admin-defined list before any spawn
- Argument parsing used (not string matching or regex) to prevent injection
- No shell expansion, no pipes, no redirects

### Diff Handling
- `diff` npm package generates unified diffs from write submissions
- `vscode.diff()` opens the native VS Code diff editor for admin review
- No custom React UI needed — the VS Code diff editor is purpose-built for this

### mTLS Certificate Management (`auth/certManager.ts`)
- Generates RSA-2048 client certificate on first extension activation
- Stores private key and cert in `SecretStorage`
- Registers cert fingerprint with the PortDrop relay server
- Auto-renews before expiry
- Admin can revoke specific extension installations from the dashboard

---

## Webview Stack

### Build
**Vite** — separate from the extension host build. Fast HMR during development. Outputs a self-contained bundle loaded via `webview.asWebviewUri()`.

Two builds, one `pnpm dev` command:
```
esbuild --watch → extension host (src/extension.ts → out/extension.js)
vite --watch    → webview (src/webview/main.tsx → out/webview/)
```

### UI
- **React + TypeScript**
- **Tailwind CSS v4** with VS Code theme integration

VS Code exposes CSS variables from the active theme. Map them to Tailwind tokens:
```css
@theme {
  --color-surface:  var(--vscode-editor-background);
  --color-text:     var(--vscode-editor-foreground);
  --color-border:   var(--vscode-panel-border);
  --color-brand:    oklch(62% 0.22 265);  /* PortDrop's own brand color */
}
```
This makes the sidebar respect VS Code's theme (dark, light, high contrast) automatically.

- **shadcn/ui (subset)** — Button, Badge, Avatar, Separator, Tooltip, ScrollArea, Collapsible. Heavy components excluded.
- **Zustand** — webview-scoped state. Separate from the extension host store (no shared state, only messages).
- **Framer Motion** — sidebar animations (guest joins animate in, approval queue slides, permission transitions).

### Webview Components
```
webview/components/
├── ui/                  — shadcn subset
├── denim/               — denim design system subset
├── SessionPanel.tsx     — main session control panel
├── GuestList.tsx        — live guest roster with presence
├── PermissionBadge.tsx  — per-guest permission display
├── ApprovalQueue.tsx    — pending write/execute submissions
├── TTLClock.tsx         — countdown with amber/red warning states
├── PortSelector.tsx     — multi-port selection
├── QRDisplay.tsx        — QR code with copy/share actions
├── FlashButton.tsx      — start/stop session CTA
└── CodeBreederBadge.tsx — credit badge
```

---

## VS Code Integration Points

Beyond the sidebar, the extension integrates natively with VS Code:

**Command palette** — all major actions registered as commands:
- `PortDrop: Start Session`
- `PortDrop: Stop Session`
- `PortDrop: Copy Session URL`
- `PortDrop: Open Dashboard`
- `PortDrop: Revoke Guest`
- `PortDrop: View Audit Log`

**Status bar** — session state always visible without opening the sidebar.

**Native notifications** — `vscode.window.showInformationMessage()` with action buttons:
- Guest requests entry (waiting room)
- Write submission pending
- Execute submission pending
- Session expiring in 5 minutes

**Explorer tree views:**
- `PortTreeProvider` — detected local ports
- `SessionTreeProvider` — active/recent sessions

**Source control integration** — approved write submissions optionally staged in the SCM view for normal Git commit workflow.

**Ports view compatibility** — aware of VS Code's built-in Ports panel, avoids conflicts.

**Remote development compatibility** — explicitly tested against:
- VS Code Remote SSH
- Dev Containers
- GitHub Codespaces

Port detection behavior differs in these environments (ports forward to remote host, not localhost). This is a hard requirement for enterprise adoption.

---

## Testing

| Tool | Scope |
|---|---|
| **vitest** | Unit tests for all non-VS Code-API code (port detector, session manager logic, diff generation, message protocol) |
| **@vscode/test-cli** | Integration tests inside a real VS Code instance (activation, command registration, webview communication) |
| **Testing Library** | Webview React components, with mocked `vscode.postMessage` |

---

## Summary Table

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Extension host bundler | esbuild |
| Webview bundler | Vite |
| Webview UI | React + Tailwind CSS v4 + shadcn/ui (subset) |
| Webview state | Zustand |
| Webview animations | Framer Motion |
| Message protocol | Discriminated union types (packages/shared) |
| Relay connection | ws + Node.js tls (mTLS) |
| Port detection | Cross-platform via child process + /proc/net/tcp |
| File watching | chokidar |
| Execute sandbox | node-pty + Docker CLI |
| Diff display | VS Code native diff editor (vscode.diff()) |
| Cert management | Node.js crypto + VS Code SecretStorage |
| Unit testing | vitest |
| Integration testing | @vscode/test-cli |
