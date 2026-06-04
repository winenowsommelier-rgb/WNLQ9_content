#!/bin/bash
# ============================================================
# Install Claude Code global (user-level) memory.
#
# Copies this repo's committed CLAUDE.md to ~/.claude/CLAUDE.md so the
# behavioral guidelines load in EVERY Claude Code session, not just
# sessions opened inside this repo.
#
# Web sessions run in fresh, ephemeral containers, so ~/.claude is wiped
# between sessions. To make the global memory durable, add this line to
# your Claude Code web Environment's setup script (runs on every new
# container):
#
#     bash scripts/setup-claude-global-memory.sh
#
# The repo's CLAUDE.md stays the single source of truth — edit it to
# update the guidelines everywhere. Docs:
# https://code.claude.com/docs/en/claude-code-on-the-web
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/CLAUDE.md"
DEST_DIR="$HOME/.claude"
DEST="$DEST_DIR/CLAUDE.md"

if [ ! -f "$SRC" ]; then
  echo "ERROR: $SRC not found — run this from a checkout of the repo." >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
cp "$SRC" "$DEST"
echo "Installed global Claude memory: $DEST"
