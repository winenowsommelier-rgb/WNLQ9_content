"""Storage layer for the Content Trend Data Hub.

Defines the :class:`~storage.article_store.ArticleStore` interface and two
concrete backends:

* :class:`~storage.article_store.SqliteArticleStore` -- the default, a local
  indexed SQLite file (system-of-record; Google Sheets is a read-only mirror).
* :class:`~storage.supabase_store.SupabaseArticleStore` -- an optional,
  env-gated managed Postgres (Supabase) backend that is a drop-in for the same
  :class:`ArticleStore` interface (identical return shapes).

:func:`get_store` picks the backend from the environment so ops can switch
without touching code.
"""

from __future__ import annotations

import os

from storage.article_store import ArticleStore, SqliteArticleStore
from storage.supabase_store import SupabaseArticleStore

__all__ = [
    "ArticleStore",
    "SqliteArticleStore",
    "SupabaseArticleStore",
    "get_store",
]

# The on-disk default for the SQLite system-of-record (matches the historical
# SqliteArticleStore default so behavior is unchanged when unconfigured).
_DEFAULT_SQLITE_PATH = "data/content_hub.db"


def get_store() -> ArticleStore:
    """Return the configured :class:`ArticleStore` backend.

    Selection (env-based, so no code change to switch backends):

    * ``DATA_HUB_DB_BACKEND == "supabase"`` (case-insensitive) AND both
      ``SUPABASE_URL`` and ``SUPABASE_SERVICE_KEY`` are set ->
      :class:`SupabaseArticleStore` (lazy: constructing it touches no network).
    * Otherwise -> :class:`SqliteArticleStore` at the default path.

    Missing creds while ``backend=supabase`` falls back to SQLite rather than
    failing, so a half-configured environment still runs locally.
    """
    backend = (os.environ.get("DATA_HUB_DB_BACKEND") or "").strip().lower()
    if backend == "supabase":
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if url and key:
            return SupabaseArticleStore(url=url, key=key)
    return SqliteArticleStore(db_path=_DEFAULT_SQLITE_PATH)
