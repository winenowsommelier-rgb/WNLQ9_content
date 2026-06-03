"""Dashboard tab bootstrapper for the Content Trend Data Hub.

Optional convenience helper (Task 9). The real deliverable is the
human-followable guide in ``docs/DASHBOARD_GUIDE.md``; this class just
automates the boilerplate of standing up the dashboard tabs in a fresh hub
spreadsheet and seeding a few starter formulas via the Sheets API.

Design mirrors :class:`exporters.sheets_exporter.SheetsExporter`:

- Credentials and the googleapiclient service are **lazy-loaded** inside
  :meth:`_get_service`, the single seam tests patch. The constructor never
  touches the network or the credentials file, so it can be built without
  real credentials.
- Every public method is **fail-soft**: any API error is logged and returned
  as ``{"error": "..."}`` rather than raised, so a bootstrap attempt can
  never crash a caller.

Credential setup is identical to the exporter: docs/GOOGLE_SHEETS_SETUP.md.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Same scope as the exporter -- read + write spreadsheet structure & values.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class DashboardBootstrap:
    """Create dashboard tabs and seed starter formulas in a hub spreadsheet."""

    # The dashboard tabs from DASHBOARD_GUIDE.md, in display order. "Thailand"
    # is a cross-vertical geo view (NOT a vertical) added alongside the others.
    DASHBOARD_TABS: List[str] = [
        "Dashboard",
        "Trends",
        "Regions",
        "Brands",
        "AEO Opportunities",
        "Editorial",
        "Thailand",
    ]

    # Starter formulas per tab, keyed by A1-notation cell. These mirror the
    # copy-paste formulas in DASHBOARD_GUIDE.md so a freshly bootstrapped
    # sheet is immediately useful. Kept intentionally small -- the guide is
    # the source of truth for the full set.
    DEFAULT_FORMULAS: Dict[str, Dict[str, str]] = {
        "Dashboard": {
            "A1": "Metric",
            "B1": "Value",
            "A2": "Total articles",
            "B2": "=COUNTA(Articles!C2:C)",
            "A3": "Unique sources",
            "B3": "=COUNTA(UNIQUE(Articles!A2:A))",
            "A4": "Earliest published",
            "B4": '=TEXT(MIN(Articles!D2:D), "yyyy-mm-dd")',
            "A5": "Latest published",
            "B5": '=TEXT(MAX(Articles!D2:D), "yyyy-mm-dd")',
            "A6": "Collected last 7 days",
            "B6": '=COUNTIF(Articles!N2:N, ">="&(TODAY()-7))',
            "A7": "Collected last 30 days",
            "B7": '=COUNTIF(Articles!N2:N, ">="&(TODAY()-30))',
            "A8": "High-AEO articles",
            "B8": '=COUNTIF(Articles!M2:M, "high")',
            "D1": (
                "=QUERY(Articles!A:Q, \"SELECT K, COUNT(K) WHERE K IS NOT NULL "
                "GROUP BY K ORDER BY COUNT(K) DESC LABEL COUNT(K) 'Articles'\", 1)"
            ),
        },
        "Regions": {
            "A1": (
                "=QUERY(Articles!A:Q, \"SELECT H, COUNT(C) WHERE H IS NOT NULL "
                "GROUP BY H ORDER BY COUNT(C) DESC LABEL COUNT(C) 'Articles'\", 1)"
            ),
        },
        # AEO Opportunities now EXCLUDES off-topic rows (Q = beverage relevance):
        # Q <> 'low' keeps the focus on the premium wine/spirits market.
        "AEO Opportunities": {
            "A1": (
                "=QUERY(Articles!A:Q, \"SELECT B, A, H, J, D WHERE M = 'high' "
                "AND Q <> 'low' ORDER BY D DESC LIMIT 50\", 1)"
            ),
        },
        # Editorial likewise focuses on beverage-relevant rows (Q <> 'low').
        "Editorial": {
            "A1": (
                "=QUERY(Articles!A:Q, \"SELECT D, B, A, H, J, K WHERE M = 'high' "
                "AND J IS NOT NULL AND J <> '' AND Q <> 'low' "
                "ORDER BY D DESC LIMIT 100\", 1)"
            ),
            "G1": "Content Idea",
            "H1": "Priority (1-5)",
            "I1": "Owner / Status",
        },
        # Cross-vertical geo view: every Thailand-focused article (any vertical),
        # tagged high or medium in column P (Thailand Focus). Columns selected:
        # D=Published Date, B=Title, A=Source, K=primary_category/vertical,
        # H=Region, P=Thailand Focus.
        "Thailand": {
            "A1": (
                "=QUERY(Articles!A:Q, \"SELECT D, B, A, K, H, P "
                "WHERE P = 'high' OR P = 'medium' ORDER BY D DESC LIMIT 200\", 1)"
            ),
        },
    }

    def __init__(
        self,
        sheet_id: str,
        credentials_path: str = "config/google-credentials.json",
    ) -> None:
        self.sheet_id = sheet_id
        self.credentials_path = credentials_path
        # Lazy: built on first use via _get_service(). NOT connected here so
        # the object can be constructed without credentials (e.g. in tests).
        self._service = None

    # -- tab creation ---------------------------------------------------

    def _existing_tab_titles(self, service) -> List[str]:
        """Return the titles of tabs already present in the spreadsheet."""
        meta = service.spreadsheets().get(spreadsheetId=self.sheet_id).execute()
        return [
            sheet["properties"]["title"]
            for sheet in meta.get("sheets", [])
            if "properties" in sheet and "title" in sheet["properties"]
        ]

    def create_dashboard_tabs(self) -> Dict:
        """Add any missing dashboard tabs via a single batchUpdate.

        Tabs that already exist are left untouched (reported under
        ``skipped``). Returns ``{"created": [...], "skipped": [...]}`` or,
        fail-soft, ``{"error": "..."}`` on any API failure.
        """
        try:
            service = self._get_service()
            existing = set(self._existing_tab_titles(service))

            to_create = [t for t in self.DASHBOARD_TABS if t not in existing]
            skipped = [t for t in self.DASHBOARD_TABS if t in existing]

            if not to_create:
                # Nothing to add -- never issue an empty batchUpdate.
                return {"created": [], "skipped": skipped}

            requests = [
                {"addSheet": {"properties": {"title": title}}}
                for title in to_create
            ]
            service.spreadsheets().batchUpdate(
                spreadsheetId=self.sheet_id,
                body={"requests": requests},
            ).execute()
        except Exception as exc:  # noqa: BLE001 -- fail soft, never crash caller
            logger.error("Dashboard tab creation failed: %s", exc)
            return {"error": str(exc)}

        return {"created": to_create, "skipped": skipped}

    # -- formula writing ------------------------------------------------

    def write_formulas(self, tab_name: str, formulas: Dict[str, str]) -> Dict:
        """Write formula/value cells to ``tab_name``.

        ``formulas`` maps A1-notation cells (e.g. ``"B2"``) to formula or
        literal strings. Formula strings should include the leading ``=``;
        they are written with ``USER_ENTERED`` so Sheets parses them as
        formulas (and dates) just like a human typing them.

        Returns ``{"written": N}`` (cells written) or, fail-soft,
        ``{"written": 0, "error": "..."}``.
        """
        if not formulas:
            return {"written": 0}

        # Pack every requested cell into a single dense rectangle and issue
        # ONE values.update call. Cells outside the requested set inside the
        # bounding box are written as "" (left/restored blank), which is what
        # you want when seeding a fresh tab. One call keeps the API chatter
        # minimal and the range unambiguous.
        a1_range, values = self._pack_range(formulas)
        try:
            service = self._get_service()
            service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=f"{tab_name}!{a1_range}",
                valueInputOption="USER_ENTERED",
                body={"values": values},
            ).execute()
        except Exception as exc:  # noqa: BLE001 -- fail soft
            logger.error("Writing formulas to %s failed: %s", tab_name, exc)
            return {"written": 0, "error": str(exc)}

        return {"written": len(formulas)}

    # -- A1 packing helpers --------------------------------------------

    @staticmethod
    def _col_to_index(col: str) -> int:
        """Convert a column letter sequence (A, B, ..., Z, AA) to 0-based index."""
        idx = 0
        for ch in col:
            idx = idx * 26 + (ord(ch.upper()) - ord("A") + 1)
        return idx - 1

    @staticmethod
    def _index_to_col(idx: int) -> str:
        """Convert a 0-based column index back to a column letter sequence."""
        letters = ""
        idx += 1
        while idx > 0:
            idx, rem = divmod(idx - 1, 26)
            letters = chr(ord("A") + rem) + letters
        return letters

    @classmethod
    def _parse_cell(cls, cell: str):
        """Parse an A1 cell like 'B12' into (0-based col, 0-based row)."""
        col = "".join(c for c in cell if c.isalpha())
        row = "".join(c for c in cell if c.isdigit())
        return cls._col_to_index(col), int(row) - 1

    @classmethod
    def _pack_range(cls, formulas: Dict[str, str]):
        """Pack a {A1-cell: value} dict into (a1_range, 2D values matrix).

        Returns the smallest bounding A1 range covering all cells and a dense
        row-major matrix; cells not in ``formulas`` become "". For a single
        cell this returns just that cell (e.g. ``"B2"``).
        """
        coords = {cls._parse_cell(cell): value for cell, value in formulas.items()}
        cols = [c for (c, _r) in coords]
        rows = [r for (_c, r) in coords]
        min_c, max_c = min(cols), max(cols)
        min_r, max_r = min(rows), max(rows)

        matrix = [
            [coords.get((c, r), "") for c in range(min_c, max_c + 1)]
            for r in range(min_r, max_r + 1)
        ]

        start = f"{cls._index_to_col(min_c)}{min_r + 1}"
        if (min_c, min_r) == (max_c, max_r):
            a1_range = start
        else:
            end = f"{cls._index_to_col(max_c)}{max_r + 1}"
            a1_range = f"{start}:{end}"
        return a1_range, matrix

    def seed_default_formulas(self) -> Dict:
        """Write the starter formulas from :attr:`DEFAULT_FORMULAS` to each tab.

        Returns ``{"seeded": [tab, ...]}`` listing the tabs successfully
        written. Fail-soft: a per-tab error is logged and that tab is
        omitted from ``seeded`` rather than aborting the whole run.
        """
        seeded: List[str] = []
        for tab, formulas in self.DEFAULT_FORMULAS.items():
            result = self.write_formulas(tab, formulas)
            if not result.get("error") and result.get("written", 0) > 0:
                seeded.append(tab)
        return {"seeded": seeded}

    # -- service seam (mocked in tests) ---------------------------------

    def _get_service(self):
        """Build and return the googleapiclient Sheets service.

        Cached after first build. This is the single seam tests patch, so
        the heavy Google imports live here and never run at import time.
        """
        if self._service is not None:
            return self._service

        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        credentials = service_account.Credentials.from_service_account_file(
            self.credentials_path, scopes=SCOPES
        )
        self._service = build("sheets", "v4", credentials=credentials)
        return self._service
