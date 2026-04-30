<!--
  Author   : Frandy Slueue
  Alias    : CodeBreeder
  Title    : Software Engineering · DevOps Security · IT Ops
  Portfolio: https://frandycode.dev
  GitHub   : https://github.com/frandycode
  Email    : frandyslueue@gmail.com
  Location : Tulsa, OK & Dallas, TX (Central Time)
  Project  : PortDrop — project overview and build roadmap
-->

# PortDrop

> **"You control the window. You control the clock."**

A VS Code extension and browser dashboard that lets developers share a live running app — and optionally their live code — via a single QR code, with full control over access, visibility, and expiration.

---

## What It Does

One click in VS Code generates a QR code linked to your running local app. You configure exactly what the viewer sees and for how long — then kill it when you're done. No deploy. No ngrok fumbling. No lingering public URLs.

| Pillar | What it does |
|---|---|
| **Share** | QR → live app preview with TTL |
| **Debug** | QR → app preview + live read-only code view (Monaco) |
| **Collab** *(Phase 2)* | Bidirectional editing over a shared session |

---

## Monorepo Structure

```
portdrop/
├── packages/
│   ├── extension/     # VS Code extension (TypeScript)
│   ├── dashboard/     # Next.js viewer dashboard
│   ├── relay/         # WebSocket relay server (Phase 2)
│   └── api/           # FastAPI backend (Phase 2)
├── infra/             # Docker Compose + Nginx
├── scripts/           # Dev + packaging scripts
└── .github/           # CI + marketplace publish workflows
```

---

## Getting Started

> Requires Node >= 20, pnpm >= 9, Docker

```bash
# Install all dependencies
pnpm install

# Start all local services
pnpm dev
```

---

## Build Roadmap

- **Phase 0** — Monorepo foundations *(current)*
- **Phase 1** — MVP: Share (QR → live app)
- **Phase 1.5** — Polish + VS Code marketplace publish
- **Phase 2** — Debug Mode (live code view)
- **Phase 3** — PortDrop Cloud (accounts, Pro tier)
- **Phase 4** — Collab Mode

---

## Tech Stack

| Layer | Tech |
|---|---|
| Extension | TypeScript, VS Code API, React (webview) |
| Dashboard | Next.js 14, TypeScript, Tailwind CSS |
| Tunnel | Cloudflare Tunnel (`cloudflared`) |
| Relay | Node.js, WebSocket (`ws`) |
| Backend | FastAPI, PostgreSQL 16, SQLAlchemy |
| Infra | Docker, Nginx |

---

*Built by [Frandy Slueue](https://frandy.dev) · `portdrop.dev`*
