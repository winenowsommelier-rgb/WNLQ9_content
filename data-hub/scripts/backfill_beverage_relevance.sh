#!/bin/bash
#
# backfill_beverage_relevance.sh -- set beverage_relevance on existing DB rows.
#
# Pure keyword pass (no network, no Sheets, no LLM): walks every stored article
# and writes its cross-vertical beverage_relevance level (high/medium/low) from
# the stored title + excerpt + primary_category. Non-destructive, idempotent.
#
# Run once after deploying the column, then re-mirror so the dashboards pick up
# column Q:
#   ./scripts/backfill_beverage_relevance.sh
#   DATA_HUB_SHEET_ID=1AbC... ./scripts/remirror_to_sheets.sh
#
# Pass --dry-run to preview the distribution without writing.
#
set -euo pipefail

# Always run from the project root, regardless of where the script is called.
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source venv/bin/activate

python scripts/backfill_beverage_relevance.py "$@"
