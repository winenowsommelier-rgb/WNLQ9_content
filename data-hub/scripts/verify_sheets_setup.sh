#!/bin/bash
# Verify the Google Sheets setup before the first pipeline run.
# Usage: ./scripts/verify_sheets_setup.sh [--write]
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source venv/bin/activate
python scripts/verify_sheets_setup.py "$@"
