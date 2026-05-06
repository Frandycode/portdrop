# PortDrop V2 — Database Schema

---

## Overview

**Primary database:** PostgreSQL + TimescaleDB extension
**ORM:** Prisma
**Managed service:** Neon (Phase 1), AWS RDS Multi-AZ (Phase 2)

TimescaleDB handles `audit_events` as a partitioned hypertable. All other tables are standard PostgreSQL relations.

---

## System-Level Constraint

> **Anonymous guests are permanently read-only.**
> Write and execute permissions cannot be granted to any guest with `identity_type = 'anonymous'`.
> Enforced at three levels: database trigger, application layer (Zod schema), relay server message validation.

---

## Schema — Entity Groups

---

### 1. Identity & Auth

```sql
users
  id                uuid          PK
  email             varchar(255)  UNIQUE NOT NULL
  display_name      varchar(100)  NOT NULL
  avatar_url        text
  password_hash     text          -- null if OAuth-only
  email_verified    boolean       DEFAULT false
  mfa_enabled       boolean       DEFAULT false
  mfa_secret        text          -- encrypted at rest
  created_at        timestamptz   NOT NULL
  updated_at        timestamptz   NOT NULL
  last_login_at     timestamptz
  deleted_at        timestamptz   -- soft delete

refresh_tokens
  id                uuid          PK
  user_id           uuid          FK → users.id
  token_hash        text          UNIQUE NOT NULL  -- never store plaintext
  family            uuid          NOT NULL         -- rotation family tracking
  is_revoked        boolean       DEFAULT false
  expires_at        timestamptz   NOT NULL
  ip_address        inet
  user_agent        text
  created_at        timestamptz   NOT NULL

oauth_connections
  id                    uuid    PK
  user_id               uuid    FK → users.id
  provider              enum    ('github','google','gitlab','microsoft')
  provider_user_id      text    NOT NULL
  provider_username     text
  provider_email        text
  provider_avatar_url   text
  access_token          text    -- encrypted
  refresh_token         text    -- encrypted, nullable
  token_expires_at      timestamptz
  created_at            timestamptz NOT NULL
  updated_at            timestamptz NOT NULL
  UNIQUE(provider, provider_user_id)

extension_clients               -- one row per VS Code installation
  id                  uuid      PK
  user_id             uuid      FK → users.id
  cert_fingerprint    text      UNIQUE NOT NULL  -- mTLS client cert fingerprint
  cert_expires_at     timestamptz NOT NULL
  device_label        varchar(100)  -- "MacBook Pro — VS Code"
  platform            text          -- linux / darwin / win32
  vs_code_version     text
  extension_version   text
  last_seen_at        timestamptz
  revoked_at          timestamptz   -- admin can revoke specific installs
  created_at          timestamptz NOT NULL

api_keys
  id              uuid          PK
  owner_type      enum          ('user','organization')
  owner_id        uuid          NOT NULL
  name            varchar(100)  NOT NULL
  key_hash        text          UNIQUE NOT NULL
  key_prefix      varchar(16)   NOT NULL    -- shown in UI: "pd_live_abc..."
  scopes          text[]        -- ['create_session','manage_guests','read_analytics']
  last_used_at    timestamptz
  expires_at      timestamptz
  revoked_at      timestamptz
  created_at      timestamptz   NOT NULL
```

---

### 2. Organizations & Roles

```sql
organizations
  id            uuid          PK
  name          varchar(100)  NOT NULL
  slug          varchar(100)  UNIQUE NOT NULL  -- for [slug].portdrop.dev
  avatar_url    text
  created_by    uuid          FK → users.id
  created_at    timestamptz   NOT NULL
  updated_at    timestamptz   NOT NULL
  deleted_at    timestamptz

org_members
  id                    uuid    PK
  org_id                uuid    FK → organizations.id
  user_id               uuid    FK → users.id
  role                  enum    ('system_admin','sub_admin','member')
  -- granular capability overrides
  can_create_sessions   boolean DEFAULT true
  can_invite_guests     boolean DEFAULT true
  can_send_invites      boolean DEFAULT true
  can_manage_templates  boolean DEFAULT false
  -- system_admin is the only role that can promote to system_admin
  -- sub_admin cannot modify system_admin rows — enforced via trigger
  invited_by            uuid    FK → users.id
  joined_at             timestamptz
  created_at            timestamptz NOT NULL
  updated_at            timestamptz NOT NULL
  UNIQUE(org_id, user_id)
```

**Role hierarchy trigger:** Any attempt to `INSERT` or `UPDATE` `role = 'system_admin'` by an actor whose own `role` is not `system_admin` raises an exception at the database level.

---

### 3. Subscriptions & Billing

```sql
subscriptions
  id                       uuid       PK
  owner_type               enum       ('user','organization')
  owner_id                 uuid       NOT NULL
  tier                     enum       ('free','pro','team','enterprise')
  status                   enum       ('trialing','active','past_due','canceled')
  stripe_customer_id       text
  stripe_subscription_id   text
  current_period_start     timestamptz
  current_period_end       timestamptz
  cancel_at_period_end     boolean    DEFAULT false
  created_at               timestamptz NOT NULL
  updated_at               timestamptz NOT NULL
```

---

### 4. Permission Templates

```sql
permission_templates
  id            uuid          PK
  owner_type    enum          ('user','organization')
  owner_id      uuid          NOT NULL
  name          varchar(100)  NOT NULL
  description   text
  is_default    boolean       DEFAULT false
  config        jsonb         NOT NULL
  created_at    timestamptz   NOT NULL
  updated_at    timestamptz   NOT NULL
```

**config shape:**
```json
{
  "requireName": true,
  "requireIdentity": false,
  "identityProviders": ["github", "google"],
  "defaultPortPermission": "read",
  "allowGuestInvite": false,
  "requireWaitingRoom": true,
  "maxGuests": 10,
  "allowedCommands": [
    { "command": "npm", "argsPattern": null },
    { "command": "python", "argsPattern": "^main\\.py$" }
  ]
}
```

---

### 5. Sessions — The Central Entity

```sql
sessions
  id                    uuid          PK
  public_id             varchar(16)   UNIQUE NOT NULL  -- used in /s/[public_id]
  owner_type            enum          ('user','organization')
  owner_id              uuid          NOT NULL
  created_by            uuid          FK → users.id
  template_id           uuid          FK → permission_templates.id  -- nullable
  name                  varchar(100)
  status                enum          ('pending','active','expired','stopped','error')
  -- access control
  require_waiting_room  boolean       DEFAULT false
  require_name          boolean       DEFAULT false
  require_identity      boolean       DEFAULT false
  identity_providers    text[]        -- ['github','google']
  allow_guest_invite    boolean       DEFAULT false
  max_guests            integer       -- null = unlimited
  pin_hash              text
  -- ttl
  ttl_seconds           integer       -- null = no TTL
  one_time_scan         boolean       DEFAULT false
  -- relay
  public_url            text
  relay_session_id      text
  -- recording
  recording_enabled     boolean       DEFAULT false
  -- timestamps
  started_at            timestamptz
  expires_at            timestamptz
  stopped_at            timestamptz
  created_at            timestamptz   NOT NULL
  updated_at            timestamptz   NOT NULL

session_ports
  id              uuid        PK
  session_id      uuid        FK → sessions.id
  port            integer     NOT NULL
  label           varchar(50)           -- "Frontend", "API", "DB Admin"
  protocol        enum        ('http','https','tcp') DEFAULT 'http'
  is_primary      boolean     DEFAULT false
  tunnel_url      text
  created_at      timestamptz NOT NULL
  UNIQUE(session_id, port)

session_allowed_commands
  id              uuid        PK
  session_id      uuid        FK → sessions.id
  command         text        NOT NULL  -- e.g. 'npm', 'python'
  args_pattern    text        -- regex for allowed args, null = any
  description     varchar(100)
  created_at      timestamptz NOT NULL
```

---

### 6. Guests & Permissions

```sql
guests
  id                        uuid        PK
  session_id                uuid        FK → sessions.id
  user_id                   uuid        FK → users.id   -- null if not a PortDrop user
  identity_type             enum        ('anonymous','named','verified') NOT NULL
  display_name              varchar(100)
  color                     varchar(30)     -- 'teal', 'amber' — auto-assigned
  verified_provider         enum        ('github','google','gitlab','microsoft')
  verified_provider_id      text
  verified_provider_username text
  is_spectator              boolean     DEFAULT false
  is_in_waiting_room        boolean     DEFAULT false
  is_approved               boolean     DEFAULT false
  approved_by               uuid        FK → users.id
  ip_address                inet
  user_agent                text
  is_active                 boolean     DEFAULT true
  joined_at                 timestamptz
  left_at                   timestamptz
  revoked_at                timestamptz
  revoked_by                uuid        FK → users.id
  created_at                timestamptz NOT NULL

guest_port_permissions
  id                uuid        PK
  guest_id          uuid        FK → guests.id
  session_port_id   uuid        FK → session_ports.id
  permission        enum        ('none','read','spectator','write','execute') NOT NULL
  granted_by        uuid        FK → users.id
  granted_at        timestamptz NOT NULL
  revoked_at        timestamptz
  UNIQUE(guest_id, session_port_id)
```

**Enforcement trigger on `guest_port_permissions`:**
```sql
CREATE OR REPLACE FUNCTION enforce_anonymous_readonly()
RETURNS trigger AS $$
BEGIN
  IF NEW.permission IN ('write', 'execute') THEN
    IF (SELECT identity_type FROM guests WHERE id = NEW.guest_id) = 'anonymous' THEN
      RAISE EXCEPTION
        'Anonymous guests cannot receive write or execute permissions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_anonymous_permission
BEFORE INSERT OR UPDATE ON guest_port_permissions
FOR EACH ROW EXECUTE FUNCTION enforce_anonymous_readonly();
```

---

### 7. Write & Execute Submissions

```sql
write_submissions
  id              uuid        PK
  session_id      uuid        FK → sessions.id
  session_port_id uuid        FK → session_ports.id
  guest_id        uuid        FK → guests.id
  status          enum        ('pending','approved','rejected','superseded')
  file_path       text        NOT NULL
  diff_content    text        -- stored here if ≤ 100KB
  diff_size_bytes integer     NOT NULL
  diff_r2_key     text        -- R2 path if > 100KB
  original_hash   text        NOT NULL  -- file hash before change
  ai_review       jsonb       -- pre-review result from AI service
  reviewed_by     uuid        FK → users.id
  review_note     text
  reviewed_at     timestamptz
  created_at      timestamptz NOT NULL
  updated_at      timestamptz NOT NULL

execute_submissions
  id              uuid        PK
  session_id      uuid        FK → sessions.id
  session_port_id uuid        FK → session_ports.id
  guest_id        uuid        FK → guests.id
  status          enum        ('pending','approved','rejected','running',
                               'completed','failed','timed_out')
  command         text        NOT NULL
  args            text[]      DEFAULT '{}'
  working_dir     text
  exit_code       integer
  timeout_seconds integer     DEFAULT 30
  output_r2_key   text        -- populated only if recording enabled
  reviewed_by     uuid        FK → users.id
  review_note     text
  reviewed_at     timestamptz
  started_at      timestamptz
  completed_at    timestamptz
  created_at      timestamptz NOT NULL
```

---

### 8. Audit Log — TimescaleDB Hypertable

```sql
audit_events
  id              uuid        NOT NULL DEFAULT gen_random_uuid()
  occurred_at     timestamptz NOT NULL                  -- partition key
  session_id      uuid
  org_id          uuid
  actor_type      enum        ('user','guest','system','api_key')
  actor_id        uuid
  actor_display   text        -- denormalized name at time of event
  event_type      text        NOT NULL
  entity_type     text
  entity_id       uuid
  payload         jsonb
  ip_address      inet
  PRIMARY KEY (id, occurred_at)

-- Create hypertable (run after CREATE TABLE)
SELECT create_hypertable('audit_events', 'occurred_at',
  chunk_time_interval => INTERVAL '1 month');

-- 7-year retention policy
SELECT add_retention_policy('audit_events', INTERVAL '7 years');
```

**Event type examples:**
`session.started`, `session.stopped`, `session.expired`,
`guest.joined`, `guest.left`, `guest.revoked`, `guest.waiting_room_approved`,
`permission.granted`, `permission.revoked`,
`write.submitted`, `write.approved`, `write.rejected`,
`execute.submitted`, `execute.approved`, `execute.completed`,
`org.member_added`, `org.role_changed`

---

### 9. Recordings, Integrations & Notifications

```sql
session_recordings
  id                uuid        PK
  session_id        uuid        FK → sessions.id UNIQUE
  status            enum        ('recording','processing','ready','failed')
  r2_key            text        -- path in R2
  duration_seconds  integer
  file_size_bytes   bigint
  started_at        timestamptz
  completed_at      timestamptz
  created_at        timestamptz NOT NULL

integrations
  id                uuid        PK
  owner_type        enum        ('user','organization')
  owner_id          uuid        NOT NULL
  provider          enum        ('github','slack','google_calendar','linear','jira')
  status            enum        ('active','error','revoked')
  config            jsonb       NOT NULL  -- webhook URLs, repo refs, channel IDs
  access_token      text        -- encrypted
  refresh_token     text        -- encrypted, nullable
  token_expires_at  timestamptz
  created_at        timestamptz NOT NULL
  updated_at        timestamptz NOT NULL

notifications
  id              uuid        PK
  user_id         uuid        FK → users.id
  type            text        NOT NULL
  title           text        NOT NULL
  body            text
  payload         jsonb
  is_read         boolean     DEFAULT false
  read_at         timestamptz
  created_at      timestamptz NOT NULL
```

---

## Key Indexes

```sql
-- Sessions
CREATE UNIQUE INDEX ON sessions (public_id);
CREATE INDEX ON sessions (owner_id, status);
CREATE INDEX ON sessions (status, expires_at) WHERE status = 'active';

-- Guests
CREATE INDEX ON guests (session_id, is_active);
CREATE INDEX ON guest_port_permissions (guest_id);
CREATE INDEX ON guest_port_permissions (session_port_id);

-- Submissions
CREATE INDEX ON write_submissions (session_id, status);
CREATE INDEX ON execute_submissions (session_id, status);

-- Audit (TimescaleDB handles time partitioning automatically)
CREATE INDEX ON audit_events (session_id, occurred_at DESC);
CREATE INDEX ON audit_events (actor_id, occurred_at DESC);
CREATE INDEX ON audit_events (event_type, occurred_at DESC);

-- Auth
CREATE UNIQUE INDEX ON refresh_tokens (token_hash);
CREATE UNIQUE INDEX ON api_keys (key_hash);
CREATE UNIQUE INDEX ON extension_clients (cert_fingerprint);

-- Org
CREATE UNIQUE INDEX ON org_members (org_id, user_id);
```

---

## Row-Level Security

RLS enabled on all multi-tenant tables. Core policies:

- `sessions` — visible to owner and guests of that session
- `guests` — visible to session owner and the guest record itself
- `write_submissions` / `execute_submissions` — visible to session owner and submitting guest
- `audit_events` — visible to session owner and org admins only
- `org_members` — visible to members of the same org
- `guest_port_permissions` — visible to session owner and the guest themselves

---

## Schema Summary

| Group | Tables |
|---|---|
| Identity & Auth | `users`, `refresh_tokens`, `oauth_connections`, `extension_clients`, `api_keys` |
| Orgs & Roles | `organizations`, `org_members` |
| Billing | `subscriptions` |
| Templates | `permission_templates` |
| Sessions | `sessions`, `session_ports`, `session_allowed_commands` |
| Guests | `guests`, `guest_port_permissions` |
| Submissions | `write_submissions`, `execute_submissions` |
| Audit | `audit_events` (TimescaleDB hypertable) |
| Recordings | `session_recordings` |
| Integrations | `integrations`, `notifications` |
