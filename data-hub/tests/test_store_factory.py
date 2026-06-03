"""Tests for the env-based store backend factory ``storage.get_store``.

The factory lets ops pick the backend without touching code: set
``DATA_HUB_DB_BACKEND=supabase`` plus the two Supabase creds to use the
managed Postgres backend; otherwise the hub stays on the default local SQLite
store. The pipelines use the factory when no store is injected (injection
still wins, so existing tests are unaffected).

No network: SupabaseArticleStore is lazy (its client is built on first use),
so merely *constructing* it via the factory touches nothing.
"""

from __future__ import annotations

from storage import (
    SqliteArticleStore,
    SupabaseArticleStore,
    get_store,
)


# -- get_store backend selection --------------------------------------------


def test_get_store_returns_supabase_when_env_and_creds(monkeypatch):
    monkeypatch.setenv("DATA_HUB_DB_BACKEND", "supabase")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "svc-key")
    store = get_store()
    assert isinstance(store, SupabaseArticleStore)
    # Lazy: no client built just by constructing via the factory.
    assert store._cached_client is None


def test_get_store_defaults_to_sqlite_when_backend_unset(monkeypatch):
    monkeypatch.delenv("DATA_HUB_DB_BACKEND", raising=False)
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "svc-key")
    store = get_store()
    assert isinstance(store, SqliteArticleStore)


def test_get_store_falls_back_to_sqlite_when_creds_missing(monkeypatch):
    monkeypatch.setenv("DATA_HUB_DB_BACKEND", "supabase")
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    store = get_store()
    assert isinstance(store, SqliteArticleStore)


def test_get_store_supabase_backend_case_insensitive(monkeypatch):
    monkeypatch.setenv("DATA_HUB_DB_BACKEND", "Supabase")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "svc-key")
    assert isinstance(get_store(), SupabaseArticleStore)


def test_get_store_sqlite_uses_default_path(monkeypatch):
    monkeypatch.delenv("DATA_HUB_DB_BACKEND", raising=False)
    store = get_store()
    assert isinstance(store, SqliteArticleStore)
    assert store.db_path == "data/content_hub.db"


# -- pipelines use the factory when no store is injected --------------------


def test_ingest_pipeline_uses_factory_when_no_store(monkeypatch):
    import pipeline.ingest as ingest_mod

    sentinel = object()
    monkeypatch.setattr(ingest_mod, "get_store", lambda: sentinel)
    pipe = ingest_mod.IngestPipeline()
    assert pipe.store is sentinel


def test_ingest_pipeline_injection_still_wins(monkeypatch):
    import pipeline.ingest as ingest_mod

    monkeypatch.setattr(
        ingest_mod, "get_store", lambda: (_ for _ in ()).throw(AssertionError("factory should not be called"))
    )
    injected = SqliteArticleStore(db_path=":memory:")
    pipe = ingest_mod.IngestPipeline(store=injected)
    assert pipe.store is injected


def test_backfill_pipeline_uses_factory_when_no_store(monkeypatch):
    import pipeline.backfill as backfill_mod

    sentinel = object()
    monkeypatch.setattr(backfill_mod, "get_store", lambda: sentinel)
    pipe = backfill_mod.BackfillPipeline()
    assert pipe.store is sentinel


def test_backfill_pipeline_injection_still_wins(monkeypatch):
    import pipeline.backfill as backfill_mod

    monkeypatch.setattr(
        backfill_mod, "get_store", lambda: (_ for _ in ()).throw(AssertionError("factory should not be called"))
    )
    injected = SqliteArticleStore(db_path=":memory:")
    pipe = backfill_mod.BackfillPipeline(store=injected)
    assert pipe.store is injected
