#!/bin/bash
#
# enrich_excerpts.sh -- backfill empty article excerpts + re-categorize.
#
# Walks DB rows with an empty content_excerpt that aren't yet enriched,
# fetches each article's real page text (publisher meta description / first
# paragraph -- NO LLM), re-runs the keyword categorizer, and writes back.
# Idempotent and fail-soft: re-run until it reports 'processed=0'. Safe to run
# in the background. Bound a single run with --limit / --delay.
#
# Usage:
#   ./scripts/enrich_excerpts.sh                 # up to 500 rows
#   ./scripts/enrich_excerpts.sh --limit 1000 --delay 0.5
#
# After enriching, refresh the Sheet with ./scripts/remirror_to_sheets.sh
#
set -euo pipefail

# Always run from the project root, regardless of where the script is called.
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source venv/bin/activate

python scripts/enrich_excerpts.py "$@"
