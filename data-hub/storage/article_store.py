"""The article store: system-of-record for the Content Trend Data Hub.

Historically the Google Sheet was BOTH the store and the dedup index -- every
run read the entire URL column to decide what was new. That caps growth at the
Sheets 10M-cell ceiling and can't do joins or time-series. This module moves
the source of truth into an indexed local SQLite database; Google Sheets is
demoted to a read-only mirror/view so the existing dashboards keep working.

Design
------
* :class:`ArticleStore` is an abstract interface. The pipelines depend only on
  it, so swapping SQLite for Supabase/Postgres later is a drop-in: implement
  the same methods against the new backend, inject it, done.
* :class:`SqliteArticleStore` is the concrete backend. It is lazy-connecting
  (the constructor never opens a file or touches the network), supports
  ``:memory:`` and temp paths for tests, and dedups on the SAME normalized-URL
  key the rest of the codebase uses (:func:`collectors.url_utils.normalize_url`)
  so a trailing slash / utm param can't slip a duplicate past it.
* Fail-soft: a single malformed article never crashes an ``upsert`` batch --
  it is skipped and logged, mirroring the rest of the pipeline.
"""

from __future__ import annotations

import json
import logging
import sqlite3
import threading
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set

from collectors.url_utils import normalize_url

logger = logging.getLogger(__name__)

# The 16 schema fields (snake_case), confirmed against
# SheetsExporter._FIELD_BY_COLUMN. Order here defines the articles-table
# column order. ``trend_signals`` is the only list-valued field; it is stored
# as JSON text and round-tripped back to a list on read.
ARTICLE_FIELDS: List[str] = [
    "source_name",
    "article_url",
    "title",
    "published_date",
    "author",
    "content_excerpt",
    "content_type",
    "topic_region",
    "spirits_type",
    "trend_signals",
    "primary_category",
    "buyer_persona",
    "aeo_citation_opportunity",
    "collected_date",
    "source_language",
    "thailand_focus",
]


class ArticleStore(ABC):
    """Interface every article backend must implement (the seam for swapping
    SQLite out for Supabase/Postgres in the future).
    """

    @abstractmethod
    def init_schema(self) -> None:
        """Create the backing tables/indexes if absent. Idempotent."""

    @abstractmethod
    def upsert_articles(self, articles: List[Dict]) -> Dict:
        """Insert each article keyed by normalized URL.

        Returns ``{"inserted": [<new article dicts>], "skipped": <int>}``.
        Articles already present (by normalized URL) are skipped. The returned
        ``inserted`` list lets the caller mirror ONLY the new rows to Sheets.
        """

    @abstractmethod
    def exists(self, url: str) -> bool:
        """True if ``url`` (after normalization) is already stored."""

    @abstractmethod
    def existing_normalized_urls(self) -> Set[str]:
        """Return the set of all stored normalized URLs."""

    @abstractmethod
    def query(
        self,
        *,
        vertical: Optional[str] = None,
        thailand_focus: Optional[bool] = None,
        since: Optional[str] = None,
        until: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        """Filtered fetch of stored articles as dicts."""

    @abstractmethod
    def count(self, **filters) -> int:
        """Count stored articles, optionally filtered (same kwargs as query)."""

    @abstractmethod
    def record_run(self, summary: Dict) -> None:
        """Append a row to the runs ledger for observability."""


class SqliteArticleStore(ArticleStore):
    """SQLite-backed :class:`ArticleStore` (the default system-of-record).

    Lazy-connecting: the constructor only records the path. The connection is
    opened on first use, so building the object is side-effect free (tests can
    construct it freely; ``:memory:`` and temp paths are supported).
    """

    def __init__(self, db_path: str = "data/content_hub.db") -> None:
        self.db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None
        # Guard the single shared connection (a daily cron is single-threaded,
        # but be safe if a caller ever shares a store across threads).
        self._lock = threading.Lock()

    # -- connection -----------------------------------------------------

    def _connect(self) -> sqlite3.Connection:
        """Open (once) and return the SQLite connection.

        ``:memory:`` databases must reuse a single connection or each new
        connection would see an empty database, so the connection is cached on
        the instance regardless of path.
        """
        if self._conn is None:
            self._conn = sqlite3.connect(
                self.db_path,
                check_same_thread=False,
            )
            self._conn.row_factory = sqlite3.Row
        return self._conn

    # -- schema ---------------------------------------------------------

    def init_schema(self) -> None:
        """Create the ``articles`` and ``runs`` tables + indexes if absent."""
        conn = self._connect()
        # Build the articles-column DDL from ARTICLE_FIELDS so the schema and
        # the field list can never drift apart.
        column_defs = []
        for field in ARTICLE_FIELDS:
            if field == "thailand_focus":
                # Stored as 0/1; keep INTEGER for clean boolean filtering.
                column_defs.append(f"{field} INTEGER")
            else:
                column_defs.append(f"{field} TEXT")
        columns_sql = ",\n                ".join(column_defs)

        with self._lock:
            conn.executescript(
                f"""
                CREATE TABLE IF NOT EXISTS articles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url_normalized TEXT UNIQUE NOT NULL,
                    {columns_sql},
                    ingested_at TEXT
                );

                CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_url_normalized
                    ON articles (url_normalized);
                CREATE INDEX IF NOT EXISTS idx_articles_published_date
                    ON articles (published_date);
                CREATE INDEX IF NOT EXISTS idx_articles_primary_category
                    ON articles (primary_category);
                CREATE INDEX IF NOT EXISTS idx_articles_thailand_focus
                    ON articles (thailand_focus);
                CREATE INDEX IF NOT EXISTS idx_articles_collected_date
                    ON articles (collected_date);
                CREATE INDEX IF NOT EXISTS idx_articles_source_name
                    ON articles (source_name);

                CREATE TABLE IF NOT EXISTS runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ran_at TEXT,
                    collected INTEGER,
                    inserted INTEGER,
                    exported INTEGER,
                    errors TEXT,
                    kind TEXT
                );
                """
            )
            conn.commit()

    # -- serialization --------------------------------------------------

    @staticmethod
    def _serialize(field: str, value):
        """Convert an article field value into a storable SQLite value."""
        if field == "trend_signals":
            if value is None:
                return json.dumps([])
            if isinstance(value, (list, tuple)):
                return json.dumps([str(v) for v in value])
            # A pre-joined string -> wrap as a single-element list for fidelity.
            return json.dumps([str(value)])
        if field == "thailand_focus":
            return 1 if value else 0
        if value is None:
            return ""
        return str(value)

    @staticmethod
    def _deserialize_row(row: sqlite3.Row) -> Dict:
        """Convert a stored row back into an article dict."""
        article: Dict = {}
        for field in ARTICLE_FIELDS:
            value = row[field]
            if field == "trend_signals":
                try:
                    article[field] = json.loads(value) if value else []
                except (ValueError, TypeError):
                    article[field] = []
            elif field == "thailand_focus":
                article[field] = bool(value)
            else:
                article[field] = value
        return article

    # -- upsert ---------------------------------------------------------

    def upsert_articles(self, articles: List[Dict]) -> Dict:
        """Insert new articles (keyed by normalized URL); skip known ones.

        Uses ``INSERT OR IGNORE`` on the unique ``url_normalized`` column
        within a single transaction. Whether a row was actually inserted is
        detected from ``cursor.rowcount`` (1 = inserted, 0 = ignored as a
        duplicate), so the returned ``inserted`` list is exactly the new rows.
        """
        conn = self._connect()
        inserted: List[Dict] = []
        skipped = 0

        insert_columns = ["url_normalized"] + ARTICLE_FIELDS + ["ingested_at"]
        placeholders = ", ".join(["?"] * len(insert_columns))
        sql = (
            f"INSERT OR IGNORE INTO articles ({', '.join(insert_columns)}) "
            f"VALUES ({placeholders})"
        )

        with self._lock:
            cursor = conn.cursor()
            for article in articles:
                if not isinstance(article, dict):
                    logger.warning("Skipping non-dict article: %r", article)
                    skipped += 1
                    continue

                raw_url = article.get("article_url")
                key = normalize_url(raw_url) if raw_url else None
                if not key:
                    logger.warning(
                        "Skipping article with no usable article_url: %r",
                        article.get("title", article),
                    )
                    skipped += 1
                    continue

                try:
                    values = [key]
                    for field in ARTICLE_FIELDS:
                        values.append(self._serialize(field, article.get(field)))
                    values.append(datetime.now(timezone.utc).isoformat())
                    cursor.execute(sql, values)
                except Exception as exc:  # noqa: BLE001 -- never crash a batch
                    logger.error(
                        "Failed to upsert article %r: %s",
                        article.get("article_url"),
                        exc,
                    )
                    skipped += 1
                    continue

                if cursor.rowcount == 1:
                    inserted.append(article)
                else:
                    # rowcount 0 -> the unique key already existed (ignored).
                    skipped += 1

            conn.commit()

        return {"inserted": inserted, "skipped": skipped}

    # -- lookups --------------------------------------------------------

    def exists(self, url: str) -> bool:
        """True if ``url`` (normalized) is already stored."""
        key = normalize_url(url) if url else None
        if not key:
            return False
        conn = self._connect()
        row = conn.execute(
            "SELECT 1 FROM articles WHERE url_normalized = ? LIMIT 1", (key,)
        ).fetchone()
        return row is not None

    def existing_normalized_urls(self) -> Set[str]:
        """Return every stored normalized URL (the dedup index)."""
        conn = self._connect()
        rows = conn.execute("SELECT url_normalized FROM articles").fetchall()
        return {row[0] for row in rows}

    # -- query / count --------------------------------------------------

    def _build_where(self, vertical, thailand_focus, since, until):
        """Build a WHERE clause + params from filter kwargs."""
        clauses: List[str] = []
        params: List = []
        if vertical is not None:
            clauses.append("primary_category = ?")
            params.append(str(vertical))
        if thailand_focus is not None:
            clauses.append("thailand_focus = ?")
            params.append(1 if thailand_focus else 0)
        if since is not None:
            clauses.append("published_date >= ?")
            params.append(str(since))
        if until is not None:
            clauses.append("published_date <= ?")
            params.append(str(until))
        where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
        return where, params

    def query(
        self,
        *,
        vertical: Optional[str] = None,
        thailand_focus: Optional[bool] = None,
        since: Optional[str] = None,
        until: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        """Filtered fetch of stored articles, newest published first."""
        conn = self._connect()
        where, params = self._build_where(vertical, thailand_focus, since, until)
        sql = f"SELECT * FROM articles{where} ORDER BY published_date DESC, id DESC"
        if limit is not None:
            sql += " LIMIT ?"
            params = params + [int(limit)]
        rows = conn.execute(sql, params).fetchall()
        return [self._deserialize_row(row) for row in rows]

    def count(self, **filters) -> int:
        """Count stored articles, optionally filtered (query-compatible kwargs)."""
        conn = self._connect()
        where, params = self._build_where(
            filters.get("vertical"),
            filters.get("thailand_focus"),
            filters.get("since"),
            filters.get("until"),
        )
        row = conn.execute(
            f"SELECT COUNT(*) FROM articles{where}", params
        ).fetchone()
        return int(row[0])

    # -- runs ledger ----------------------------------------------------

    def record_run(self, summary: Dict) -> None:
        """Append a run summary to the ``runs`` ledger (fail-soft).

        Accepts the pipeline summary dict; pulls the relevant counts. Tolerant
        of both ingest and backfill summaries. ``errors`` (a list) is stored as
        a joined string; ``kind`` defaults to 'ingest'.
        """
        conn = self._connect()
        errors = summary.get("errors") or []
        if isinstance(errors, (list, tuple)):
            errors_text = "; ".join(str(e) for e in errors)
        else:
            errors_text = str(errors)

        try:
            with self._lock:
                conn.execute(
                    "INSERT INTO runs (ran_at, collected, inserted, exported, "
                    "errors, kind) VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        datetime.now(timezone.utc).isoformat(),
                        int(summary.get("collected", 0) or 0),
                        int(summary.get("db_inserted", summary.get("inserted", 0)) or 0),
                        int(summary.get("exported", 0) or 0),
                        errors_text,
                        summary.get("kind", "ingest"),
                    ),
                )
                conn.commit()
        except Exception as exc:  # noqa: BLE001 -- ledger must never crash a run
            logger.error("Failed to record run in ledger: %s", exc)
