#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Alias    : CodeBreeder
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : PortDrop — local dev startup script, spins up all services
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Colors ────────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

log()  { echo -e "${CYAN}[PortDrop]${RESET} $*"; }
ok()   { echo -e "${GREEN}[PortDrop] ✔${RESET} $*"; }
warn() { echo -e "${YELLOW}[PortDrop] ⚠${RESET} $*"; }
fail() { echo -e "${RED}[PortDrop] ✖${RESET} $*"; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────
log "Running preflight checks..."

command -v node   >/dev/null 2>&1 || fail "Node.js not found. Required: >=20"
command -v pnpm   >/dev/null 2>&1 || fail "pnpm not found. Install: npm i -g pnpm"
command -v docker >/dev/null 2>&1 || warn "Docker not found — infra services will be skipped."

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node)")
MAJOR="${NODE_VERSION%%.*}"
if [[ "$MAJOR" -lt 20 ]]; then
  fail "Node.js >=20 required. Found: v${NODE_VERSION}"
fi

ok "Node v${NODE_VERSION} · pnpm $(pnpm --version)"

# ── Install dependencies ───────────────────────────────────────────────────────
log "Installing dependencies..."
cd "$ROOT_DIR"
pnpm install --frozen-lockfile
ok "Dependencies installed."

# ── Start services ────────────────────────────────────────────────────────────
log "Starting services..."

# Dashboard (Next.js) in the background
log "Starting dashboard on :3001..."
pnpm --filter dashboard dev &
DASHBOARD_PID=$!

# Docker Compose (Nginx) — skip gracefully if Docker unavailable
if command -v docker >/dev/null 2>&1; then
  log "Starting Docker services (Nginx)..."
  docker compose -f "$ROOT_DIR/infra/docker-compose.yml" up -d
  ok "Docker services up."
else
  warn "Skipping Docker services — Docker not available."
fi

ok "All services started."
echo ""
echo -e "  ${CYAN}Dashboard${RESET}  → http://localhost:3001"
echo -e "  ${CYAN}Nginx${RESET}      → http://localhost:8080  (if Docker running)"
echo ""
echo -e "  Press ${YELLOW}Ctrl+C${RESET} to stop all services."

# ── Trap Ctrl+C — clean shutdown ──────────────────────────────────────────────
cleanup() {
  echo ""
  log "Shutting down..."
  kill "$DASHBOARD_PID" 2>/dev/null || true

  if command -v docker >/dev/null 2>&1; then
    docker compose -f "$ROOT_DIR/infra/docker-compose.yml" down 2>/dev/null || true
  fi

  ok "All services stopped. Good night, CodeBreeder."
  exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script alive while background processes run
wait "$DASHBOARD_PID"
