# PortDrop V2 — Backend Stack

---

## Runtime & Language

**Node.js + TypeScript** — primary backend runtime for the relay server and API.

Chosen over Python as the primary runtime because:
- Matches the extension and dashboard language (shared types across the monorepo)
- Native event-loop model is ideal for high-concurrency WebSocket connections
- Ecosystem is deeply integrated with the rest of the stack

**Python (FastAPI)** — isolated AI microservice only. Never the primary backend.

---

## API Layer

| Tool | Role |
|---|---|
| **Fastify** | HTTP server framework — faster than Express, schema-first, TypeScript native |
| **GraphQL Yoga** | GraphQL server — subscriptions via WebSocket, works natively with Fastify |
| **Zod** | Input validation — all inputs validated at every boundary, types inferred |

GraphQL is the right choice here because:
- Per-guest, per-port permission matrix maps cleanly to field-level resolvers
- Field-level authorization is native to the resolver model
- Real-time subscriptions (presence, notifications) are first-class GraphQL features

### GraphQL Security (required)
- Query depth limiting
- Query complexity scoring
- Persisted queries in production (reject arbitrary query strings)
- Field-level authorization on every resolver

---

## Database

| Tool | Role |
|---|---|
| **PostgreSQL** | Primary relational database |
| **TimescaleDB** | PostgreSQL extension for time-series (audit logs, analytics, recordings) |
| **Prisma** | Type-safe ORM — schema migrations, auto-generated types |
| **Neon** | Managed serverless PostgreSQL (Phase 1) — database branching per PR |

TimescaleDB handles `audit_events` as a hypertable partitioned by `occurred_at`. Retention policy: 7 years.

---

## Caching, State & Queues

| Tool | Role |
|---|---|
| **Redis** | Live session state, guest presence, pub/sub, rate limiting, TTL enforcement |
| **Upstash** | Managed serverless Redis (Phase 1) |
| **BullMQ** | Redis-backed job queue |

BullMQ job types:
- `sessionExpiry` — fires when TTL reaches zero
- `webhookDelivery` — delivers webhooks with retry logic
- `notificationSend` — dispatches VS Code + in-app notifications
- `reportGenerate` — builds session report PDFs after session ends

Redis pub/sub enables horizontal scaling: relay instances broadcast events to each other so guests on instance A receive messages from admin on instance B.

---

## Real-time Layer

| Tool | Role |
|---|---|
| **ws** | Raw WebSocket library — relay protocol between extension ↔ relay ↔ guests |
| **Socket.IO** | Dashboard real-time — presence, notifications, admin sidebar updates |

`ws` is used for the performance-critical relay path. Socket.IO is used for the dashboard where developer experience matters more than raw throughput.

---

## Transport Architecture

```
VS Code Extension
      │ WebSocket (mTLS, ws library)
      ▼
PortDrop Relay Server  ← enforces permissions on every message
      │ HTTP proxy / WebSocket bridge
      ▼
Cloudflare Tunnel
      │
      ▼
Developer's local port(s)
```

**Hybrid transport:** Cloudflare Tunnel handles punching through firewalls and providing stable HTTPS URLs. The PortDrop relay handles the control plane: identity, permissions, presence, approval queues, event broadcasting.

Guests never reach Cloudflare directly. All traffic routes through the relay, which enforces permissions on every message before proxying.

---

## Object Storage

**Cloudflare R2** — S3-compatible, zero egress fees, Cloudflare CDN integrated.

Stores:
- Session recordings (JSONL event streams)
- Write submission diffs > 100KB
- Execute submission output (when recording enabled)
- Session report PDFs
- User/org avatar uploads

---

## AI Microservice

**FastAPI (Python)** — internal service only, never publicly routed.

| Environment | LLM Provider |
|---|---|
| Development / Testing | DeepSeek (cost-effective) |
| Production | Anthropic (Claude) |

Unified interface in `services/llm.py` switches provider based on `LLM_PROVIDER` env var. No code changes needed when switching.

Services:
- `review` — pre-review write submissions before admin sees them
- `summarize` — generate session summary at session end
- `suggest` — recommend permission level based on guest identity/history

---

## Security Implementation

### Authentication
- **Argon2id** — password hashing (PHC winner, not bcrypt)
- **JWT** — short-lived access tokens (15 min), httpOnly Secure cookies only
- **Refresh token rotation** — token family tracking, automatic revocation on reuse
- **OAuth 2.0 / OIDC** — GitHub, Google, GitLab, Microsoft
- **SAML 2.0** — enterprise SSO (Okta, Azure AD)
- **WebAuthn / FIDO2** — passkey support for admin accounts
- **TOTP** — MFA fallback

### Transport Security
- **mTLS** — mutual TLS between VS Code extension and relay server
  - Extension generates client certificate on first install
  - Stored in VS Code SecretStorage (OS keychain)
  - Relay rejects connections without valid client cert
- **TLS 1.3 only** in production
- **E2E encryption** — write submission content encrypted client-side, relay routes ciphertext only

### Application Security
- **Helmet.js** — full HTTP security header suite
- **Strict CSP** — no `unsafe-inline`, no `unsafe-eval`
- **CORS** — allowlist only
- **Rate limiting** — Redis sliding window at IP, user, and session levels
- Stricter limits on auth endpoints
- **Input sanitization** — Zod at every boundary
- **Prepared statements** — Prisma enforces this, no concatenated SQL

### Database Security
- **Row-Level Security** — PostgreSQL RLS on all multi-tenant tables
- **Trigger enforcement** — anonymous guests cannot receive write/execute permissions at the DB level
- **Role trigger** — sub_admins cannot promote anyone to system_admin at the DB level
- **Immutable audit log** — append-only TimescaleDB table with row-level security preventing updates/deletes

### Secrets
- **HashiCorp Vault** (Phase 2) — dynamic secrets, automatic rotation
- GitHub Actions secrets (Phase 1)
- Never `.env` files in production

---

## Observability

| Tool | Role |
|---|---|
| **OpenTelemetry** | Distributed tracing across relay, AI service, dashboard |
| **Prometheus** | Metrics (connection counts, queue depths, latency P99) |
| **Grafana** | Metrics dashboards and log querying |
| **Loki** | Log aggregation (structured JSON from all services) |
| **Sentry** | Error tracking + performance monitoring |

### Key alerts
- Relay WebSocket connection count drops unexpectedly
- Write/execute queue depth exceeds threshold
- Session creation failure rate > 1%
- Database connection pool exhaustion
- Redis memory > 80%

---

## Summary Table

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| API framework | Fastify |
| API protocol | GraphQL Yoga + REST (webhooks/health) |
| Validation | Zod |
| ORM | Prisma |
| Primary DB | PostgreSQL + TimescaleDB |
| Managed DB | Neon (Phase 1) → AWS RDS Multi-AZ (Phase 2) |
| Cache / State / Queue | Redis + BullMQ |
| Managed Redis | Upstash (Phase 1) → AWS ElastiCache (Phase 2) |
| WebSocket relay | ws |
| Dashboard real-time | Socket.IO |
| Object storage | Cloudflare R2 |
| AI microservice | FastAPI (Python) |
| LLM (dev/test) | DeepSeek |
| LLM (production) | Anthropic (Claude) |
| Secrets | GitHub Actions → HashiCorp Vault |
| Observability | OpenTelemetry + Prometheus + Grafana + Loki + Sentry |
