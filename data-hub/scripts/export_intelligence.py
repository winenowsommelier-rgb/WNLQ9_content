"""Export the Supabase SQL intelligence views into Google Sheet tabs.

Reads the ch_* analytical views (created in Supabase) via the Supabase REST
API and writes each to a dedicated "Intel_*" worksheet, so the team — who
work in the Google Sheet — can see trend velocity, the premium pulse, content
gaps (market vs. your real GSC search data), and the editorial/Thailand feeds
without touching SQL.

Requires env (see config/.env): SUPABASE_URL, SUPABASE_SERVICE_KEY,
DATA_HUB_SHEET_ID. Operator/CI script — not part of the mocked test suite.

Usage:
    cd data-hub && source venv/bin/activate
    # (env loaded from config/.env by run scripts / CI)
    python scripts/export_intelligence.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# (tab name, view name, ordered columns, row limit)
VIEWS = [
    ("Intel_ContentGap", "ch_content_gap",
     ["keyword", "site", "impressions", "clicks", "avg_rank", "market_articles"], 100),
    ("Intel_TrendVelocity", "ch_trend_velocity",
     ["signal", "last_30d", "prior_30d", "last_90d", "velocity_ratio"], 50),
    ("Intel_PremiumPulse", "ch_premium_pulse",
     ["signal", "last_30d", "last_90d"], 50),
    ("Intel_CategoryVelocity", "ch_category_velocity",
     ["primary_category", "last_30d", "prior_30d", "total"], 50),
    ("Intel_Editorial", "ch_editorial_opportunities",
     ["published", "primary_category", "topic_region", "spirits_type",
      "thailand_focus", "trend_signals", "title", "source_name", "article_url"], 250),
    ("Intel_Thailand", "ch_thailand_intelligence",
     ["published", "thailand_focus", "primary_category", "beverage_relevance",
      "title", "source_name", "article_url"], 250),
]


def _supabase_client():
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def _sheets_service():
    from exporters.sheets_exporter import SheetsExporter
    exp = SheetsExporter(sheet_id=os.environ["DATA_HUB_SHEET_ID"])
    return exp._get_service(), exp.sheet_id


def _ensure_tab(service, sheet_id, tab):
    meta = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
    titles = [s["properties"]["title"] for s in meta.get("sheets", [])]
    if tab not in titles:
        service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={"requests": [{"addSheet": {"properties": {"title": tab}}}]},
        ).execute()


def _write_tab(service, sheet_id, tab, header, rows):
    _ensure_tab(service, sheet_id, tab)
    service.spreadsheets().values().clear(
        spreadsheetId=sheet_id, range=f"{tab}!A:Z", body={}).execute()
    values = [header] + rows
    service.spreadsheets().values().update(
        spreadsheetId=sheet_id, range=f"{tab}!A1",
        valueInputOption="RAW", body={"values": values}).execute()


def main() -> int:
    for var in ("SUPABASE_URL", "SUPABASE_SERVICE_KEY", "DATA_HUB_SHEET_ID"):
        if not os.environ.get(var):
            print(f"ERROR: {var} not set (see config/.env).")
            return 1

    sb = _supabase_client()
    service, sheet_id = _sheets_service()

    print("Exporting SQL intelligence views -> Google Sheet tabs")
    print("=" * 56)
    for tab, view, cols, limit in VIEWS:
        try:
            resp = sb.table(view).select("*").limit(limit).execute()
            data = resp.data or []
            rows = [[r.get(c) for c in cols] for r in data]
            _write_tab(service, sheet_id, tab, cols, rows)
            print(f"  {tab:24s} <- {view:28s} {len(rows):4d} rows")
        except Exception as exc:  # noqa: BLE001 -- fail soft per view
            print(f"  {tab:24s} FAILED: {exc}")
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
