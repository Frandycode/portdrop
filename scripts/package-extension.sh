#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Alias    : CodeBreeder
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : PortDrop — compile and bundle the VS Code extension as a .vsix file
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="$ROOT_DIR/packages/extension"
OUT_DIR="$ROOT_DIR/dist"

# ── Colors ────────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

log()  { echo -e "${CYAN}[PortDrop]${RESET} $*"; }
ok()   { echo -e "${GREEN}[PortDrop] ✔${RESET} $*"; }
fail() { echo -e "${RED}[PortDrop] ✖${RESET} $*"; exit 1; }

# ── Preflight ─────────────────────────────────────────────────────────────────
command -v pnpm >/dev/null 2>&1 || fail "pnpm not found."

log "Packaging PortDrop VS Code extension..."

# ── Clean previous build ──────────────────────────────────────────────────────
log "Cleaning previous build..."
rm -rf "$EXT_DIR/dist"
mkdir -p "$OUT_DIR"

# ── Type-check ────────────────────────────────────────────────────────────────
log "Running type-check..."
pnpm --filter extension type-check
ok "Type-check passed."

# ── Compile TypeScript ────────────────────────────────────────────────────────
log "Compiling TypeScript..."
pnpm --filter extension build
ok "Compiled to $EXT_DIR/dist"

# ── Package .vsix ─────────────────────────────────────────────────────────────
log "Bundling .vsix..."
cd "$EXT_DIR"
pnpm exec vsce package --no-dependencies --out "$OUT_DIR"

VSIX_FILE=$(ls "$OUT_DIR"/*.vsix 2>/dev/null | head -n 1)
[[ -z "$VSIX_FILE" ]] && fail "No .vsix file found in $OUT_DIR"

ok "Extension packaged: $VSIX_FILE"
echo ""
echo -e "  Install locally:   ${CYAN}code --install-extension $VSIX_FILE${RESET}"
echo -e "  Publish to market: ${CYAN}pnpm exec vsce publish${RESET}"
