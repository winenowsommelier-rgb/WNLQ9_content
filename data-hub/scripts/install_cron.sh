#!/bin/bash
#
# install_cron.sh -- install the daily Content Trend Data Hub ingest cron job.
#
# Run this ONCE to schedule a daily 2 AM ingestion run. Idempotent: re-running
# replaces the existing data-hub cron line rather than duplicating it.
#
# Usage:
#   ./scripts/install_cron.sh
#
# To change the schedule, edit CRON_TIME below (cron syntax: min hour dom mon dow).
# To remove the job later:  crontab -e   (delete the data-hub lines)
#
set -euo pipefail

# --- config -----------------------------------------------------------
SHEET_ID="1c5X9wcgBivLKVarNl0md0XgpnzE-zpPHhpsFiFmqJuM"
CRON_TIME="0 2 * * *"   # daily at 02:00 local time

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_SCRIPT="$PROJECT_DIR/scripts/run_ingest.sh"
LOG_FILE="$PROJECT_DIR/logs/cron.log"
MARKER="# Content Trend Data Hub - daily ingest"

CRON_LINE="$CRON_TIME DATA_HUB_SHEET_ID=\"$SHEET_ID\" \"$RUN_SCRIPT\" >> \"$LOG_FILE\" 2>&1"

# --- install (idempotent) ---------------------------------------------
# Preserve existing crontab, strip any prior data-hub entry, append fresh.
{
  crontab -l 2>/dev/null | grep -v "run_ingest.sh" | grep -vF "$MARKER" || true
  echo "$MARKER"
  echo "$CRON_LINE"
} | crontab -

echo "Installed daily ingest cron job:"
echo "  $CRON_LINE"
echo
echo "Verify with:  crontab -l"
echo "Logs will append to:  $LOG_FILE"
echo
echo "NOTE (macOS): the first time cron runs a script that touches files, macOS"
echo "may require granting 'Full Disk Access' to /usr/sbin/cron in"
echo "System Settings > Privacy & Security > Full Disk Access."
