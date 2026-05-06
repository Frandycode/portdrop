# Changelog

All notable changes to PortDrop are documented here.

## [0.1.0] — 2026-05-06

Initial release.

### Added

- **Zero-config tunneling** — Cloudflare tunnel spins up automatically with no accounts, API keys, or config files required
- **QR code sharing** — every session generates a scannable QR code in the VS Code sidebar
- **TTL-controlled sessions** — choose 15 min, 1 h, 4 h, or a custom duration; the tunnel closes itself at expiry
- **Auto port detection** — scans for running dev servers (Vite, Next.js, Express, FastAPI, Django) and presents them as a Quick Pick
- **PIN gate** — optional 4-digit access code to restrict who can enter a session
- **One-time link** — link burns after the first open; useful for single-use sharing
- **Viewer cap** — limit concurrent connections to 2, 5, or a custom number
- **Live admin controls** — stop, extend TTL, or copy the session URL without leaving VS Code
- **Live countdown** — status bar and sidebar both tick down the remaining session time in real time
- **Session URL + QR** — sidebar shows the public URL alongside a scannable QR; one click copies or opens in browser
- **Activity bar panel** — dedicated PortDrop panel with session state, scan history, and config info
- **First-run onboarding** — info notification on first activation guides new users to the Command Palette
- **Default settings** — configure `portdrop.defaultPort` and `portdrop.defaultTTL` in VS Code settings
