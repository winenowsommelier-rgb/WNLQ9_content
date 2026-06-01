#!/bin/bash
#
# run_health_check.sh -- Content Trend Data Hub pipeline health check.
#
# Activates the project virtualenv and runs the monitoring health check,
# which inspects the Articles worksheet and logs/ingest.log to verify last
# night's run worked and the data is well-formed. Prints a readable report.
#
# Exit code: 0 when overall health is healthy OR warning (soft -- nothing to
# page about), 1 when critical (a check errored, e.g. Sheets unreachable), so
# this is safe to wire into cron with alerting on non-zero. For example, a
# morning check shortly after the 2 AM ingestion run:
#
#   30 2 * * * DATA_HUB_SHEET_ID=YOUR_SHEET_ID /abs/path/data-hub/scripts/run_health_check.sh >> /abs/path/data-hub/logs/cron.log 2>&1
#
# Override the target Google Sheet by exporting DATA_HUB_SHEET_ID before
# calling, e.g.:  DATA_HUB_SHEET_ID=1AbC... ./scripts/run_health_check.sh
#
set -euo pipefail

# Always run from the project root, regardless of where the script is called.
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source venv/bin/activate

export DATA_HUB_SHEET_ID="${DATA_HUB_SHEET_ID:-YOUR_SHEET_ID_HERE}"

python -m monitoring.health_check
