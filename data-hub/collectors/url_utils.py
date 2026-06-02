"""URL normalization helpers for the Content Trend Data Hub.

The pipeline uses ``article_url`` as the natural key for deduplication, both
within a single run (:class:`~processors.deduplicator.Deduplicator`) and
across runs (:meth:`~pipeline.ingest.IngestPipeline.filter_already_exported`).
But the same article often arrives under cosmetically different URLs:

* a trailing slash (``https://x/`` vs ``https://x``),
* an uppercase scheme/host (``HTTPS://X`` vs ``https://x``),
* tracking query params (``?utm_source=rss``, ``?fbclid=...``),
* a URL fragment (``#section``).

Comparing raw strings treats those as distinct, so a daily feed re-appends the
same items forever. :func:`normalize_url` collapses these cosmetic variants
into one canonical key WITHOUT mutating the URL stored in the article (callers
keep the original for display/clicking; only the comparison key is normalized).

Fail-soft: any parse error returns the original string unchanged.
"""

from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

# Query parameters that are pure tracking noise and never identify content.
_TRACKING_PARAMS = frozenset(
    {
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "utm_id",
        "utm_name",
        "utm_reader",
        "fbclid",
        "gclid",
        "mc_cid",
        "mc_eid",
        "ref",
        "igshid",
    }
)


def _is_tracking_param(key: str) -> bool:
    """True if a query-param key is tracking noise (incl. any ``utm_*``)."""
    lowered = key.lower()
    return lowered in _TRACKING_PARAMS or lowered.startswith("utm_")


def normalize_url(url: str) -> str:
    """Return a canonical comparison key for ``url``.

    Lowercases the scheme and host, strips a trailing slash from the path,
    removes tracking query params (``utm_*``, ``fbclid``, ``gclid``,
    ``mc_cid``, ``mc_eid``, ``ref``, ``igshid``) while keeping the rest, and
    drops any fragment. Non-tracking params are preserved (and re-sorted so
    order differences don't defeat dedup).

    Fail-soft: returns ``url`` unchanged on any error or non-string input.
    """
    if not url or not isinstance(url, str):
        return url
    try:
        parts = urlsplit(url.strip())

        scheme = parts.scheme.lower()
        netloc = parts.netloc.lower()

        # Strip a trailing slash so "/a/" == "/a" and "https://x/" == "https://x"
        # (the bare-root "/" collapses to "" -- both forms then match).
        path = parts.path.rstrip("/")

        kept = [
            (k, v)
            for k, v in parse_qsl(parts.query, keep_blank_values=True)
            if not _is_tracking_param(k)
        ]
        # Sort for a stable key regardless of incoming param order.
        query = urlencode(sorted(kept))

        # Drop the fragment entirely.
        return urlunsplit((scheme, netloc, path, query, ""))
    except Exception:  # noqa: BLE001 -- normalization must never crash dedup
        return url
