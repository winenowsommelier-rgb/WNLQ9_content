#!/bin/bash
#
# enrich_with_agents.sh -- repeatable agent-enrichment helper (no API key).
#
# Upgrades article tagging with Claude AGENTS via a saved workflow. Three steps:
#
#   1. ./scripts/enrich_with_agents.sh prep            # dump rows + print args
#      (then run the printed Workflow(name="enrich-articles", ...) in Claude)
#   2. (agents write data/enrich/out_<batch>.jsonl)
#   3. ./scripts/enrich_with_agents.sh merge --remirror  # write back + refresh
#
# status shows enriched vs total counts. Idempotent: `prep` (scope=unenriched,
# the default) only dumps rows still missing the enriched flag.
#
# For --remirror set the target sheet via DATA_HUB_SHEET_ID, e.g.:
#   DATA_HUB_SHEET_ID=1AbC... ./scripts/enrich_with_agents.sh merge --remirror
#
set -euo pipefail

# Always run from the project root, regardless of where the script is called.
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source venv/bin/activate

python scripts/enrich_with_agents.py "$@"
