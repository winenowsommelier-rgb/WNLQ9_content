"""Google Sheets exporter for the Content Trend Data Hub.

Pushes processed, schema-conforming articles into a Google Sheet, the
chosen storage hub. Each article becomes one row in stable column order
(see :attr:`SheetsExporter.COLUMNS`), mapping the schema fields defined in
schema/data-schema.md.

Design: credentials and the googleapiclient service are lazy-loaded. The
constructor never touches the network or the credentials file, so callers
(and tests) can build a :class:`SheetsExporter` without real credentials.
The single seam for mocking is :meth:`_get_service`; tests patch it to
return a fake service object and assert on the recorded ``append`` call.

Setup instructions for credentials: docs/GOOGLE_SHEETS_SETUP.md.
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# An ISO-8601 datetime: a date, a 'T' (or space) separator, and a time, with an
# optional fractional-seconds part and an optional 'Z'/+HH:MM timezone suffix.
_ISO_DATETIME_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$"
)

# Scope required to append values to a spreadsheet.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class SheetsExporter:
    """Append schema-conforming articles to a Google Sheet.

    The Google Sheets API is only imported and instantiated on demand,
    inside :meth:`_get_service`, so importing this module and constructing
    the exporter never require ``google-api-python-client`` to be installed
    or a credentials file to be present.
    """

    # Ordered column headers. The order is the contract for every row
    # produced by :meth:`format_article_row`. The append range is computed
    # from len(COLUMNS) via :meth:`_last_column_letter`, so appending a new
    # column here is safe (no hardcoded range to keep in sync). Downstream
    # consumers that resolve indices by name (existing_urls, health_check)
    # stay correct as long as you only APPEND, never reorder.
    COLUMNS: List[str] = [
        "Source",
        "Title",
        "URL",
        "Published Date",
        "Author",
        "Excerpt",
        "Content Type",
        "Region",
        "Spirits Type",
        "Trend Signals",
        "Primary Category",
        "Buyer Persona",
        "AEO Value",
        "Collected Date",
        "Source Language",
        "Thailand Focus",
        "Beverage Relevance",
    ]

    # Maps each column header to the article dict field that feeds it.
    _FIELD_BY_COLUMN: Dict[str, str] = {
        "Source": "source_name",
        "Title": "title",
        "URL": "article_url",
        "Published Date": "published_date",
        "Author": "author",
        "Excerpt": "content_excerpt",
        "Content Type": "content_type",
        "Region": "topic_region",
        "Spirits Type": "spirits_type",
        "Trend Signals": "trend_signals",
        "Primary Category": "primary_category",
        "Buyer Persona": "buyer_persona",
        "AEO Value": "aeo_citation_opportunity",
        "Collected Date": "collected_date",
        "Source Language": "source_language",
        "Thailand Focus": "thailand_focus",
        "Beverage Relevance": "beverage_relevance",
    }

    TREND_SIGNAL_SEPARATOR = " | "

    # Columns holding datetimes. Stored as Sheets-native "YYYY-MM-DD HH:MM:SS"
    # strings so USER_ENTERED parses them as real dates (MIN/MAX, COUNTIF ">=",
    # QUERY date literals all work). Resolved to indices in __init__.
    DATE_COLUMNS = ("Published Date", "Collected Date")

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
        # Field names of the date columns, derived from COLUMNS by name (never
        # hardcoded indices) so reordering COLUMNS can't silently misalign them.
        self._date_fields = {
            self._FIELD_BY_COLUMN[col] for col in self.DATE_COLUMNS
        }

    # -- formatting -----------------------------------------------------

    @staticmethod
    def _to_sheets_datetime(value: str) -> str:
        """Convert an ISO-8601 datetime to Sheets-native "YYYY-MM-DD HH:MM:SS".

        - Empty / falsy -> "".
        - ISO datetime (has a date + time, optional fractional seconds and
          timezone) -> "YYYY-MM-DD HH:MM:SS" (drops fractional seconds and tz).
        - Anything not matching ISO -> returned unchanged (don't crash).
        """
        if not value:
            return ""
        text = str(value).strip()
        match = _ISO_DATETIME_RE.match(text)
        if not match:
            return str(value)
        return f"{match.group(1)} {match.group(2)}"

    def header_row(self) -> List[str]:
        """Return the ordered column headers."""
        return list(self.COLUMNS)

    @staticmethod
    def _column_letter(index: int) -> str:
        """Convert a 0-based column index to a spreadsheet letter (A, ..., Z, AA).

        Defensive beyond Z so future column additions never silently break the
        computed append range.
        """
        letters = ""
        index += 1
        while index > 0:
            index, rem = divmod(index - 1, 26)
            letters = chr(ord("A") + rem) + letters
        return letters

    @classmethod
    def _last_column_letter(cls) -> str:
        """Letter of the last column, derived from len(COLUMNS) (e.g. 'P')."""
        return cls._column_letter(len(cls.COLUMNS) - 1)

    def format_article_row(self, article: Dict) -> List:
        """Convert one article dict to a row (list) in COLUMNS order.

        - ``trend_signals`` (a list) is joined with " | ".
        - Missing or ``None`` fields become empty strings.
        - All other values are stringified for stable spreadsheet cells.
        """
        row: List = []
        for column in self.COLUMNS:
            field = self._FIELD_BY_COLUMN[column]
            value = article.get(field)
            row.append(self._format_value(field, value))
        return row

    def _format_value(self, field: str, value) -> str:
        """Stringify a single field value for a spreadsheet cell."""
        if value is None:
            return ""

        if field in self._date_fields:
            # Normalise ISO datetimes to a Sheets-native string; leave
            # empties as "" and unparseable values untouched.
            return self._to_sheets_datetime(value)

        if field == "trend_signals":
            if isinstance(value, (list, tuple)):
                return self.TREND_SIGNAL_SEPARATOR.join(str(v) for v in value)
            return str(value)

        if isinstance(value, bool):
            # Stringify booleans sensibly (TRUE/FALSE).
            return "TRUE" if value else "FALSE"

        if isinstance(value, (list, tuple)):
            return self.TREND_SIGNAL_SEPARATOR.join(str(v) for v in value)

        return str(value)

    # -- export ---------------------------------------------------------

    def export_articles(
        self,
        articles: List[Dict],
        sheet_name: str = "Articles",
        include_header: bool = False,
    ) -> Dict:
        """Format and append all articles to the sheet via the Sheets API.

        Returns a summary dict ``{"exported": N, "sheet": sheet_name}``.
        Fail-soft: on any error the failure is logged and a dict
        ``{"exported": 0, "error": "..."}`` is returned rather than raising.
        """
        rows = [self.format_article_row(article) for article in articles]

        # Nothing to send (and no header requested): skip the API entirely.
        if not rows and not include_header:
            return {"exported": 0, "sheet": sheet_name}

        try:
            service = self._get_service()

            # Gap A: the append API can't auto-create tabs, so ensure the
            # target tab exists first (fail-soft -- a metadata hiccup lets the
            # append surface the real error).
            self._ensure_tab_exists(service, sheet_name)

            # Gap B: a fresh/empty tab gets a header row automatically so the
            # dashboard QUERY ",1" header param and humans both have one. An
            # explicit include_header=True still forces a header. A tab that
            # already has data is appended to without a duplicate header.
            prepend_header = include_header or self._tab_is_empty(service, sheet_name)
            if prepend_header:
                rows = [self.header_row()] + rows

            last_col = self._last_column_letter()
            service.spreadsheets().values().append(
                spreadsheetId=self.sheet_id,
                range=f"{sheet_name}!A:{last_col}",
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": rows},
            ).execute()
        except Exception as exc:  # noqa: BLE001 -- fail soft, never crash pipeline
            logger.error("Google Sheets export failed: %s", exc)
            return {"exported": 0, "error": str(exc)}

        return {"exported": len(articles), "sheet": sheet_name}

    # -- tab management (Gap A / Gap B) ---------------------------------

    def _ensure_tab_exists(self, service, sheet_name: str) -> None:
        """Create ``sheet_name`` if it's not already a tab in the spreadsheet.

        The Sheets append API does NOT auto-create tabs (appending to a missing
        tab fails with "Unable to parse range"). This reads spreadsheet
        metadata and, if the tab is absent, issues an ``addSheet`` batchUpdate.

        Fail-soft: if metadata can't be read, log and return so the subsequent
        append surfaces the real error rather than masking it here.
        """
        try:
            meta = service.spreadsheets().get(spreadsheetId=self.sheet_id).execute()
            titles = [
                sheet["properties"]["title"]
                for sheet in meta.get("sheets", [])
                if "properties" in sheet and "title" in sheet["properties"]
            ]
        except Exception as exc:  # noqa: BLE001 -- fail soft; let append surface errors
            logger.warning(
                "Could not read spreadsheet metadata to ensure tab %r exists: %s",
                sheet_name,
                exc,
            )
            return

        if sheet_name in titles:
            return

        service.spreadsheets().batchUpdate(
            spreadsheetId=self.sheet_id,
            body={"requests": [{"addSheet": {"properties": {"title": sheet_name}}}]},
        ).execute()

    def _tab_is_empty(self, service, sheet_name: str) -> bool:
        """Return True if ``sheet_name`` has no existing rows in column A.

        Fail-soft: on a read error, assume the tab is NOT empty so we never
        inject a spurious header into a tab that already has data.
        """
        try:
            result = (
                service.spreadsheets()
                .values()
                .get(spreadsheetId=self.sheet_id, range=f"{sheet_name}!A1:A1")
                .execute()
            )
        except Exception as exc:  # noqa: BLE001 -- fail soft
            logger.warning(
                "Could not probe tab %r for emptiness; assuming non-empty: %s",
                sheet_name,
                exc,
            )
            return False

        values = result.get("values")
        # The REAL Sheets API OMITS the 'values' key entirely for an empty
        # range (e.g. {'range': 'Articles!A1', 'majorDimension': 'ROWS'}), so a
        # missing key means the tab is genuinely empty.
        if values is None:
            return True
        # Defensive: any unexpected, non-list shape -> assume non-empty so we
        # never inject a header into a tab that already has data.
        if not isinstance(values, list):
            return False
        # 'values' present but [] -> empty; present with rows -> non-empty.
        return len(values) == 0

    # -- cross-run dedup ------------------------------------------------

    def existing_urls(self, sheet_name: str = "Articles") -> set:
        """Return the set of article URLs already present in ``sheet_name``.

        Reads the URL column (column C, derived from ``COLUMNS.index("URL")``
        so reordering COLUMNS can't silently misalign it) and returns every
        non-empty cell value, excluding the header cell (the first value if it
        equals "URL"). Used by the pipeline to skip articles already exported
        on a previous run (RSS feeds keep the same recent items for days).

        Fail-soft: on any read error this logs a warning and returns an EMPTY
        set. That deliberately risks re-appending a duplicate rather than
        silently treating every article as already-present (which a non-empty
        fallback could do) and dropping a whole run's worth of new articles --
        losing data is worse than a recoverable duplicate.
        """
        url_index = self.COLUMNS.index("URL")
        column_letter = chr(ord("A") + url_index)
        cell_range = f"{sheet_name}!{column_letter}:{column_letter}"

        try:
            service = self._get_service()
            result = (
                service.spreadsheets()
                .values()
                .get(spreadsheetId=self.sheet_id, range=cell_range)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001 -- fail soft; never drop new data
            logger.warning(
                "Could not read existing URLs from %r; assuming none present "
                "(may re-append duplicates): %s",
                sheet_name,
                exc,
            )
            return set()

        # The REAL Sheets API OMITS the 'values' key entirely for an empty
        # range (same contract as _tab_is_empty), so a missing key => no URLs.
        rows = result.get("values")
        if not rows:
            return set()

        urls: set = set()
        for row in rows:
            if not row:
                continue
            value = row[0]
            if not value:
                continue
            if value == "URL":  # skip the header cell
                continue
            urls.add(value)
        return urls

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
