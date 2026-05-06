# PortDrop V2 — Product Overview

**Author:** Frandy Slueue (CodeBreeder)
**Status:** Planning — pre-development
**Version:** 2.0

---

## What PortDrop Solves

Developers sharing local work with teammates, colleagues, clients, or interviewers currently rely on tools like ngrok or cloudflared. Those tools require setup, registration, and have no concept of access control, permissions, or session management. PortDrop solves this with a VS Code-native experience where the developer keeps full admin control over everything — who gets in, what they can do, and when it ends.

**Core differentiator:** No setup required for guests. They click a link. The admin controls everything from inside VS Code, one click away.

---

## Target Users

- Individual developers sharing work during interviews, pair programming, or client demos
- Teams doing collaborative code review or live debugging sessions
- Educators and bootcamp instructors running live coding sessions
- Engineering organizations that need auditable, permission-controlled developer access sharing

---

## Session Model

A **session** is the central concept. It is not just a tunnel — it is a workspace that contains:
- One or more exposed local ports (multi-port channeling)
- A guest roster with individual permission levels
- A permission matrix (per-guest, per-port)
- An event log (audit trail)
- A lifecycle (TTL, one-time scan, manual stop)
- Optional recording

---

## Permission Levels

| Level | Description |
|---|---|
| None | No access |
| Spectator | Can view but is invisible to other guests and admin |
| Read | Can view the running app / files |
| Write | Can submit code changes for admin approval |
| Execute | Can submit commands for admin approval |

**System rule:** Anonymous guests are permanently read-only. Write and execute permissions require verified identity. Enforced at database, application, and relay levels.

---

## Guest Identity States

| State | How |
|---|---|
| Anonymous | No name, auto-assigned color handle (Guest-Teal) |
| Named | Guest provides display name on join |
| Verified | Authenticated via OAuth (GitHub, Google, Microsoft, GitLab) |

Admin configures which states are allowed per session. Name requirement applies to all guests in a session. Identity requirements are per-session, configurable before link generation.

---

## Access Control Flow

1. Admin configures session (ports, TTL, permissions, identity requirements, waiting room)
2. Link/QR generated
3. Guest opens link → sees identity requirements → completes them
4. If waiting room enabled: guest waits for admin approval
5. Admin approves → guest enters with assigned permission level
6. Admin can upgrade, downgrade, or revoke any guest at any time
7. Write/execute submissions enter an approval queue — admin reviews diff/command before applying

---

## Approval Workflow (Write & Execute)

Mirrors GitHub pull request review:
- Guest submits change or command
- Admin sees it in VS Code sidebar as a pending item
- AI service gives a first-pass review (flags issues, security concerns)
- Admin accepts or rejects with optional note
- Accepted write = applied to file, optionally staged in Git
- Accepted execute = runs in sandboxed environment, output streams back

---

## Feature Set by Tier

### Free
- 1 active session at a time
- Read-only guests
- 1 hour max TTL
- Basic QR + link sharing
- Named guests only

### Pro
- Unlimited sessions
- All permission levels (read/write/execute)
- Watermarking on file views
- Session recording
- Permission templates
- Integrations (GitHub, Slack, Calendar)
- Audit log export
- Custom session subdomain

### Team
- Organization management
- Role-based member permissions (system_admin, sub_admin, member)
- Classroom mode
- Org-wide analytics dashboard
- ATS integrations (Greenhouse, Lever)
- Shared permission templates
- Breakout rooms

### Enterprise
- Custom domain
- White-label session pages
- SSO / SAML 2.0
- Self-hosted relay option (Helm chart / Docker Compose)
- Compliance export (SOC 2 ready)
- SLA
- Dedicated support

---

## Key Features Beyond Basic Tunneling

- **Waiting room** — admin approves each guest before entry
- **Watermarking** — file views embed guest name (deters leaking)
- **Breakout rooms** — sub-sessions from a main session
- **Session handoff** — transfer admin control to another participant
- **Magic link per guest** — same link, one use per recipient
- **IP allowlisting** — restrict by IP range
- **Geo-restriction** — restrict by country
- **Time-locked sessions** — active only during defined hours
- **Interview mode** — time-boxed, structured challenge, anti-cheat signals, report export
- **Classroom mode** — instructor + students, hand-raise for write access, replay
- **Session recording + replay** — full timeline of what happened
- **AI pre-review** — write submissions flagged before admin sees them
- **Real-time presence** — who is in the session, what are they doing
- **Command palette** — keyboard-driven admin controls
- **CI/CD API** — create sessions programmatically from GitHub Actions
- **Webhook API** — fire external events on session lifecycle events
- **Calendar-linked sessions** — auto-start/stop tied to meeting time
- **Session templates** — save and reuse permission configs
- **Port labeling** — name exposed ports (Frontend, API, DB Admin)
- **Developer score** — opt-in shareable badge for community/retention

---

## What V1 Does (Current State)

V1 is a working MVP that covers:
- VS Code extension with Cloudflare tunnel
- Port detection and QR code generation
- Session creation with TTL, one-time scan, PIN gate
- Basic read-only guest access via dashboard
- Session landing page at `/s/[sessionId]`

V1 will be launched free as a live testbed while V2 is built properly.
