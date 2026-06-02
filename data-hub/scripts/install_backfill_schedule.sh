#!/bin/bash
#
# install_backfill_schedule.sh -- schedule the QUARTERLY historical backfill
# as a macOS LaunchAgent (separate from the daily ingest agent).
#
# Runs run_backfill.sh --months-back 12 on the 1st of Jan/Apr/Jul/Oct at 03:00,
# refreshing the Historical_Backfill tab via deep sitemap crawling. Idempotent.
#
# Usage:   ./scripts/install_backfill_schedule.sh
# Remove:  launchctl bootout gui/$(id -u)/com.wnlq9.datahub.backfill
#          rm ~/Library/LaunchAgents/com.wnlq9.datahub.backfill.plist
#
set -euo pipefail

SHEET_ID="1c5X9wcgBivLKVarNl0md0XgpnzE-zpPHhpsFiFmqJuM"
LABEL="com.wnlq9.datahub.backfill"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_SCRIPT="$PROJECT_DIR/scripts/run_backfill.sh"
LOG_FILE="$PROJECT_DIR/logs/backfill.log"
TEMPLATE="$PROJECT_DIR/scripts/$LABEL.plist"
AGENTS_DIR="$HOME/Library/LaunchAgents"
DEST="$AGENTS_DIR/$LABEL.plist"

mkdir -p "$AGENTS_DIR"

sed -e "s|__RUN_SCRIPT__|$RUN_SCRIPT|g" \
    -e "s|__SHEET_ID__|$SHEET_ID|g" \
    -e "s|__LOG_FILE__|$LOG_FILE|g" \
    "$TEMPLATE" > "$DEST"
echo "Installed quarterly-backfill LaunchAgent -> $DEST"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$DEST"
launchctl enable "gui/$(id -u)/$LABEL" 2>/dev/null || true

echo
echo "Quarterly backfill scheduled (Jan/Apr/Jul/Oct 1st, 03:00), logging to:"
echo "  $LOG_FILE"
echo
echo "Verify with:  launchctl list | grep datahub"
echo "Run once now: launchctl kickstart gui/$(id -u)/$LABEL"
