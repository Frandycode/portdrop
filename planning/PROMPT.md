# PortDrop V2 — Claude Context File

> Paste this file's contents at the start of any new Claude session when working on the PortDrop V2 repository. It gives Claude full context without re-explaining decisions already made.

---

## Who I Am

I am Frandy Slueue, alias CodeBreeder. Software Engineer, DevOps, IT Ops. Based in Tulsa, OK & Dallas, TX (Central Time). This is my project — I am the sole decision-maker and primary developer.

**My working style:**
- I want direct, expert-level recommendations. Don't water things down.
- I prefer planning fully before coding. Don't skip ahead.
- When I say "continue," keep going from where we left off.
- Don't add features, comments, or abstractions beyond what is asked.
- No trailing summaries unless I ask for them.
- No emojis unless I ask.

---

## The Project

**PortDrop** — a VS Code extension that lets developers share local ports with guests (teammates, colleagues, clients, interviewers) with full admin control over identity, permissions, approval workflows, and session lifecycle.

**The core experience:**
1. Developer opens VS Code, activates PortDrop
2. Selects a local port (or multiple)
3. Configures session: TTL, permissions, identity requirements, waiting room
4. Gets a public URL + QR code
5. Shares with guests
6. Guests join, admin controls everything from the VS Code sidebar
7. Write/execute submissions enter an approval queue
8. Session expires by TTL or admin stops it

**Key differentiator:** No setup for guests. They click a link. The admin has full control, one click away. This is what ngrok and cloudflared don't offer.

---

## V1 → V2 Strategy

V1 is a working MVP (Cloudflare tunnel + basic session + QR + PIN + TTL). It is being launched free as a live testbed. V2 is being built from scratch, properly, in a new repository, while V1 runs and collects real user feedback.

V1 users are notified that V2 is in development and their feedback shapes it.

---

## Monorepo Structure

```
portdrop-v2/                        ← new repo, separate from V1
├── packages/
│   ├── shared/                     ← types, Zod schemas, message protocol
│   ├── relay/                      ← Fastify + GraphQL + ws relay server
│   ├── dashboard/                  ← Next.js App Router dashboard
│   ├── extension/                  ← VS Code extension
│   └── ai-service/                 ← FastAPI Python AI microservice
├── infra/
│   ├── docker/                     ← docker-compose for local dev
│   ├── terraform/                  ← IaC (Phase 2)
│   └── k8s/                        ← Helm charts (Phase 2)
├── scripts/
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

**Monorepo tools:** pnpm workspaces + Turborepo + Changesets

**Build order (Turborepo enforces):**
`shared` → `relay`, `dashboard`, `extension` (webview)

**Import aliases:**
- `@/*` → current package src
- `@shared/*` → packages/shared/src
- `@relay/*` → packages/relay/src

---

## Backend Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Fastify |
| API | GraphQL Yoga (subscriptions via WebSocket) |
| Validation | Zod (shared schemas with frontend) |
| ORM | Prisma |
| Database | PostgreSQL + TimescaleDB |
| Managed DB | Neon (Phase 1) |
| Cache / State | Redis (Upstash Phase 1) |
| Job queue | BullMQ |
| Relay protocol | ws (raw WebSocket) |
| Dashboard real-time | Socket.IO |
| Object storage | Cloudflare R2 |
| AI microservice | FastAPI (Python) |
| LLM (dev/test) | DeepSeek |
| LLM (production) | Anthropic (Claude) |

**Transport architecture:**
```
Extension ──(WebSocket, mTLS)──► Relay Server ──► Cloudflare Tunnel ──► Local port
Guest browser ◄───────────────── Relay Server (enforces permissions)
```

Cloudflare Tunnel handles transport. The PortDrop relay handles the control plane: identity, permissions, presence, approval queues, event broadcasting.

---

## Frontend Stack (Dashboard)

| Category | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + custom CSS |
| Components | shadcn/ui (v4-compatible, owned code) |
| Design system | components/denim/* |
| Server state | TanStack Query |
| Client state | Zustand |
| Real-time | Socket.IO client |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Code diff | Monaco Editor (@monaco-editor/react) |
| Charts | Recharts |
| App animations | Framer Motion (package: motion) |
| Landing animations | GSAP + ScrollTrigger |
| Theme | next-themes |
| URL state | nuqs |
| Command palette | cmdk (via shadcn Command) |
| Icons | react-icons (abstracted via Icon.tsx — swap-ready) |
| Fonts | Geist + Geist Mono (next/font) |

**Tailwind v4 note:** No `tailwind.config.js`. All configuration in CSS via `@theme {}` directive. `@import "tailwindcss"` replaces old directives. Lightning CSS bundler.

**Route groups:**
- `(marketing)` — landing, pricing (RSC, GSAP)
- `(auth)` — login, signup, OAuth callbacks
- `(app)` — authenticated user dashboard
- `(admin)` — systems admin (elevated auth)
- `s/[sessionId]` — public guest entry (no auth)

---

## Extension Stack

Two separate runtime environments:

**Extension host (Node.js):**
- Bundled with esbuild
- Connects to relay via WebSocket + mTLS (`ws` library)
- Port detection (cross-platform: `/proc/net/tcp`, `netstat`)
- File watching (chokidar)
- Execute sandbox (node-pty + Docker CLI)
- Secrets in VS Code SecretStorage (OS keychain)
- Write submission review via `vscode.diff()` (native VS Code diff editor)

**Webview (Chromium iframe):**
- Bundled with Vite
- React + Tailwind v4 + shadcn/ui subset + Framer Motion
- Zustand for state
- Communicates with host via typed `postMessage` only
- Cannot open external WebSockets directly

**Message protocol** defined in `packages/shared/src/messages/` as discriminated union types. TypeScript catches mismatches at compile time.

---

## Infrastructure

| Layer | Tool |
|---|---|
| Dashboard | Vercel (always) |
| Relay + AI service | DigitalOcean App Platform |
| PostgreSQL | DigitalOcean Managed PostgreSQL / Neon |
| Redis | DigitalOcean Managed Redis / Upstash |
| Object storage | Cloudflare R2 |
| CDN / DNS / WAF / DDoS | Cloudflare (always) |
| CI/CD | GitHub Actions |
| Monorepo builds | Turborepo |
| Containers | Docker |
| Phase 2 cloud | AWS (possible migration, no guarantees) |

---

## Database

PostgreSQL + TimescaleDB. 10 entity groups:

**Core tables:** `users`, `organizations`, `org_members`, `subscriptions`, `permission_templates`, `sessions`, `session_ports`, `session_allowed_commands`, `guests`, `guest_port_permissions`, `write_submissions`, `execute_submissions`, `audit_events` (hypertable), `session_recordings`, `integrations`, `notifications`, `refresh_tokens`, `oauth_connections`, `extension_clients`, `api_keys`

**Critical constraint:** Anonymous guests cannot receive write or execute permissions. Enforced via database trigger on `guest_port_permissions`.

**`audit_events`** is a TimescaleDB hypertable partitioned by `occurred_at`. 7-year retention policy. Append-only (RLS prevents updates/deletes).

---

## Design System

**Aesthetic:** Denim / jeans. Tactile, textured, distinctive.
**Logo:** Current PortDrop logo. CodeBreeder credit on all pages.
**Fonts:** Geist (UI) + Geist Mono (code)

**Color tokens:**
```css
@theme {
  --denim-raw:    oklch(16% 0.09 265);
  --denim-dark:   oklch(24% 0.11 265);
  --denim-mid:    oklch(34% 0.12 265);
  --denim-light:  oklch(55% 0.10 265);
  --denim-pale:   oklch(82% 0.06 265);
  --thread-gold:  oklch(72% 0.16 85);
  --thread-white: oklch(95% 0.01 265);
  --thread-red:   oklch(54% 0.20 25);
}
```

**Motion tokens:**
```css
@theme {
  --ease-soft:    cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-worn:    cubic-bezier(0.55, 0.06, 0.68, 0.19);
  --duration-quick:   120ms;
  --duration-base:    240ms;
  --duration-slow:    480ms;
  --duration-stitch:  600ms;
  --duration-fold:    400ms;
}
```

**Design concepts:**
- Wash levels = depth hierarchy
- Stitching = semantic (rough = raw/urgent, smooth = polished)
- Patches = content cards (wear reflects session status)
- Pockets = functional interactive elements
- Gold thread = primary actions
- Red thread = warnings/errors
- Fabric fold = page transition (GSAP, 400ms)
- Indigo shimmer = skeleton loading (not gray)
- BTT button = rivet style, 50px from bottom-right, appears at scrollY > 320
- Footer = fixed, fades on mobile after 30s inactivity
- Header = fixed, backdrop blur on scroll, gold thread active underline

**Component layers:**
```
components/ui/       ← shadcn/ui base
components/denim/    ← denim design system
components/[feature] ← feature components
```

---

## Security Rules (Never Violate)

1. Anonymous guests = read-only, always. No exceptions.
2. Sub-admins cannot promote anyone to system_admin.
3. Auth tokens stored in httpOnly Secure cookies only. Never localStorage.
4. All env vars validated with Zod at startup in every package.
5. No raw SQL string concatenation — Prisma enforces prepared statements.
6. mTLS required for extension ↔ relay connections.
7. Audit log is append-only. No updates, no deletes.
8. Write/execute submissions require admin approval before applying.

---

## Naming Conventions

| Thing | Convention |
|---|---|
| React components | PascalCase (`SessionCard.tsx`) |
| Hooks | camelCase + `use` prefix (`useSession.ts`) |
| Utilities | camelCase (`formatDate.ts`) |
| Directories | kebab-case |
| Constants | UPPER_SNAKE values, camelCase filename |

---

## The config.ts Pattern

Every package validates env vars with Zod at startup:
```typescript
import { z } from 'zod'
const schema = z.object({ DATABASE_URL: z.string().url(), ... })
export const config = schema.parse(process.env)
```
Missing var = crash immediately with a clear error.

---

## Detailed Planning Docs

All planning files are in `planning/` in the V1 repo (`portdrop/`):

- `01-overview.md` — product vision, features, permission model
- `02-backend.md` — backend stack, security, observability
- `03-frontend.md` — frontend stack, routes, animation scope
- `04-extension.md` — extension architecture, message protocol
- `05-infrastructure.md` — DigitalOcean, Cloudflare, CI/CD
- `06-database.md` — full schema, triggers, RLS, indexes
- `07-design.md` — denim design system, tokens, page details
- `08-project-structure.md` — full folder structure, conventions
- `PORTDROP-V2.md` — master reference summary

---

## How to Start a Session With Me

If you are a new Claude instance reading this:
- All major decisions are made. Do not re-litigate them.
- Ask what specific task to work on, then start.
- Reference the planning docs above for detail on any topic.
- When writing code: no comments unless the WHY is non-obvious, no trailing summaries, no extra abstractions.
- Match the existing code style in whatever file you're editing.
