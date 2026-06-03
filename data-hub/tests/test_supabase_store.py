"""Tests for the Supabase/Postgres ArticleStore, written TDD-first.

:class:`~storage.supabase_store.SupabaseArticleStore` is a drop-in
:class:`~storage.article_store.ArticleStore` over Supabase/Postgres: it MUST
return the exact same shapes as the SQLite store (especially the upsert
``{inserted, skipped, promoted}`` contract) so the pipelines work unchanged.

These tests NEVER touch the network or a real Supabase project. The lazy
``_client()`` seam is patched with a MagicMock that emulates the supabase-py
query-builder chain (``.table().select().in_().execute()`` -> ``.data``,
``.insert().execute()``, ``.update().eq().execute()``, count). Construction
must work with no env/creds (the constructor must not build a client).
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock

import pytest

from collectors.url_utils import normalize_url
from storage.article_store import ARTICLE_FIELDS, ArticleStore
from storage.supabase_store import SupabaseArticleStore


def _article(url, **overrides):
    """Build a minimal schema-conforming article dict for the store."""
    article = {
        "source_name": "Test Source",
        "article_url": url,
        "title": "A wine story",
        "published_date": "2026-05-30T09:00:00Z",
        "author": "Jane Doe",
        "content_excerpt": "Bordeaux vintage report",
        "content_type": "news",
        "topic_region": "France",
        "spirits_type": "",
        "trend_signals": ["premiumization", "low-abv"],
        "primary_category": "wine",
        "buyer_persona": "collector",
        "aeo_citation_opportunity": "high",
        "collected_date": "2026-05-31T00:00:00Z",
        "source_language": "en",
        "thailand_focus": "",
        "beverage_relevance": "",
    }
    article.update(overrides)
    return article


class FakeResponse:
    """Mimics a supabase-py APIResponse: ``.data`` (list) and ``.count``."""

    def __init__(self, data=None, count=None):
        self.data = data if data is not None else []
        self.count = count


class FakeQuery:
    """A chainable fake of the postgrest query builder.

    Records the operation kind + filters so tests can assert the filter
    mapping, and returns a configured FakeResponse on ``.execute()``. Every
    builder method returns ``self`` so the call chain works regardless of
    order.
    """

    def __init__(self, table):
        self.table = table
        self.op = None
        self.payload = None
        self.filters = []  # list of (method, *args)
        self.in_filter = None
        self.range_called = []
        self._response = FakeResponse()

    # -- builder verbs --------------------------------------------------
    def select(self, *args, **kwargs):
        self.op = "select"
        self.select_args = args
        self.select_kwargs = kwargs
        return self

    def insert(self, payload):
        self.op = "insert"
        self.payload = payload
        return self

    def update(self, payload):
        self.op = "update"
        self.payload = payload
        return self

    # -- filters --------------------------------------------------------
    def eq(self, col, val):
        self.filters.append(("eq", col, val))
        return self

    def gte(self, col, val):
        self.filters.append(("gte", col, val))
        return self

    def lte(self, col, val):
        self.filters.append(("lte", col, val))
        return self

    def in_(self, col, vals):
        self.in_filter = (col, list(vals))
        self.filters.append(("in", col, list(vals)))
        return self

    def or_(self, expr):
        self.filters.append(("or", expr))
        return self

    def is_(self, col, val):
        self.filters.append(("is", col, val))
        return self

    def order(self, col, **kwargs):
        self.filters.append(("order", col))
        return self

    def limit(self, n):
        self.filters.append(("limit", n))
        return self

    def range(self, start, end):
        self.range_called.append((start, end))
        return self

    def execute(self):
        return self._response


class FakeClient:
    """A fake supabase client whose ``.table(name)`` returns a FakeQuery.

    A ``table_responses`` map lets a test pre-seed which FakeResponse each
    *operation* on a table returns; otherwise an empty response is used. The
    builders created per ``.table()`` call are recorded in ``queries`` for
    assertions.
    """

    def __init__(self):
        self.queries = []
        # Map of (table, op) -> list of FakeResponse (popped FIFO), or
        # (table, op) -> FakeResponse (reused).
        self.responder = None

    def table(self, name):
        q = FakeQuery(name)
        self.queries.append(q)
        if self.responder is not None:
            self.responder(q)
        return q


def _store_with_client(client):
    """A SupabaseArticleStore whose lazy ``_client()`` returns ``client``."""
    store = SupabaseArticleStore(url="https://x.supabase.co", key="svc-key")
    store._client = MagicMock(return_value=client)
    return store


# -- interface / construction ------------------------------------------------


def test_supabase_store_is_an_article_store():
    """SupabaseArticleStore implements the ArticleStore interface."""
    assert issubclass(SupabaseArticleStore, ArticleStore)


def test_construction_without_env_or_creds_no_network(monkeypatch):
    """Constructing the store must not build a client or touch the network."""
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    # No exception, no client built (the import is lazy inside _client()).
    store = SupabaseArticleStore()
    assert store.url is None
    assert store.key is None
    assert store._cached_client is None


def test_construction_reads_env(monkeypatch):
    """url/key default to SUPABASE_URL / SUPABASE_SERVICE_KEY env vars."""
    monkeypatch.setenv("SUPABASE_URL", "https://env.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "env-key")
    store = SupabaseArticleStore()
    assert store.url == "https://env.supabase.co"
    assert store.key == "env-key"


def test_init_schema_is_noop_no_raise():
    """init_schema is a no-op (schema managed by migrations); never raises."""
    store = SupabaseArticleStore(url="https://x.supabase.co", key="k")
    # Must not build a client / touch network just to "init".
    store.init_schema()


# -- upsert: partitioning, insert, skip --------------------------------------


def test_upsert_partitions_new_vs_existing():
    """New rows are inserted+returned; existing rows are skipped."""
    client = FakeClient()
    a_new = _article("https://site.test/new")
    a_exist = _article("https://site.test/exist")
    key_exist = normalize_url("https://site.test/exist")

    def responder(q):
        if q.table == "content_hub_articles":
            # select existing -> only the "exist" url is present (kind live)
            def _exec():
                if q.op == "select":
                    return FakeResponse(
                        data=[{"url_normalized": key_exist, "kind": "live"}]
                    )
                return FakeResponse(data=[])
            q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    result = store.upsert_articles([a_new, a_exist], kind="live")

    assert len(result["inserted"]) == 1
    assert result["inserted"][0]["article_url"] == "https://site.test/new"
    assert result["skipped"] == 1
    assert result["promoted"] == []


def test_upsert_dedupes_within_batch_keeps_first():
    """Duplicate normalized URLs within the batch insert once (first kept)."""
    client = FakeClient()
    inserts = []

    def responder(q):
        def _exec():
            if q.op == "select":
                return FakeResponse(data=[])
            if q.op == "insert":
                inserts.append(q.payload)
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    a1 = _article("https://site.test/a", title="first")
    a2 = _article("https://site.test/a/", title="dup-trailing-slash")
    result = store.upsert_articles([a1, a2], kind="live")

    assert len(result["inserted"]) == 1
    assert result["inserted"][0]["title"] == "first"
    # Exactly one row reached the insert payload.
    flat = [row for batch in inserts for row in batch]
    assert len(flat) == 1


def test_upsert_skips_blank_urls():
    """Articles without a usable URL are dropped (not inserted)."""
    client = FakeClient()

    def responder(q):
        def _exec():
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    result = store.upsert_articles(
        [_article(""), {"title": "no url"}, "notadict"], kind="live"
    )
    assert result["inserted"] == []
    assert result["promoted"] == []


# -- promotion ---------------------------------------------------------------


def test_upsert_promotes_backfill_to_live():
    """An existing backfill row re-upserted as live is promoted, not skipped."""
    client = FakeClient()
    key = normalize_url("https://site.test/p")
    updates = []

    def responder(q):
        def _exec():
            if q.op == "select":
                return FakeResponse(data=[{"url_normalized": key, "kind": "backfill"}])
            if q.op == "update":
                updates.append((q.payload, list(q.filters)))
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    result = store.upsert_articles([_article("https://site.test/p")], kind="live")

    assert result["inserted"] == []
    assert len(result["promoted"]) == 1
    assert result["skipped"] == 0
    # The promotion issued an update to kind='live' keyed by url_normalized.
    assert updates, "expected an UPDATE for the promotion"
    payload, filters = updates[0]
    assert payload.get("kind") == "live"
    assert ("eq", "url_normalized", key) in filters


def test_upsert_does_not_demote_live_to_backfill():
    """A backfill upsert of an existing live row never demotes it."""
    client = FakeClient()
    key = normalize_url("https://site.test/live")
    updates = []

    def responder(q):
        def _exec():
            if q.op == "select":
                return FakeResponse(data=[{"url_normalized": key, "kind": "live"}])
            if q.op == "update":
                updates.append(q.payload)
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    result = store.upsert_articles([_article("https://site.test/live")], kind="backfill")

    assert result["inserted"] == []
    assert result["promoted"] == []
    assert result["skipped"] == 1
    assert updates == []  # no demotion update issued


def test_upsert_no_promotion_on_backfill_of_existing_backfill():
    """Re-upserting an existing backfill row as backfill just skips it."""
    client = FakeClient()
    key = normalize_url("https://site.test/b")

    def responder(q):
        def _exec():
            if q.op == "select":
                return FakeResponse(data=[{"url_normalized": key, "kind": "backfill"}])
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    result = store.upsert_articles([_article("https://site.test/b")], kind="backfill")
    assert result["inserted"] == []
    assert result["promoted"] == []
    assert result["skipped"] == 1


# -- trend_signals JSON round-trip -------------------------------------------


def test_insert_serializes_trend_signals_to_json_string():
    """trend_signals (a list) is serialized to a JSON text string on insert."""
    client = FakeClient()
    inserts = []

    def responder(q):
        def _exec():
            if q.op == "select":
                return FakeResponse(data=[])
            if q.op == "insert":
                inserts.append(q.payload)
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    store.upsert_articles(
        [_article("https://site.test/t", trend_signals=["a", "b"])], kind="live"
    )
    row = inserts[0][0]
    assert isinstance(row["trend_signals"], str)
    assert json.loads(row["trend_signals"]) == ["a", "b"]
    assert row["kind"] == "live"
    assert row["enriched"] == 0
    assert row["url_normalized"] == normalize_url("https://site.test/t")


def test_query_deserializes_trend_signals_to_list():
    """query() turns the stored JSON string back into a list."""
    client = FakeClient()
    stored = {f: "" for f in ARTICLE_FIELDS}
    stored["article_url"] = "https://site.test/q"
    stored["trend_signals"] = json.dumps(["x", "y"])
    stored["url_normalized"] = normalize_url("https://site.test/q")

    def responder(q):
        def _exec():
            return FakeResponse(data=[dict(stored)])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    rows = store.query(vertical="wine")
    assert rows[0]["trend_signals"] == ["x", "y"]


# -- query filter mapping ----------------------------------------------------


def test_query_maps_filters():
    """query maps vertical->primary_category eq, since->gte, until->lte, etc."""
    client = FakeClient()

    def responder(q):
        def _exec():
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    store.query(
        vertical="wine",
        thailand_focus="high",
        kind="live",
        beverage_relevance="medium",
        since="2026-01-01",
        until="2026-12-31",
        limit=5,
    )
    q = client.queries[-1]
    fs = q.filters
    assert ("eq", "primary_category", "wine") in fs
    assert ("eq", "thailand_focus", "high") in fs
    assert ("eq", "kind", "live") in fs
    assert ("eq", "beverage_relevance", "medium") in fs
    assert ("gte", "published_date", "2026-01-01") in fs
    assert ("lte", "published_date", "2026-12-31") in fs


# -- count -------------------------------------------------------------------


def test_count_uses_exact_count():
    """count() returns the exact count from the head-only count query."""
    client = FakeClient()

    def responder(q):
        def _exec():
            return FakeResponse(data=[], count=42)
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    assert store.count(vertical="wine") == 42
    q = client.queries[-1]
    assert q.select_kwargs.get("count") == "exact"
    assert ("eq", "primary_category", "wine") in q.filters


# -- exists / existing_normalized_urls ---------------------------------------


def test_exists_true_and_false():
    client = FakeClient()
    key = normalize_url("https://site.test/e")

    state = {"present": True}

    def responder(q):
        def _exec():
            if state["present"]:
                return FakeResponse(data=[{"url_normalized": key}])
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    assert store.exists("https://site.test/e") is True
    state["present"] = False
    assert store.exists("https://site.test/e") is False
    assert store.exists("") is False


def test_existing_normalized_urls_paginates():
    """existing_normalized_urls pages with .range and returns the full set."""
    client = FakeClient()
    page1 = [{"url_normalized": f"u{i}"} for i in range(1000)]
    page2 = [{"url_normalized": f"u{i}"} for i in range(1000, 1500)]
    pages = [page1, page2, []]

    def responder(q):
        def _exec():
            return FakeResponse(data=pages.pop(0))
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    urls = store.existing_normalized_urls()
    assert len(urls) == 1500
    assert "u0" in urls and "u1499" in urls


def test_existing_normalized_urls_failsoft_on_error():
    """A read error yields an empty set (matches SQLite fail-soft contract)."""
    client = MagicMock()
    client.table.side_effect = RuntimeError("boom")
    store = _store_with_client(client)
    assert store.existing_normalized_urls() == set()


# -- update_article ----------------------------------------------------------


def test_update_article_serializes_and_returns_true_on_match():
    client = FakeClient()
    key = normalize_url("https://site.test/u")
    updates = []

    def responder(q):
        def _exec():
            if q.op == "update":
                updates.append((q.payload, list(q.filters)))
                return FakeResponse(data=[{"url_normalized": key}])
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    ok = store.update_article(
        key, {"trend_signals": ["z"], "enriched": True, "thailand_focus": "HIGH"}
    )
    assert ok is True
    payload, filters = updates[0]
    assert json.loads(payload["trend_signals"]) == ["z"]
    assert payload["enriched"] == 1
    assert payload["thailand_focus"] == "high"
    assert ("eq", "url_normalized", key) in filters


def test_update_article_returns_false_when_no_row():
    client = FakeClient()

    def responder(q):
        def _exec():
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    assert store.update_article("nope", {"title": "x"}) is False


def test_update_article_rejects_unknown_only_fields():
    """No known columns -> no update issued, returns False."""
    client = FakeClient()
    calls = []

    def responder(q):
        def _exec():
            calls.append(q.op)
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    assert store.update_article("k", {"bogus": 1}) is False
    assert "update" not in calls


# -- record_run --------------------------------------------------------------


def test_record_run_inserts_mapped_row():
    client = FakeClient()
    inserts = []

    def responder(q):
        def _exec():
            if q.op == "insert":
                inserts.append((q.table, q.payload))
            return FakeResponse(data=[])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    store.record_run(
        {
            "collected": 10,
            "db_inserted": 4,
            "exported": 4,
            "errors": ["a", "b"],
            "kind": "ingest",
        }
    )
    assert inserts, "expected a runs insert"
    table, payload = inserts[0]
    assert table == "content_hub_runs"
    if isinstance(payload, list):
        payload = payload[0]
    assert payload["collected"] == 10
    assert payload["inserted"] == 4
    assert payload["exported"] == 4
    assert payload["kind"] == "ingest"
    assert "a; b" == payload["errors"]


def test_record_run_failsoft():
    """A runs-ledger insert error never raises."""
    client = MagicMock()
    client.table.side_effect = RuntimeError("boom")
    store = _store_with_client(client)
    store.record_run({"collected": 1})  # must not raise


# -- iter_articles_missing_excerpt -------------------------------------------


def test_iter_articles_missing_excerpt_filters_and_carries_url():
    client = FakeClient()
    key = normalize_url("https://site.test/m")
    stored = {f: "" for f in ARTICLE_FIELDS}
    stored["article_url"] = "https://site.test/m"
    stored["trend_signals"] = json.dumps([])
    stored["url_normalized"] = key

    def responder(q):
        def _exec():
            return FakeResponse(data=[dict(stored)])
        q.execute = _exec

    client.responder = responder
    store = _store_with_client(client)

    rows = store.iter_articles_missing_excerpt(limit=10)
    assert rows[0]["url_normalized"] == key
    # Filtered on empty content_excerpt + not-enriched (or_/is_ on the query).
    q = client.queries[-1]
    methods = [f[0] for f in q.filters]
    assert "or" in methods or "is" in methods or "eq" in methods
