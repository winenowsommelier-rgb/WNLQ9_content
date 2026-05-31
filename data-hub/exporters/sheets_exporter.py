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
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

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
    # produced by :meth:`format_article_row`; do not reorder without also
    # updating the append range (A:O) and downstream consumers.
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
    }

    TREND_SIGNAL_SEPARATOR = " | "

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

    # -- formatting -----------------------------------------------------

    def header_row(self) -> List[str]:
        """Return the ordered column headers."""
        return list(self.COLUMNS)

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

        if include_header:
            rows = [self.header_row()] + rows

        # Nothing to send (and no header requested): skip the API entirely.
        if not rows:
            return {"exported": 0, "sheet": sheet_name}

        try:
            service = self._get_service()
            service.spreadsheets().values().append(
                spreadsheetId=self.sheet_id,
                range=f"{sheet_name}!A:O",
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": rows},
            ).execute()
        except Exception as exc:  # noqa: BLE001 -- fail soft, never crash pipeline
            logger.error("Google Sheets export failed: %s", exc)
            return {"exported": 0, "error": str(exc)}

        return {"exported": len(articles), "sheet": sheet_name}

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
