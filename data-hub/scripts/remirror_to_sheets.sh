#!/bin/bash
#
# remirror_to_sheets.sh -- rebuild the Google Sheet mirror tabs from the DB.
#
# Clears the Articles (kind=live) and Historical_Backfill (kind=backfill) tabs
# and rewrites them from the SQLite system-of-record. Run after an enrichment
# pass (./scripts/enrich_excerpts.sh) to refresh the dashboards with the newly
# backfilled excerpts + recomputed categories. Idempotent.
#
# Set the target sheet via DATA_HUB_SHEET_ID, e.g.:
#   DATA_HUB_SHEET_ID=1AbC... ./scripts/remirror_to_sheets.sh
#
set -euo pipefail

# Always run from the project root, regardless of where the script is called.
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source venv/bin/activate

export DATA_HUB_SHEET_ID="${DATA_HUB_SHEET_ID:-YOUR_SHEET_ID_HERE}"

python scripts/remirror_to_sheets.py "$@"
