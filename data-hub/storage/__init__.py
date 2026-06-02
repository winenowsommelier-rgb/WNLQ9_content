"""Storage layer for the Content Trend Data Hub.

Defines the :class:`~storage.article_store.ArticleStore` interface and its
SQLite implementation, the new system-of-record. Google Sheets is demoted to
a read-only mirror; the database owns cross-run dedup and time-series queries.
"""

from storage.article_store import ArticleStore, SqliteArticleStore

__all__ = ["ArticleStore", "SqliteArticleStore"]
