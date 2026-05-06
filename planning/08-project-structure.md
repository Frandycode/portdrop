# PortDrop V2 — Project Structure

---

## Monorepo Tooling

| Tool | Role |
|---|---|
| **pnpm workspaces** | Package manager and workspace linking |
| **Turborepo** | Build orchestration — caches builds, runs tasks in parallel, understands dependency graph |
| **Changesets** | Versioning and changelog management (especially for VS Code extension marketplace releases) |

Turborepo build order (enforced automatically):
```
packages/shared → packages/relay
packages/shared → packages/dashboard
packages/shared → packages/extension (webview)
```

---

## Root Level

```
portdrop/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  — lint, type-check, tests on every PR
│   │   ├── deploy-staging.yml      — deploy on merge to main
│   │   ├── deploy-production.yml   — deploy on git tag
│   │   └── publish-extension.yml  — publish .vsix to VS Code Marketplace
│   └── pull_request_template.md
├── .vscode/
│   ├── extensions.json             — recommended extensions for contributors
│   ├── settings.json               — workspace settings
│   └── launch.json                 — debug configs (extension + relay)
├── packages/
│   ├── shared/
│   ├── relay/
│   ├── dashboard/
│   ├── extension/
│   └── ai-service/
├── infra/
│   ├── docker/
│   ├── terraform/
│   └── k8s/                        — Phase 2
├── scripts/
│   ├── dev.sh                      — starts all services
│   ├── seed.sh                     — seeds local database
│   └── cert-gen.sh                 — generates dev mTLS certs
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
├── .eslintrc.js                    — shared ESLint config
├── .prettierrc
├── tsconfig.base.json              — base TypeScript config all packages extend
└── package.json
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "out/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

---

## packages/shared — The Contract Layer

Single source of truth for types, Zod schemas, and message protocols. All other packages depend on it. Nothing lives here that belongs to a specific service.

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.ts
│   │   ├── session.ts
│   │   ├── guest.ts
│   │   ├── permissions.ts
│   │   ├── organization.ts
│   │   └── index.ts
│   ├── schemas/                    — Zod schemas, validated at every boundary
│   │   ├── session.ts
│   │   ├── guest.ts
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   └── index.ts
│   ├── messages/                   — Extension ↔ webview message protocol
│   │   ├── host-to-webview.ts
│   │   ├── webview-to-host.ts
│   │   └── index.ts
│   ├── relay/                      — Relay wire protocol types
│   │   ├── events.ts
│   │   ├── commands.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── permissions.ts
│   │   ├── tiers.ts
│   │   ├── ttl.ts
│   │   └── index.ts
│   └── utils/
│       ├── ids.ts
│       ├── dates.ts
│       └── index.ts
├── package.json
└── tsconfig.json
```

**Rule:** if two packages need the same type, it lives here. If a type is internal to one package, it stays there.

---

## packages/relay

```
packages/relay/
├── src/
│   ├── index.ts                    — entry point
│   ├── app.ts                      — Fastify factory (testable)
│   ├── config.ts                   — all env vars validated with Zod at startup
│   ├── graphql/
│   │   ├── schema.ts
│   │   ├── context.ts
│   │   ├── resolvers/
│   │   │   ├── session.ts
│   │   │   ├── guest.ts
│   │   │   ├── user.ts
│   │   │   ├── organization.ts
│   │   │   ├── submission.ts
│   │   │   └── index.ts
│   │   └── subscriptions/
│   │       ├── session.ts
│   │       ├── guest.ts
│   │       └── index.ts
│   ├── relay/
│   │   ├── RelayServer.ts
│   │   ├── SessionRoom.ts
│   │   ├── ExtensionConnection.ts
│   │   ├── GuestConnection.ts
│   │   ├── PermissionGuard.ts
│   │   └── protocol/
│   │       ├── messages.ts
│   │       └── handlers.ts
│   ├── db/
│   │   └── client.ts               — Prisma singleton
│   ├── redis/
│   │   ├── client.ts
│   │   ├── session.ts
│   │   ├── presence.ts
│   │   └── pubsub.ts
│   ├── queue/
│   │   ├── client.ts               — BullMQ setup
│   │   ├── workers/
│   │   │   ├── sessionExpiry.ts
│   │   │   ├── webhookDelivery.ts
│   │   │   ├── notificationSend.ts
│   │   │   └── reportGenerate.ts
│   │   └── jobs/
│   │       └── index.ts
│   ├── auth/
│   │   ├── jwt.ts
│   │   ├── mtls.ts
│   │   ├── oauth.ts
│   │   └── guards.ts
│   ├── tunnel/
│   │   ├── cloudflare.ts
│   │   └── manager.ts
│   ├── storage/
│   │   └── r2.ts
│   ├── integrations/
│   │   ├── github.ts
│   │   ├── slack.ts
│   │   └── calendar.ts
│   ├── plugins/
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   ├── rateLimit.ts
│   │   └── telemetry.ts
│   └── routes/
│       ├── health.ts
│       ├── webhooks.ts
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── Dockerfile
├── fly.toml
├── tsconfig.json
└── package.json
```

---

## packages/dashboard

```
packages/dashboard/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                — landing /
│   │   ├── pricing/page.tsx
│   │   └── about/page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/[provider]/route.ts
│   ├── (app)/
│   │   ├── layout.tsx              — app shell (header, sidebar, footer)
│   │   ├── dashboard/page.tsx
│   │   ├── sessions/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       └── not-found.tsx
│   │   ├── templates/page.tsx
│   │   ├── integrations/page.tsx
│   │   └── settings/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── security/page.tsx
│   │       ├── billing/page.tsx
│   │       └── organization/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx              — elevated auth required
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── users/page.tsx
│   │       ├── sessions/page.tsx
│   │       ├── organizations/page.tsx
│   │       └── analytics/page.tsx
│   ├── s/
│   │   └── [sessionId]/
│   │       ├── page.tsx            — public guest entry
│   │       ├── loading.tsx
│   │       └── not-found.tsx
│   ├── api/
│   │   ├── graphql/route.ts
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts
│   │   │   └── github/route.ts
│   │   └── health/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                         — shadcn/ui (owned source)
│   ├── denim/                      — denim design system
│   │   ├── Patch.tsx
│   │   ├── Pocket.tsx
│   │   ├── Stitching.tsx
│   │   ├── WovenLabel.tsx
│   │   ├── DenimSkeleton.tsx
│   │   ├── RivetDot.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── BackToTop.tsx
│   │   ├── CommandPalette.tsx
│   │   └── MobileNav.tsx
│   ├── session/
│   │   ├── SessionCard.tsx
│   │   ├── SessionCreateWizard.tsx
│   │   ├── SessionStatusBadge.tsx
│   │   ├── PortList.tsx
│   │   ├── GuestList.tsx
│   │   ├── GuestPermissionRow.tsx
│   │   ├── WaitingRoom.tsx
│   │   ├── WriteSubmissionDiff.tsx
│   │   ├── ExecuteApproval.tsx
│   │   └── TTLCountdown.tsx
│   ├── guest/
│   │   ├── GuestJoinFlow.tsx
│   │   ├── GuestIdentityVerify.tsx
│   │   ├── GuestSessionView.tsx
│   │   ├── GuestPermissionDisplay.tsx
│   │   └── PinGate.tsx
│   ├── admin/
│   │   ├── UserTable.tsx
│   │   ├── SessionTable.tsx
│   │   ├── OrgTable.tsx
│   │   ├── MetricCard.tsx
│   │   └── AnalyticsChart.tsx
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── PricingCard.tsx
│   │   └── CodeBreederBadge.tsx
│   └── shared/
│       ├── Icon.tsx                — icon abstraction (swap library here only)
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       └── QRDisplay.tsx
├── hooks/
│   ├── useSession.ts
│   ├── useGuests.ts
│   ├── usePermissions.ts
│   ├── useSocket.ts
│   ├── useBackToTop.ts
│   ├── useFooterFade.ts
│   └── useCommandPalette.ts
├── lib/
│   ├── graphql/
│   │   ├── client.ts
│   │   ├── queries/
│   │   └── mutations/
│   ├── socket.ts
│   ├── auth.ts
│   └── utils.ts
├── stores/
│   ├── sessionStore.ts
│   ├── uiStore.ts
│   └── notificationStore.ts
├── styles/
│   ├── denim.css
│   ├── stitching.css
│   ├── animations.css
│   └── patches.css
├── public/
│   ├── logo/
│   ├── illustrations/              — empty state SVGs
│   └── icons/
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## packages/extension

```
packages/extension/
├── src/
│   ├── extension.ts                — activation entry point
│   ├── config.ts
│   ├── core/
│   │   ├── portDetector.ts
│   │   ├── fileWatcher.ts
│   │   ├── statusBar.ts
│   │   ├── qrGenerator.ts
│   │   └── sessionManager.ts
│   ├── relay/
│   │   ├── RelayClient.ts
│   │   ├── reconnect.ts
│   │   └── messageHandler.ts
│   ├── tunnel/
│   │   ├── cloudflare.ts
│   │   └── installer.ts
│   ├── sandbox/
│   │   ├── executor.ts
│   │   ├── dockerRunner.ts
│   │   └── allowlist.ts
│   ├── auth/
│   │   ├── tokenManager.ts
│   │   └── certManager.ts
│   ├── commands/
│   │   ├── startSession.ts
│   │   ├── stopSession.ts
│   │   ├── copyUrl.ts
│   │   ├── revokeGuest.ts
│   │   └── index.ts
│   ├── providers/
│   │   ├── PortTreeProvider.ts
│   │   └── SessionTreeProvider.ts
│   ├── store/
│   │   ├── sessionStore.ts         — plain TypeScript, no React
│   │   └── types.ts
│   └── webview/
│       ├── SidebarProvider.ts      — webview host (extension host side)
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   ├── ui/
│       │   ├── denim/
│       │   ├── SessionPanel.tsx
│       │   ├── GuestList.tsx
│       │   ├── PermissionBadge.tsx
│       │   ├── ApprovalQueue.tsx
│       │   ├── TTLClock.tsx
│       │   ├── PortSelector.tsx
│       │   ├── QRDisplay.tsx
│       │   ├── FlashButton.tsx
│       │   └── CodeBreederBadge.tsx
│       ├── hooks/
│       │   ├── useVSCodeMessage.ts
│       │   └── useSessionState.ts
│       └── store/
│           └── webviewStore.ts
├── assets/
│   └── logo/
├── .vscodeignore
├── esbuild.js
├── vite.config.ts
├── tsconfig.json
├── tsconfig.webview.json
└── package.json
```

---

## packages/ai-service

```
packages/ai-service/
├── app/
│   ├── main.py
│   ├── config.py                   — pydantic-settings, env validation
│   ├── routes/
│   │   ├── review.py
│   │   ├── summarize.py
│   │   └── suggest.py
│   ├── services/
│   │   ├── deepseek.py
│   │   ├── anthropic.py
│   │   └── llm.py                  — unified interface, switches by env
│   ├── models/
│   │   ├── review.py
│   │   └── session.py
│   └── middleware/
│       ├── auth.py
│       └── rate_limit.py
├── Dockerfile
├── fly.toml
├── requirements.txt
└── pyproject.toml
```

---

## infra/

```
infra/
├── docker/
│   ├── docker-compose.yml          — full local dev stack
│   ├── docker-compose.override.yml
│   └── Dockerfile.*
├── terraform/
│   ├── modules/
│   │   ├── digitalocean/
│   │   │   ├── app-platform/
│   │   │   ├── database/
│   │   │   └── redis/
│   │   └── cloudflare/
│   │       ├── dns/
│   │       └── r2/
│   └── environments/
│       ├── staging/
│       └── production/
└── k8s/                            — Phase 2
    └── helm/portdrop/
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `SessionCard.tsx` |
| Hooks | camelCase + `use` prefix | `useSession.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Constants | camelCase filename, UPPER_SNAKE values | `permissions.ts` → `MAX_GUESTS` |
| Directories | kebab-case | `ai-service/` |
| Next.js routes | Convention | `page.tsx`, `route.ts`, `layout.tsx` |

---

## Import Aliases

No `../../` chains anywhere. Configured in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*":       ["./src/*"],
      "@shared/*": ["../shared/src/*"],
      "@relay/*":  ["../relay/src/*"]
    }
  }
}
```

---

## The config.ts Pattern

Every package has a `config.ts` that validates all environment variables with Zod at startup. Missing required variable = immediate crash with a clear error, not a silent runtime failure later.

```typescript
// Example: packages/relay/src/config.ts
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL:   z.string().url(),
  REDIS_URL:      z.string().url(),
  JWT_SECRET:     z.string().min(32),
  R2_BUCKET:      z.string(),
  LLM_PROVIDER:   z.enum(['deepseek', 'anthropic']),
})

export const config = schema.parse(process.env)
```

---

## Developer Workflow

```bash
# Start everything
pnpm dev

# Runs in parallel via Turborepo:
# relay       — Fastify + WebSocket relay (port 3001)
# dashboard   — Next.js dev server (port 3000)
# ai-service  — FastAPI with uvicorn --reload (port 8000)
# docker      — PostgreSQL + Redis + TimescaleDB

# Extension (separate — requires VS Code)
pnpm --filter extension dev
# Then F5 in VS Code → Extension Development Host

# Type check all packages
pnpm type-check

# Run all tests
pnpm test

# Build all packages
pnpm build
```

---

## Package Summary

| Package | Primary tech | Output |
|---|---|---|
| `shared` | TypeScript | Types, schemas, protocol definitions |
| `relay` | Fastify + Prisma + ws | Docker image → DigitalOcean App Platform |
| `dashboard` | Next.js App Router | Vercel deployment |
| `extension` | esbuild + Vite | `.vsix` → VS Code Marketplace |
| `ai-service` | FastAPI (Python) | Docker image → DigitalOcean App Platform |
