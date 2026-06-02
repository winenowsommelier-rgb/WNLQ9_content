"""Tests for the SQLite ArticleStore (system-of-record), written TDD-first.

The store is the new source of truth for the Content Trend Data Hub: an
indexed, local SQLite database that owns cross-run deduplication (by
normalized URL) and supports time-series / vertical queries that a flat
Google Sheet cannot. Google Sheets is demoted to a read-only mirror.

These tests never touch the network or a real Sheet. They use an in-memory
or tmp_path SQLite database, so they are fully isolated and fast.
"""

from __future__ import annotations

from storage.article_store import ArticleStore, SqliteArticleStore


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
        "thailand_focus": False,
    }
    article.update(overrides)
    return article


def _store():
    """A fresh in-memory store with its schema initialised."""
    store = SqliteArticleStore(db_path=":memory:")
    store.init_schema()
    return store


# -- interface ---------------------------------------------------------------


def test_sqlite_store_is_an_article_store():
    """SqliteArticleStore implements the ArticleStore interface."""
    assert issubclass(SqliteArticleStore, ArticleStore)
    assert isinstance(_store(), ArticleStore)


# -- schema ------------------------------------------------------------------


def test_init_schema_creates_tables_and_is_idempotent():
    """init_schema creates the tables and is safe to call twice."""
    store = SqliteArticleStore(db_path=":memory:")
    store.init_schema()
    # Calling again must not raise (CREATE TABLE IF NOT EXISTS).
    store.init_schema()

    conn = store._connect()
    names = {
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    }
    assert "articles" in names
    assert "runs" in names


# -- upsert / dedup ----------------------------------------------------------


def test_upsert_inserts_new_and_returns_them():
    """New articles are inserted and returned under 'inserted'."""
    store = _store()
    result = store.upsert_articles([_article("https://a.com/1"),
                                    _article("https://b.com/2")])

    assert result["skipped"] == 0
    inserted_urls = {a["article_url"] for a in result["inserted"]}
    assert inserted_urls == {"https://a.com/1", "https://b.com/2"}
    assert store.count() == 2


def test_upsert_same_url_is_skipped_second_time():
    """Re-upserting the same URL inserts nothing and counts it as skipped."""
    store = _store()
    store.upsert_articles([_article("https://a.com/1")])

    result = store.upsert_articles([_article("https://a.com/1")])

    assert result["inserted"] == []
    assert result["skipped"] == 1
    assert store.count() == 1


def test_upsert_dedups_on_normalized_url():
    """utm noise / trailing slash collapse to one row (normalized key)."""
    store = _store()
    first = store.upsert_articles([_article("https://x.com/post/")])
    assert len(first["inserted"]) == 1

    # Same article, decorated with a trailing slash variant + tracking param.
    second = store.upsert_articles(
        [_article("https://x.com/post?utm_source=rss")]
    )

    assert second["inserted"] == []
    assert second["skipped"] == 1
    assert store.count() == 1


def test_upsert_preserves_original_url():
    """The ORIGINAL article_url is stored, not the normalized key."""
    store = _store()
    store.upsert_articles([_article("https://x.com/post?utm_source=rss")])

    rows = store.query()
    assert rows[0]["article_url"] == "https://x.com/post?utm_source=rss"


def test_upsert_skips_bad_article_without_crashing():
    """An article missing a URL is skipped, not fatal; good ones still land."""
    store = _store()
    result = store.upsert_articles([
        {"title": "no url here"},          # bad: no article_url
        _article("https://good.com/1"),    # good
    ])

    inserted_urls = {a["article_url"] for a in result["inserted"]}
    assert inserted_urls == {"https://good.com/1"}
    assert store.count() == 1


# -- exists / existing_normalized_urls --------------------------------------


def test_exists_and_existing_normalized_urls():
    """exists() and existing_normalized_urls() reflect stored rows."""
    store = _store()
    store.upsert_articles([_article("https://a.com/1")])

    assert store.exists("https://a.com/1") is True
    # Normalized variant of the same URL is also "present".
    assert store.exists("https://a.com/1/?utm_source=x") is True
    assert store.exists("https://missing.com/9") is False

    normalized = store.existing_normalized_urls()
    from collectors.url_utils import normalize_url
    assert normalize_url("https://a.com/1") in normalized


# -- query / count -----------------------------------------------------------


def test_query_filters_by_vertical():
    """query(vertical=...) filters on primary_category."""
    store = _store()
    store.upsert_articles([
        _article("https://w.com/1", primary_category="wine"),
        _article("https://s.com/2", primary_category="spirits"),
    ])

    wine = store.query(vertical="wine")
    assert {a["article_url"] for a in wine} == {"https://w.com/1"}


def test_query_filters_by_thailand_focus():
    """query(thailand_focus=True) returns only Thailand-focused rows."""
    store = _store()
    store.upsert_articles([
        _article("https://th.com/1", thailand_focus=True),
        _article("https://gl.com/2", thailand_focus=False),
    ])

    thai = store.query(thailand_focus=True)
    assert {a["article_url"] for a in thai} == {"https://th.com/1"}


def test_query_filters_by_date_range():
    """query(since/until) filters on published_date."""
    store = _store()
    store.upsert_articles([
        _article("https://old.com/1", published_date="2025-01-01T00:00:00Z"),
        _article("https://new.com/2", published_date="2026-05-01T00:00:00Z"),
    ])

    recent = store.query(since="2026-01-01")
    assert {a["article_url"] for a in recent} == {"https://new.com/2"}

    bounded = store.query(since="2024-01-01", until="2025-06-01")
    assert {a["article_url"] for a in bounded} == {"https://old.com/1"}


def test_query_limit():
    """query(limit=N) caps the number of rows returned."""
    store = _store()
    store.upsert_articles([_article(f"https://a.com/{i}") for i in range(5)])

    assert len(store.query(limit=2)) == 2


def test_count_with_filters():
    """count(**filters) mirrors query but returns an int."""
    store = _store()
    store.upsert_articles([
        _article("https://w.com/1", primary_category="wine"),
        _article("https://w.com/2", primary_category="wine"),
        _article("https://s.com/3", primary_category="spirits"),
    ])

    assert store.count() == 3
    assert store.count(vertical="wine") == 2


# -- trend_signals round-trip ------------------------------------------------


def test_trend_signals_round_trip():
    """A list of trend_signals goes in and comes back out as a list."""
    store = _store()
    store.upsert_articles([
        _article("https://a.com/1", trend_signals=["premiumization", "rtd"]),
    ])

    row = store.query()[0]
    assert row["trend_signals"] == ["premiumization", "rtd"]


def test_trend_signals_empty_round_trip():
    """Missing / empty trend_signals round-trips to an empty list."""
    store = _store()
    store.upsert_articles([_article("https://a.com/1", trend_signals=[])])

    row = store.query()[0]
    assert row["trend_signals"] == []


# -- runs ledger -------------------------------------------------------------


def test_record_run_appends_ledger_row():
    """record_run appends a row to the runs ledger."""
    store = _store()
    store.record_run({
        "collected": 10,
        "db_inserted": 4,
        "exported": 4,
        "errors": [],
        "kind": "ingest",
    })

    conn = store._connect()
    rows = conn.execute("SELECT collected, inserted, exported, kind FROM runs").fetchall()
    assert len(rows) == 1
    assert rows[0][0] == 10
    assert rows[0][1] == 4
    assert rows[0][2] == 4
    assert rows[0][3] == "ingest"


# -- persistence across connections (tmp file) -------------------------------


def test_persists_to_tmp_file(tmp_path):
    """Data written to a tmp-file DB survives a fresh store instance."""
    db_path = str(tmp_path / "hub.db")
    store = SqliteArticleStore(db_path=db_path)
    store.init_schema()
    store.upsert_articles([_article("https://a.com/1")])

    reopened = SqliteArticleStore(db_path=db_path)
    reopened.init_schema()
    assert reopened.count() == 1
    assert reopened.exists("https://a.com/1") is True
