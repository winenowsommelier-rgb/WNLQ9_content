"""Verify the Google Sheets setup before the first real pipeline run.

Runs a sequence of preflight checks and prints a clear PASS/FAIL report so
you can fix configuration problems (missing key, wrong sheet ID, sheet not
shared with the service account) before running the full ingest pipeline.

Usage:
    cd data-hub
    source venv/bin/activate
    export DATA_HUB_SHEET_ID="your-sheet-id"
    python scripts/verify_sheets_setup.py            # read-only checks
    python scripts/verify_sheets_setup.py --write     # also do a test write

Exit codes: 0 = all checks passed, 1 = at least one check failed.

This script is a runtime operator utility — it talks to the live Google
Sheets API and is therefore NOT part of the mocked pytest suite.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

# Make the data-hub package importable when run as `python scripts/...`.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

DEFAULT_CREDENTIALS_PATH = "config/google-credentials.json"
TEST_TAB = "Setup_Test"

# ANSI helpers (degrade gracefully if not a TTY).
_TTY = sys.stdout.isatty()
def _green(s): return f"\033[32m{s}\033[0m" if _TTY else s
def _red(s): return f"\033[31m{s}\033[0m" if _TTY else s
def _bold(s): return f"\033[1m{s}\033[0m" if _TTY else s

def ok(msg): print(f"  {_green('PASS')}  {msg}")
def fail(msg): print(f"  {_red('FAIL')}  {msg}")
def info(msg): print(f"        {msg}")


def check_dependencies() -> bool:
    """Confirm the Google client libraries are installed."""
    print(_bold("\n[1/5] Google client libraries"))
    try:
        import google.oauth2.service_account  # noqa: F401
        import googleapiclient.discovery  # noqa: F401
    except ImportError as exc:
        fail(f"Missing dependency: {exc.name}")
        info("Fix: pip install -r requirements.txt")
        return False
    ok("google-api-python-client + google-auth importable")
    return True


def check_credentials(credentials_path: str):
    """Confirm the service-account JSON exists and is well-formed.

    Returns the client_email on success, or None on failure.
    """
    print(_bold("\n[2/5] Service-account credentials"))
    if not os.path.exists(credentials_path):
        fail(f"Not found: {credentials_path}")
        info("Fix: complete Step 3 of docs/GOOGLE_SHEETS_SETUP.md and save the")
        info("     downloaded JSON key to that path.")
        return None
    try:
        with open(credentials_path) as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, OSError) as exc:
        fail(f"Could not read/parse {credentials_path}: {exc}")
        return None

    if data.get("type") != "service_account":
        fail(f"{credentials_path} is not a service-account key "
             f"(type={data.get('type')!r}).")
        info("Fix: download a *service account* JSON key (Step 3), not an")
        info("     OAuth client secret.")
        return None

    client_email = data.get("client_email")
    if not client_email:
        fail("Key file has no client_email field.")
        return None

    ok(f"Valid service-account key for project {data.get('project_id')!r}")
    info(f"client_email: {_bold(client_email)}")
    info("The sheet MUST be shared with this address (Editor). See Step 5.")
    return client_email


def check_sheet_id(sheet_id: str | None) -> bool:
    """Confirm a sheet ID was provided."""
    print(_bold("\n[3/5] Sheet ID"))
    if not sheet_id:
        fail("No sheet ID provided.")
        info("Fix: export DATA_HUB_SHEET_ID=... (Step 6) or pass --sheet-id.")
        return False
    ok(f"Sheet ID present ({sheet_id[:6]}…{sheet_id[-4:]})")
    return True


def check_connection(sheet_id: str, credentials_path: str):
    """Connect to the live API and read sheet metadata.

    Returns the googleapiclient service on success, or None on failure.
    """
    print(_bold("\n[4/5] Live connection + access"))
    from exporters import SheetsExporter

    exporter = SheetsExporter(sheet_id=sheet_id, credentials_path=credentials_path)
    try:
        service = exporter._get_service()
        meta = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
    except Exception as exc:  # noqa: BLE001 -- diagnose & report, don't crash
        text = str(exc)
        if "403" in text:
            fail("403 Permission denied — the sheet is not shared with the "
                 "service account.")
            info("Fix: share the sheet with the client_email above (Editor), "
                 "Step 5.")
        elif "404" in text:
            fail("404 Not found — the sheet ID is wrong.")
            info("Fix: re-copy the ID from the sheet URL (Step 4).")
        else:
            fail(f"Connection error: {text}")
        return None, None

    title = meta.get("properties", {}).get("title", "<unknown>")
    tabs = [s["properties"]["title"] for s in meta.get("sheets", [])]
    ok(f"Connected and can read sheet: {title!r}")
    info(f"Tabs: {', '.join(tabs)}")
    if "Articles" not in tabs:
        info("Note: no 'Articles' tab yet — the exporter creates rows on the "
             "tab named in sheet_name (default 'Articles'). Rename your first "
             "tab to 'Articles' or it will be created on append.")
    return service, exporter


def check_write(exporter) -> bool:
    """Optionally append + leave a single test row on a throwaway tab."""
    print(_bold("\n[5/5] Test write"))
    sample = [{
        "source_name": "SETUP_TEST",
        "article_url": "https://example.com/setup-test",
        "title": "Setup verification row (safe to delete)",
        "published_date": "2026-01-01T00:00:00Z",
        "content_type": "news",
        "content_excerpt": "Written by verify_sheets_setup.py to confirm write access.",
        "trend_signals": [],
    }]
    result = exporter.export_articles(sample, sheet_name=TEST_TAB, include_header=True)
    if result.get("exported", 0) >= 1:
        ok(f"Wrote {result['exported']} test row to tab {TEST_TAB!r}")
        info(f"You can delete the {TEST_TAB!r} tab afterwards.")
        return True
    fail(f"Write failed: {result.get('error', 'unknown error')}")
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Google Sheets setup.")
    parser.add_argument("--sheet-id", default=os.environ.get("DATA_HUB_SHEET_ID"))
    parser.add_argument("--credentials", default=DEFAULT_CREDENTIALS_PATH)
    parser.add_argument("--write", action="store_true",
                        help="Also perform a test write to a throwaway tab.")
    args = parser.parse_args()

    print(_bold("Google Sheets setup verification"))
    print("=" * 40)

    passed = True
    if not check_dependencies():
        passed = False
    client_email = check_credentials(args.credentials)
    if client_email is None:
        passed = False
    if not check_sheet_id(args.sheet_id):
        passed = False

    # Only attempt the live connection if the prerequisites held.
    exporter = None
    if passed:
        service, exporter = check_connection(args.sheet_id, args.credentials)
        if service is None:
            passed = False
    else:
        print(_bold("\n[4/5] Live connection + access"))
        info("Skipped — fix the failures above first.")

    if args.write:
        if exporter is not None:
            if not check_write(exporter):
                passed = False
        else:
            print(_bold("\n[5/5] Test write"))
            info("Skipped — connection check did not pass.")
    else:
        print(_bold("\n[5/5] Test write"))
        info("Skipped (read-only mode). Re-run with --write to test appending.")

    print("\n" + "=" * 40)
    if passed:
        print(_green(_bold("All checks passed — the data hub can write to your sheet.")))
        print("Next: run the pipeline →  ./scripts/run_ingest.sh")
        return 0
    print(_red(_bold("Some checks failed — see the fixes above.")))
    print("Reference: docs/GOOGLE_SHEETS_SETUP.md")
    return 1


if __name__ == "__main__":
    sys.exit(main())
