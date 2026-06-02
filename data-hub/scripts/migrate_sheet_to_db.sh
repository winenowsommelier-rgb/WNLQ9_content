#!/bin/bash
# One-time migration: import existing Google Sheets data into the SQLite DB.
# Idempotent -- re-running is safe (dupes skipped by normalized URL).
# Usage: ./scripts/migrate_sheet_to_db.sh [--sheet-id ID] [--db-path PATH]
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source venv/bin/activate
python scripts/migrate_sheet_to_db.py "$@"
