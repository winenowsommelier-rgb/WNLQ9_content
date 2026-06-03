#!/bin/bash
#
# run_backfill.sh -- one-off / quarterly Content Trend Data Hub historical
# backfill. Seeds the hub with up to ~12 months of past content into a
# SEPARATE worksheet ("Historical_Backfill"), so it never mixes with the
# daily "Articles" tab.
#
# This is NOT a daily cron job. Run it manually after first setup and again
# roughly quarterly to backfill any newly added sources (see
# scripts/cron_setup.md, "Historical backfill" section).
#
# Override the target Google Sheet by exporting DATA_HUB_SHEET_ID before
# calling, e.g.:  DATA_HUB_SHEET_ID=1AbC... ./scripts/run_backfill.sh
#
# Optional args are passed straight through, e.g.:
#   ./scripts/run_backfill.sh --months-back 18 --max-pages 10
#
set -euo pipefail

# Always run from the project root, regardless of where the script is called.
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source venv/bin/activate

# Load optional local config (DB backend + Supabase creds, sheet id); gitignored.
if [ -f config/.env ]; then
    set -a
    # shellcheck disable=SC1091
    . config/.env
    set +a
fi

export DATA_HUB_SHEET_ID="${DATA_HUB_SHEET_ID:-1c5X9wcgBivLKVarNl0md0XgpnzE-zpPHhpsFiFmqJuM}"

python -m pipeline.backfill "$@"
