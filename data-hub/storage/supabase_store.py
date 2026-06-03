"""Supabase/Postgres-backed :class:`ArticleStore` for the Content Trend Data Hub.

This is a drop-in alternative to :class:`~storage.article_store.SqliteArticleStore`.
The pipelines depend only on the :class:`~storage.article_store.ArticleStore`
interface, so swapping the local SQLite file for a managed Postgres (Supabase)
backend is a configuration change -- the return shapes here match the SQLite
store EXACTLY (especially the upsert ``{inserted, skipped, promoted}`` contract).

Design
------
* **Lazy client.** The constructor never builds a client or touches the
  network -- it only records the url/key (read from ``SUPABASE_URL`` /
  ``SUPABASE_SERVICE_KEY`` env when not passed). The client is built on first
  use via :meth:`_client`, which is also the single mockable seam: tests patch
  ``store._client`` with a fake. The ``supabase`` import is *inside* that
  method so the whole module (and the test suite) imports fine even if the
  package isn't installed.
* **Schema is managed by Supabase migrations.** :meth:`init_schema` is a no-op
  (the ``content_hub_articles`` / ``content_hub_runs`` tables already exist),
  so it never raises.
* **Chunking + pagination.** PostgREST caps URL length and row counts, so the
  ``in_`` existence probe is chunked (<=100 keys/request), inserts are chunked
  (<=500 rows/request), and full scans paginate with ``.range`` (~1000/page).
* **Serialization reuse.** trend_signals (list) <-> JSON text string and the
  ``thailand_focus`` level normalization reuse the SAME helpers as the SQLite
  store, so a row round-trips identically across backends.
* **Fail-soft** where the SQLite store is (e.g. a read error in
  ``existing_normalized_urls`` -> empty set; a runs-ledger failure never
  crashes a run).

Schema (created via migration in the WNLQ9 SEO Automation Supabase project):

* ``content_hub_articles``: id (identity pk), url_normalized (text unique),
  the 17 article fields (text), kind (text default 'live'), enriched (smallint
  default 0), ingested_at (timestamptz default now()). trend_signals is stored
  as a JSON **text** string, same as SQLite.
* ``content_hub_runs``: id, ran_at (timestamptz default now()), collected,
  inserted, exported (int), errors (text), kind (text).
"""

from __future__ import annotations

import logging
import os
from typing import Dict, List, Optional, Set

from collectors.url_utils import normalize_url
from storage.article_store import (
    ARTICLE_FIELDS,
    ArticleStore,
    SqliteArticleStore,
)

logger = logging.getLogger(__name__)

# PostgREST limits: the ``in_`` filter is sent in the URL, so chunk the key
# probe to keep the URL short; chunk inserts so one request isn't enormous; and
# a single SELECT caps at ~1000 rows, so paginate full scans with .range.
_IN_CHUNK = 100
_INSERT_CHUNK = 500
_PAGE_SIZE = 1000

# Columns update_article may write (the schema fields plus the enriched flag),
# mirroring SqliteArticleStore._UPDATABLE_FIELDS.
_UPDATABLE_FIELDS = set(ARTICLE_FIELDS) | {"enriched"}


def _chunked(seq, size):
    """Yield successive ``size``-length chunks of ``seq``."""
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


class SupabaseArticleStore(ArticleStore):
    """Supabase/Postgres :class:`ArticleStore` (optional, env-gated backend)."""

    def __init__(
        self,
        url: Optional[str] = None,
        key: Optional[str] = None,
        table: str = "content_hub_articles",
        runs_table: str = "content_hub_runs",
    ) -> None:
        # Read creds from env when not passed. We deliberately do NOT build a
        # client here -- construction must be side-effect free and require no
        # creds/network (tests construct freely; the client is lazy).
        self.url = url if url is not None else os.environ.get("SUPABASE_URL")
        self.key = key if key is not None else os.environ.get("SUPABASE_SERVICE_KEY")
        self.table = table
        self.runs_table = runs_table
        self._cached_client = None

    # -- lazy client (the single mockable seam) -------------------------

    def _client(self):
        """Build (once) and return the supabase client.

        The ``supabase`` import lives here so the module imports even when the
        package isn't installed; only an actual call needs it. Tests patch this
        method to inject a fake client, so they never import supabase or touch
        the network.
        """
        if self._cached_client is None:
            if not self.url or not self.key:
                raise RuntimeError(
                    "SupabaseArticleStore needs SUPABASE_URL and "
                    "SUPABASE_SERVICE_KEY (env or constructor args)."
                )
            from supabase import create_client  # lazy: optional dependency

            self._cached_client = create_client(self.url, self.key)
        return self._cached_client

    def _articles(self):
        """The articles-table query builder for a fresh request."""
        return self._client().table(self.table)

    def _runs(self):
        """The runs-table query builder for a fresh request."""
        return self._client().table(self.runs_table)

    # -- schema ---------------------------------------------------------

    def init_schema(self) -> None:
        """No-op: schema is managed by Supabase migrations (never raises)."""
        # The tables already exist; nothing to create. We intentionally do NOT
        # touch the network here so callers can run init_schema() cheaply.
        return None

    # -- serialization (reuse the SQLite store's rules) -----------------

    @staticmethod
    def _serialize(field: str, value):
        """Serialize one article field for storage (same rules as SQLite)."""
        return SqliteArticleStore._serialize(field, value)

    @staticmethod
    def _deserialize_row(row: Dict) -> Dict:
        """Turn a stored row dict back into an article dict.

        Mirrors :meth:`SqliteArticleStore._deserialize_row` but reads from a
        plain dict (PostgREST returns JSON objects, not sqlite3.Row).
        """
        import json

        article: Dict = {}
        for field in ARTICLE_FIELDS:
            value = row.get(field)
            if field == "trend_signals":
                if isinstance(value, list):
                    article[field] = value
                else:
                    try:
                        article[field] = json.loads(value) if value else []
                    except (ValueError, TypeError):
                        article[field] = []
            elif field == "thailand_focus":
                article[field] = value if value else ""
            else:
                article[field] = value if value is not None else ""
        return article

    def _row_for_insert(self, article: Dict, key: str, kind: str) -> Dict:
        """Build the full column payload for an INSERT (incl kind, enriched)."""
        row: Dict = {"url_normalized": key}
        for field in ARTICLE_FIELDS:
            row[field] = self._serialize(field, article.get(field))
        row["kind"] = kind
        row["enriched"] = 0
        return row

    # -- upsert ---------------------------------------------------------

    def upsert_articles(self, articles: List[Dict], kind: str = "live") -> Dict:
        """Insert new articles (keyed by normalized URL); skip/promote known.

        Returns ``{"inserted": [new dicts], "skipped": int, "promoted":
        [dicts]}`` -- identical shape to the SQLite store. Steps:

        1. Compute the normalized URL per article, drop blanks, dedupe within
           the batch (keep the first occurrence).
        2. Probe which of those URLs already exist (chunked ``in_`` SELECT of
           url_normalized + kind).
        3. Partition into new vs existing.
        4. Insert the new rows (chunked).
        5. Promote any existing ``kind='backfill'`` row to ``'live'`` when the
           incoming kind is ``'live'`` (never demote live->backfill).
        """
        kind = str(kind or "live")
        inserted: List[Dict] = []
        promoted: List[Dict] = []
        skipped = 0

        # 1. Normalize + dedupe within the batch (keep first).
        ordered_keys: List[str] = []
        by_key: Dict[str, Dict] = {}
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
            if key in by_key:
                # Duplicate within this batch -> first wins, drop the rest.
                continue
            by_key[key] = article
            ordered_keys.append(key)

        if not ordered_keys:
            return {"inserted": inserted, "skipped": skipped, "promoted": promoted}

        # 2. Probe existing rows (chunked in_ to keep the URL short).
        existing_kind: Dict[str, str] = {}
        for chunk in _chunked(ordered_keys, _IN_CHUNK):
            resp = (
                self._articles()
                .select("url_normalized,kind")
                .in_("url_normalized", chunk)
                .execute()
            )
            for row in (resp.data or []):
                existing_kind[row["url_normalized"]] = row.get("kind") or "live"

        # 3. Partition.
        new_keys = [k for k in ordered_keys if k not in existing_kind]
        existing_keys = [k for k in ordered_keys if k in existing_kind]

        # 4. Insert new rows (chunked).
        if new_keys:
            rows = [
                self._row_for_insert(by_key[k], k, kind) for k in new_keys
            ]
            for chunk in _chunked(rows, _INSERT_CHUNK):
                self._articles().insert(chunk).execute()
            inserted = [by_key[k] for k in new_keys]

        # 5. Promotion / skip accounting for existing rows.
        for k in existing_keys:
            stored_kind = existing_kind.get(k)
            if kind == "live" and stored_kind == "backfill":
                self._articles().update({"kind": "live"}).eq(
                    "url_normalized", k
                ).execute()
                promoted.append(by_key[k])
            else:
                skipped += 1

        return {"inserted": inserted, "skipped": skipped, "promoted": promoted}

    # -- lookups --------------------------------------------------------

    def exists(self, url: str) -> bool:
        """True if ``url`` (normalized) is already stored."""
        key = normalize_url(url) if url else None
        if not key:
            return False
        resp = (
            self._articles()
            .select("url_normalized")
            .eq("url_normalized", key)
            .limit(1)
            .execute()
        )
        return bool(resp.data)

    def existing_normalized_urls(self) -> Set[str]:
        """Return every stored normalized URL (paginated). Fail-soft -> set()."""
        urls: Set[str] = set()
        try:
            offset = 0
            while True:
                resp = (
                    self._articles()
                    .select("url_normalized")
                    .range(offset, offset + _PAGE_SIZE - 1)
                    .execute()
                )
                rows = resp.data or []
                for row in rows:
                    u = row.get("url_normalized")
                    if u:
                        urls.add(u)
                if len(rows) < _PAGE_SIZE:
                    break
                offset += _PAGE_SIZE
        except Exception as exc:  # noqa: BLE001 -- never drop new articles
            logger.error("Failed to read existing normalized urls: %s", exc)
            return set()
        return urls

    # -- query / count --------------------------------------------------

    def _apply_filters(
        self, q, vertical, thailand_focus, since, until, kind, beverage_relevance
    ):
        """Apply the shared filter mapping to a query builder, return it."""
        if vertical is not None:
            q = q.eq("primary_category", str(vertical))
        if thailand_focus is not None:
            q = q.eq("thailand_focus", str(thailand_focus))
        if beverage_relevance is not None:
            q = q.eq("beverage_relevance", str(beverage_relevance))
        if kind is not None:
            q = q.eq("kind", str(kind))
        if since is not None:
            q = q.gte("published_date", str(since))
        if until is not None:
            q = q.lte("published_date", str(until))
        return q

    def query(
        self,
        *,
        vertical: Optional[str] = None,
        thailand_focus: Optional[str] = None,
        since: Optional[str] = None,
        until: Optional[str] = None,
        limit: Optional[int] = None,
        kind: Optional[str] = None,
        beverage_relevance: Optional[str] = None,
    ) -> List[Dict]:
        """Filtered fetch of stored articles, newest published first."""
        q = self._articles().select("*")
        q = self._apply_filters(
            q, vertical, thailand_focus, since, until, kind, beverage_relevance
        )
        q = q.order("published_date", desc=True)
        if limit is not None:
            q = q.limit(int(limit))
        resp = q.execute()
        return [self._deserialize_row(row) for row in (resp.data or [])]

    def count(self, **filters) -> int:
        """Count stored articles (exact, head-only), query-compatible kwargs."""
        q = self._articles().select("id", count="exact")
        q = self._apply_filters(
            q,
            filters.get("vertical"),
            filters.get("thailand_focus"),
            filters.get("since"),
            filters.get("until"),
            filters.get("kind"),
            filters.get("beverage_relevance"),
        )
        resp = q.execute()
        return int(resp.count or 0)

    # -- update / enrichment --------------------------------------------

    def update_article(self, url_normalized: str, fields: Dict) -> bool:
        """Update known columns on the row keyed by ``url_normalized``.

        Serializes with the same rules as insert; ignores unknown keys.
        Returns True if a row matched, False otherwise (or nothing to set).
        """
        if not url_normalized or not isinstance(fields, dict):
            return False

        payload: Dict = {}
        for field, value in fields.items():
            if field not in _UPDATABLE_FIELDS:
                continue
            if field == "enriched":
                payload[field] = 1 if value else 0
            else:
                payload[field] = self._serialize(field, value)

        if not payload:
            return False

        resp = (
            self._articles()
            .update(payload)
            .eq("url_normalized", url_normalized)
            .execute()
        )
        # PostgREST returns the updated rows in .data; non-empty == matched.
        return bool(resp.data)

    def iter_articles_missing_excerpt(
        self, limit: Optional[int] = None
    ) -> List[Dict]:
        """Articles with an empty excerpt that aren't enriched yet.

        Selects rows where ``content_excerpt`` is null/'' AND ``enriched`` is
        0 (treating null as 0). Each returned dict carries ``url_normalized``
        so the caller can write back via :meth:`update_article`.
        """
        q = (
            self._articles()
            .select("*")
            # content_excerpt is null OR empty string.
            .or_("content_excerpt.is.null,content_excerpt.eq.")
            # enriched is 0 OR null (never re-process a completed pass).
            .or_("enriched.eq.0,enriched.is.null")
            .order("id", desc=False)
        )
        if limit is not None:
            q = q.limit(int(limit))
        resp = q.execute()
        articles: List[Dict] = []
        for row in (resp.data or []):
            article = self._deserialize_row(row)
            article["url_normalized"] = row.get("url_normalized")
            articles.append(article)
        return articles

    # -- runs ledger ----------------------------------------------------

    def record_run(self, summary: Dict) -> None:
        """Append a run summary to the runs ledger (fail-soft)."""
        errors = summary.get("errors") or []
        if isinstance(errors, (list, tuple)):
            errors_text = "; ".join(str(e) for e in errors)
        else:
            errors_text = str(errors)

        row = {
            "collected": int(summary.get("collected", 0) or 0),
            "inserted": int(
                summary.get("db_inserted", summary.get("inserted", 0)) or 0
            ),
            "exported": int(summary.get("exported", 0) or 0),
            "errors": errors_text,
            "kind": summary.get("kind", "ingest"),
        }
        try:
            self._runs().insert(row).execute()
        except Exception as exc:  # noqa: BLE001 -- ledger must never crash a run
            logger.error("Failed to record run in Supabase ledger: %s", exc)
