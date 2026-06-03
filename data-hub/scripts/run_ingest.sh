#!/bin/bash
#
# run_ingest.sh -- daily Content Trend Data Hub ingestion run.
#
# Activates the project virtualenv and runs the ingestion pipeline. Intended
# to be invoked directly or from cron (see scripts/cron_setup.md).
#
# Override the target Google Sheet by exporting DATA_HUB_SHEET_ID before
# calling, e.g.:  DATA_HUB_SHEET_ID=1AbC... ./scripts/run_ingest.sh
#
set -euo pipefail

# Always run from the project root, regardless of where the script is called.
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source venv/bin/activate

# Load optional local config (DB backend + Supabase creds, sheet id). The file
# is gitignored. KEY=value lines only; safe to source in bash. If absent, the
# pipeline falls back to the local SQLite backend.
if [ -f config/.env ]; then
    set -a
    # shellcheck disable=SC1091
    . config/.env
    set +a
fi

export DATA_HUB_SHEET_ID="${DATA_HUB_SHEET_ID:-1c5X9wcgBivLKVarNl0md0XgpnzE-zpPHhpsFiFmqJuM}"

python -m pipeline.ingest
