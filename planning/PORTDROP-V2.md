# PortDrop V2 — Master Reference

**Author:** Frandy Slueue (CodeBreeder)
**Status:** Planning complete — pre-development
**Strategy:** Ship V1 free as live MVP, build V2 properly in parallel

---

## What PortDrop Is

A VS Code extension that lets developers share local ports with anyone — teammates, colleagues, clients, interviewers — with full admin control over who gets in, what they can do, and when access ends. No setup required for guests. They click a link.

**Core differentiator:** Everything ngrok and cloudflared lack — identity, permissions, approval workflows, session recording, audit logs — all accessible in a single VS Code sidebar.

---

## The Problem It Solves

Sharing local dev work currently means using ngrok or cloudflared. Both require setup and registration, have no concept of access control, and offer no session management. PortDrop gives developers a native, controlled, secure sharing experience without any friction for guests.

---

## V1 → V2 Strategy

| | V1 (current) | V2 (this document) |
|---|---|---|
| Status | Built, launching free | Planning complete, building properly |
| Purpose | Live MVP, real user testing | Full product, enterprise-ready |
| Hosting | Current setup | DigitalOcean + Cloudflare + Vercel |
| Features | Basic tunnel + QR + PIN + TTL | Full permission model, multi-port, relay, AI, integrations |
| Users | Free testers, feedback providers | Free / Pro / Team / Enterprise tiers |

V1 users are notified that V2 is being built and that their feedback directly shapes it. V1 stays live until V2 is stable.

---

## Architecture Overview

```
VS Code Extension (TypeScript)
        │
        │ WebSocket — mTLS
        ▼
PortDrop Relay Server (Node.js + Fastify)
        │ enforces permissions on every message
        │ manages presence, approval queues, event broadcast
        ▼
Cloudflare Tunnel ──────────────────────► Developer's local port(s)
        │
        ▼
Guest Browser ◄──── portdrop.dev/s/[sessionId] (Next.js, Vercel)
```

---

## Permission Model

Five levels: `none` → `spectator` → `read` → `write` → `execute`

**Absolute rule:** Anonymous guests are always read-only. Write and execute require verified identity. Enforced at database trigger, application, and relay levels.

Write and execute submissions enter an admin approval queue — admin reviews before anything is applied.

---

## Tech Stack Summary

### Backend
- **Node.js + TypeScript** — relay server and API
- **Fastify** — HTTP framework
- **GraphQL Yoga** — API protocol
- **Zod** — validation (shared with frontend)
- **Prisma** — ORM
- **PostgreSQL + TimescaleDB** — primary DB + time-series audit log
- **Redis + BullMQ** — state, queues, pub/sub
- **ws + Socket.IO** — relay protocol + dashboard real-time
- **Cloudflare R2** — object storage
- **FastAPI (Python)** — AI microservice
- **DeepSeek** → **Anthropic** — LLM (dev/test → production)

### Frontend
- **Next.js App Router** — dashboard
- **Tailwind CSS v4** — styling (new conventions, `@theme` directive)
- **shadcn/ui** — base components (v4-compatible)
- **TanStack Query + Zustand** — server state + client state
- **Framer Motion + GSAP** — animations (app UI + landing page)
- **Monaco Editor** — write submission diff review
- **Geist + Geist Mono** — typography

### Extension
- **esbuild** — extension host build
- **Vite** — webview build
- **React + Tailwind + shadcn subset** — webview UI
- **ws + mTLS** — relay connection
- **node-pty + Docker** — execute sandbox
- **VS Code SecretStorage** — secrets (OS keychain)

### Infrastructure
- **DigitalOcean App Platform** — relay + AI service
- **DigitalOcean Managed PostgreSQL + Redis** — databases
- **Cloudflare** — CDN, DNS, WAF, DDoS, R2, Tunnels (always)
- **Vercel** — Next.js dashboard (always)
- **Neon** — serverless PostgreSQL (Phase 1)
- **GitHub Actions + Turborepo** — CI/CD
- **AWS** — Phase 2 migration path (no guarantees)

---

## Monorepo Structure

```
portdrop/
├── packages/
│   ├── shared/       — types, Zod schemas, message protocol (contract layer)
│   ├── relay/        — Fastify + GraphQL + ws relay server
│   ├── dashboard/    — Next.js App Router
│   ├── extension/    — VS Code extension (esbuild host + Vite webview)
│   └── ai-service/   — FastAPI Python microservice
├── infra/            — Docker, Terraform, K8s (Phase 2)
├── scripts/          — dev, seed, cert generation
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Database Summary

PostgreSQL + TimescaleDB. 10 entity groups:

| Group | Tables |
|---|---|
| Identity & Auth | `users`, `refresh_tokens`, `oauth_connections`, `extension_clients`, `api_keys` |
| Orgs & Roles | `organizations`, `org_members` |
| Billing | `subscriptions` |
| Templates | `permission_templates` |
| Sessions | `sessions`, `session_ports`, `session_allowed_commands` |
| Guests | `guests`, `guest_port_permissions` |
| Submissions | `write_submissions`, `execute_submissions` |
| Audit | `audit_events` (TimescaleDB hypertable, 7-year retention) |
| Recordings | `session_recordings` |
| Integrations | `integrations`, `notifications` |

---

## Design System Summary

**Aesthetic:** Denim / jeans — tactile, crafted, distinctive.
**Logo:** Current PortDrop logo. CodeBreeder credit on all pages.

Key design concepts:
- **Wash levels** — depth system (raw = deepest, pale = shallowest)
- **Stitching** — semantic (rough = raw/urgent, smooth = polished/professional)
- **Patches** — content cards with wear/patina based on session status
- **Pockets** — functional interactive elements (not just decorative)
- **Gold thread** — primary actions and CTAs
- **Red thread** — warnings and errors
- **Geist + Geist Mono** — typography
- **Fabric fold** — page transition (GSAP, 400ms)
- **Indigo shimmer** — skeleton loading (not gray)
- **GSAP** — landing page (ScrollTrigger, parallax, sequences)
- **Framer Motion** — app UI animations

---

## Feature Tiers

| Tier | Key unlocks |
|---|---|
| **Free** | 1 active session, read-only guests, 1hr TTL, QR + link |
| **Pro** | Unlimited sessions, all permissions, watermarking, recording, templates, integrations, custom subdomain |
| **Team** | Org management, classroom mode, ATS integrations, analytics, shared templates, breakout rooms |
| **Enterprise** | Custom domain, white-label, SSO/SAML, self-hosted relay, compliance export, SLA |

---

## Security Highlights

- **Argon2id** — password hashing
- **mTLS** — extension ↔ relay connection (client certificates)
- **JWT + refresh token rotation** — httpOnly Secure cookies
- **E2E encryption** — write submission content
- **WebAuthn / FIDO2** — passkey support
- **SAML 2.0** — enterprise SSO
- **Database trigger** — anonymous guests cannot receive write/execute permissions
- **Role trigger** — sub_admins cannot promote to system_admin
- **Row-Level Security** — all multi-tenant tables
- **Immutable audit log** — 7-year retention, append-only TimescaleDB

---

## Planning Files

| File | Contents |
|---|---|
| `01-overview.md` | Product vision, features, permission model, tier breakdown |
| `02-backend.md` | Full backend stack, security implementation, observability |
| `03-frontend.md` | Full frontend stack, routes, animations, responsive design |
| `04-extension.md` | Extension architecture (host + webview), message protocol |
| `05-infrastructure.md` | DigitalOcean, Cloudflare, Vercel, CI/CD, monitoring |
| `06-database.md` | Full schema with all tables, indexes, triggers, RLS |
| `07-design.md` | Denim design system, color tokens, motion tokens, page details |
| `08-project-structure.md` | Monorepo layout, folder conventions, naming, workflow |
| `PORTDROP-V2.md` | This file — master reference |
| `PROMPT.md` | Claude context file for starting development in the new repo |
