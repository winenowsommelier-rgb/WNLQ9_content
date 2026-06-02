"""Tests for URL normalization (FIX 2, TDD)."""

from __future__ import annotations

from collectors.url_utils import normalize_url


def test_trailing_slash_equivalence():
    assert normalize_url("https://x.com/a/") == normalize_url("https://x.com/a")


def test_root_slash_preserved():
    # "/" must not collapse to "" -- both forms still match each other.
    assert normalize_url("https://x.com/") == normalize_url("https://x.com")


def test_scheme_and_host_lowercased():
    assert normalize_url("HTTPS://X.COM/Path") == normalize_url(
        "https://x.com/Path"
    )
    # Path case is significant and preserved.
    assert normalize_url("https://x.com/Path") != normalize_url(
        "https://x.com/path"
    )


def test_utm_params_stripped():
    assert normalize_url("https://x.com/a?utm_source=rss") == normalize_url(
        "https://x.com/a"
    )


def test_various_tracking_params_stripped():
    url = "https://x.com/a?fbclid=1&gclid=2&mc_cid=3&mc_eid=4&ref=feed&igshid=9"
    assert normalize_url(url) == normalize_url("https://x.com/a")


def test_non_tracking_params_preserved():
    norm = normalize_url("https://x.com/a?id=7&page=2")
    # Both meaningful params survive.
    assert "id=7" in norm
    assert "page=2" in norm


def test_mixed_params_keeps_only_meaningful():
    norm = normalize_url("https://x.com/a?id=7&utm_medium=email&page=2")
    assert "id=7" in norm
    assert "page=2" in norm
    assert "utm_medium" not in norm


def test_fragment_dropped():
    assert normalize_url("https://x.com/a#section") == normalize_url(
        "https://x.com/a"
    )


def test_param_order_independent():
    assert normalize_url("https://x.com/a?b=2&a=1") == normalize_url(
        "https://x.com/a?a=1&b=2"
    )


def test_malformed_does_not_crash():
    # A nonsense value just comes back unchanged.
    assert normalize_url("not a url") == "not a url"
    assert normalize_url("") == ""
    assert normalize_url(None) is None
