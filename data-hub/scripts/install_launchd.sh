#!/bin/bash
#
# install_launchd.sh -- install the daily ingest as a macOS LaunchAgent.
#
# This is the recommended "set once" scheduler on macOS. Unlike system cron,
# a LaunchAgent runs in your user session and inherits your file permissions,
# so it does NOT require granting Full Disk Access to /usr/sbin/cron.
#
# What it does (idempotent):
#   1. Renders the plist template with your sheet ID and absolute paths.
#   2. Installs it to ~/Library/LaunchAgents/.
#   3. Removes the old `cron` ingest entry (so the job doesn't run twice).
#   4. Loads (bootstraps) the agent so it's scheduled immediately.
#
# Usage:   ./scripts/install_launchd.sh
# Remove:  launchctl bootout gui/$(id -u)/com.wnlq9.datahub.ingest
#          rm ~/Library/LaunchAgents/com.wnlq9.datahub.ingest.plist
#
set -euo pipefail

# --- config -----------------------------------------------------------
SHEET_ID="1c5X9wcgBivLKVarNl0md0XgpnzE-zpPHhpsFiFmqJuM"
LABEL="com.wnlq9.datahub.ingest"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_SCRIPT="$PROJECT_DIR/scripts/run_ingest.sh"
LOG_FILE="$PROJECT_DIR/logs/cron.log"
TEMPLATE="$PROJECT_DIR/scripts/com.wnlq9.datahub.ingest.plist"
AGENTS_DIR="$HOME/Library/LaunchAgents"
DEST="$AGENTS_DIR/$LABEL.plist"

mkdir -p "$AGENTS_DIR"

# --- 1 & 2: render template -> install --------------------------------
sed -e "s|__RUN_SCRIPT__|$RUN_SCRIPT|g" \
    -e "s|__SHEET_ID__|$SHEET_ID|g" \
    -e "s|__LOG_FILE__|$LOG_FILE|g" \
    "$TEMPLATE" > "$DEST"
echo "Installed LaunchAgent plist -> $DEST"

# --- 3: remove the old cron entry to avoid double-running -------------
if crontab -l 2>/dev/null | grep -q "run_ingest.sh"; then
    crontab -l 2>/dev/null \
      | grep -v "run_ingest.sh" \
      | grep -vF "# Content Trend Data Hub - daily ingest" \
      | crontab -
    echo "Removed the old cron ingest entry (LaunchAgent supersedes it)."
fi

# --- 4: (re)load the agent -------------------------------------------
# bootout first in case a previous version is loaded (ignore errors).
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$DEST"
launchctl enable "gui/$(id -u)/$LABEL" 2>/dev/null || true

echo
echo "Daily ingest scheduled via launchd at 02:00, logging to:"
echo "  $LOG_FILE"
echo
echo "Verify with:  launchctl list | grep datahub"
echo "Run once now: launchctl kickstart gui/$(id -u)/$LABEL"
