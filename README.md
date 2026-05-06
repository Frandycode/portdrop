<!--
  Author   : Frandy Slueue
  Alias    : CodeBreeder
  Portfolio: https://frandycode.dev
  Project  : PortDrop
-->

# PortDrop

Share a running local app with anyone in seconds — you control the window, the clock, and who gets in. No deploy, no ngrok fumbling, no lingering public URLs.

Install the VS Code extension, pick a port, pick a time limit, and hand someone a QR code. The tunnel closes itself when you're done.

---

## Install

**From the Marketplace** *(coming soon)*
Search **PortDrop** in the VS Code Extensions panel, or:

```
ext install codebreeder.portdrop
```

**From a .vsix**
Download the latest release from [GitHub Releases](https://github.com/Frandycode/portdrop/releases) and run:

```bash
code --install-extension portdrop-0.1.0.vsix
```

---

## Quick Start

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **PortDrop: Start Session**
3. Pick a running dev server port and a time window
4. Share the URL or QR code from the sidebar — the session expires automatically

---

## Architecture

```
VS Code Extension
      │
      ▼
Local Relay (port 49491)  ←─── Next.js Dashboard API
      │
      ▼
Cloudflare Tunnel  ──►  Public HTTPS URL
      │
      ▼
Viewer's browser
```

The extension starts a local HTTP relay and a Cloudflare tunnel. The Next.js dashboard handles session validation, PIN gates, viewer caps, and one-time links. No third-party accounts required.

---

## Roadmap

See [portdrop.app/roadmap](https://portdrop.app/roadmap) for what's shipped in V1 and what's coming in V2.

---

## Links

- **Dashboard** — [portdrop.app](https://portdrop.app)
- **Issues** — [github.com/Frandycode/portdrop/issues](https://github.com/Frandycode/portdrop/issues)
- **Changelog** — [packages/extension/CHANGELOG.md](packages/extension/CHANGELOG.md)

---

*Built by [Frandy Slueue](https://frandycode.dev)*
