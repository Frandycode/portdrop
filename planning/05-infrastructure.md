# PortDrop V2 — Infrastructure & Deployment

---

## Philosophy: Phased Approach

**Phase 1 — Launch fast, validate product**
Managed services everywhere. Zero cluster administration. Focus entirely on features and users.

**Phase 2 — Scale and enterprise (no guarantees)**
Kubernetes and AWS enter when enterprise contracts require compliance certifications, self-hosted deployments, or multi-region relay becomes necessary.

---

## Phase 1 Stack

### DigitalOcean — Primary Cloud

| Service | What runs on it |
|---|---|
| **App Platform** | Relay server + AI microservice (Docker containers, no cluster management) |
| **Managed PostgreSQL** | Primary database (TimescaleDB extension enabled) |
| **Managed Redis** | Cache, session state, pub/sub, BullMQ queues |
| **Spaces** | Object storage fallback (S3-compatible, has egress fees unlike R2) |
| **DOKS** | DigitalOcean Kubernetes — available when Phase 2 is needed |

App Platform handles:
- WebSocket connections natively
- Auto-scaling based on CPU/memory
- Rolling deployments with health checks
- Built-in container registry

### Cloudflare — Edge Layer (Always, Regardless of Cloud)

| Service | Role |
|---|---|
| **DNS** | Authoritative, fast propagation, DDoS-aware |
| **CDN** | Caches static assets from Vercel |
| **WAF** | Web Application Firewall — blocks OWASP Top 10 before hitting servers |
| **DDoS Protection** | Automatic, always-on |
| **Bot Management** | Distinguishes real users from scrapers |
| **Rate Limiting** | Edge-level rate limits before requests reach DigitalOcean |
| **Cloudflare Access** | Zero-trust protection for internal routes (admin panel, AI service) |
| **R2** | Object storage — zero egress fees, CDN-integrated, S3-compatible |
| **Tunnels** | Cloudflare Tunnel for the hybrid transport layer |

### Vercel — Dashboard Hosting (Always)

Next.js dashboard. Zero-config, edge functions for low-latency session API responses, automatic preview deployments per PR, wildcard domains for `[user].portdrop.dev`.

No other platform matches Vercel for Next.js hosting DX.

### Neon — PostgreSQL

Serverless PostgreSQL with:
- TimescaleDB extension support
- Database branching (every PR gets its own isolated DB branch)
- Scales to zero between dev sessions
- Point-in-time recovery built in
- Automatic daily backups

### Upstash — Redis

Serverless Redis with:
- Per-request billing
- Global replicas
- HTTP and native Redis protocol
- Pub/sub supported

Zero infrastructure to manage.

---

## Phase 2 Stack (Future, AWS)

Triggered when enterprise customers require:
- Specific cloud provider (AWS)
- Compliance certifications (SOC 2 Type II, HIPAA, FedRAMP)
- Self-hosted deployment option
- Multi-region relay

| Service | Replaces |
|---|---|
| **AWS ECS Fargate** | DigitalOcean App Platform |
| **AWS RDS PostgreSQL (Multi-AZ)** | Neon |
| **AWS ElastiCache** | Upstash |
| **AWS Secrets Manager** | GitHub Actions secrets |
| **AWS ECR** | GitHub Container Registry |
| **Kubernetes (EKS)** | When self-hosted enterprise Helm chart needed |

Cloudflare and Vercel remain unchanged — they are cloud-agnostic.

Migration from DigitalOcean to AWS requires no code changes. Everything is containerized. Same Docker images, new target platform. Prisma migrations run unchanged against RDS.

---

## Domain Architecture

```
portdrop.dev               → Landing page (Vercel)
app.portdrop.dev           → Authenticated dashboard (Vercel)
relay.portdrop.dev         → Relay server (DigitalOcean App Platform)
api.portdrop.dev           → GraphQL API (same app as relay)
[user].portdrop.dev        → Pro custom subdomains (Vercel wildcard)
s.portdrop.dev/[id]        → Guest session entry (Vercel edge)
status.portdrop.dev        → Status page (BetterStack)
```

Internal (never publicly routed):
```
ai.internal                → AI microservice (DigitalOcean private network)
db.internal                → PostgreSQL
redis.internal             → Redis
```

---

## CI/CD Pipeline — GitHub Actions

### On Pull Request
```
lint + type-check
  ↓
unit tests (vitest)
  ↓
build all packages (Turborepo, parallel)
  ↓
Neon branch create (isolated DB for this PR)
  ↓
Vercel preview deploy (dashboard)
  ↓
DigitalOcean App Platform preview (relay)
  ↓
integration tests against preview environment
  ↓
security scan (npm audit, Snyk)
  ↓
Neon branch destroy on PR close
```

### On Merge to Main
```
full test suite
  ↓
build Docker images → push to ghcr.io
  ↓
Prisma migrate (staging database)
  ↓
deploy to staging (App Platform + Vercel)
  ↓
smoke tests
  ↓
Slack notification
```

### On Git Tag (Release)
```
deploy to production (App Platform + Vercel)
  ↓
Prisma migrate (production database)
  ↓
vsce package → publish to VS Code Marketplace
  ↓
GitHub Release created with changelog
  ↓
PagerDuty alert if health checks fail within 5 minutes
```

---

## Environments

| Environment | Dashboard | Relay | Database | Purpose |
|---|---|---|---|---|
| Local | localhost:3000 | localhost:3001 | Docker Compose | Development |
| Preview | Vercel (per PR) | DO App (per PR) | Neon branch | PR review |
| Staging | Vercel | DO App (staging) | Neon (staging) | Pre-release |
| Production | Vercel | DO App (prod) | Neon (prod) | Live |

---

## Local Development

Full stack via Docker Compose:

```bash
# Start everything
pnpm dev

# What runs:
# - PostgreSQL + TimescaleDB (port 5432)
# - Redis (port 6379)
# - Relay server (port 3001)
# - AI microservice (port 8000)
# - Next.js dashboard (port 3000) via Vercel dev
```

Extension development (separate):
```bash
pnpm --filter extension dev
# Then press F5 in VS Code → launches Extension Development Host
```

---

## Monitoring & Observability

| Tool | Role |
|---|---|
| **Grafana Cloud** | Prometheus metrics, Loki logs, Tempo traces (free tier then paid) |
| **Sentry** | Error tracking + performance, source maps for TypeScript |
| **Checkly** | Synthetic monitoring — real browser tests every 5 minutes against production |
| **BetterStack** | Uptime monitoring + public status page |
| **PagerDuty** | On-call routing for production incidents |
| **OpenTelemetry** | Distributed tracing standard across all services |

### Metrics to Alert On
- Relay WebSocket connection count drops unexpectedly
- Write/execute approval queue depth > 50 items
- Session creation failure rate > 1%
- Database connection pool exhaustion
- Redis memory usage > 80%
- Extension marketplace install errors spike

---

## Backup Strategy

| Data | Method | Retention |
|---|---|---|
| PostgreSQL | Neon continuous backup / automated snapshots | 30 days |
| Redis | RDB snapshots hourly + AOF logging | 7 days |
| R2 objects | Versioning enabled, lifecycle rules | Indefinite (recordings: 90 days default) |
| Audit logs | TimescaleDB append-only + S3 export monthly | 7 years |
| Terraform state | S3 with versioning + DynamoDB locking | Indefinite |

---

## Enterprise Self-Hosted (Phase 2)

Two delivery options:

**Option A — Helm Chart (Kubernetes)**
Customer provides their own EKS/GKE/DOKS cluster. `helm install portdrop portdrop/portdrop -f values.yaml` deploys the entire stack. `values.yaml` configures their database, Redis, object storage, OAuth providers, and custom domain.

**Option B — Docker Compose**
For enterprises without Kubernetes. Single `docker-compose.yml` runs relay, API, and AI service. Documented for AWS EC2, GCP Compute Engine, and bare metal.

Both options use `app.portdrop.dev` for the dashboard unless the customer has a white-label enterprise license.

---

## Phase 1 Cost Estimate

| Service | Monthly |
|---|---|
| Vercel Pro | ~$20 |
| DigitalOcean App Platform (2 apps) | ~$24–48 |
| DigitalOcean Managed PostgreSQL | ~$15 |
| DigitalOcean Managed Redis | ~$15 |
| Cloudflare Pro | ~$20 |
| Cloudflare R2 | ~$0–5 (first 10GB free) |
| Grafana Cloud | ~$0 (free tier) |
| Sentry Team | ~$26 |
| BetterStack | ~$0–24 |
| **Total** | **~$120–175/month** |

---

## Summary Table

| Layer | Phase 1 | Phase 2 |
|---|---|---|
| Dashboard | Vercel | Vercel |
| Relay + AI | DigitalOcean App Platform | AWS ECS Fargate |
| PostgreSQL | Neon | AWS RDS Multi-AZ |
| Redis | Upstash | AWS ElastiCache |
| Object storage | Cloudflare R2 | Cloudflare R2 |
| CDN / DNS / WAF | Cloudflare | Cloudflare |
| Container registry | ghcr.io | AWS ECR |
| Secrets | GitHub Actions secrets | AWS Secrets Manager |
| IaC | — | Terraform |
| Orchestration | — | Kubernetes (Helm) |
| CI/CD | GitHub Actions | GitHub Actions |
| Error tracking | Sentry | Sentry |
| Metrics / logs | Grafana Cloud | Grafana Cloud |
| Synthetic monitoring | Checkly | Checkly |
| Uptime / status | BetterStack | BetterStack |
| On-call | PagerDuty | PagerDuty |
