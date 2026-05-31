"""Tests for WebScraper (Task 4, TDD).

Written BEFORE the implementation. All network access (_fetch_html /
requests.get) is mocked so no test touches the network.
"""

from unittest import mock

from bs4 import BeautifulSoup

from collectors.web_scraper import WebScraper


LISTING_URL = "https://www.wongnai.com/articles"

SELECTORS = {
    "article": "article.post",
    "title": "h2.title",
    "link": "a.read-more",
    "date": "span.date",
    "excerpt": "p.summary",
}


def _make_scraper():
    return WebScraper(name="Wongnai", listing_url=LISTING_URL, selectors=SELECTORS)


def _container_html(
    title="Best Thai Whisky Pairings",
    link="/article/1",
    date="May 15, 2024",
    excerpt="A guide to pairing Thai whisky with local food.",
):
    """Render one <article.post> container with the configured selectors."""
    return (
        '<article class="post">'
        f'<h2 class="title">{title}</h2>'
        f'<a class="read-more" href="{link}">Read more</a>'
        f'<span class="date">{date}</span>'
        f'<p class="summary">{excerpt}</p>'
        "</article>"
    )


def _listing_html(*containers):
    return "<html><body>" + "".join(containers) + "</body></html>"


def test_build_article_extracts_fields():
    scraper = _make_scraper()
    soup = BeautifulSoup(_container_html(), "html.parser")
    container = soup.select_one(SELECTORS["article"])

    article = scraper._build_article(container)

    assert article["title"] == "Best Thai Whisky Pairings"
    assert article["article_url"] == "https://www.wongnai.com/article/1"
    assert article["content_excerpt"] == (
        "A guide to pairing Thai whisky with local food."
    )
    assert article["content_type"] == "news"


def test_resolve_url_makes_absolute():
    scraper = _make_scraper()
    resolved = scraper._resolve_url("/article/1")
    assert resolved == "https://www.wongnai.com/article/1"

    # An already-absolute URL is returned unchanged.
    absolute = "https://other.example.com/x"
    assert scraper._resolve_url(absolute) == absolute


def test_collect_returns_validated_articles():
    scraper = _make_scraper()

    good = _container_html(title="Good Article", link="/article/1")
    # Missing title -> should be skipped by validation.
    no_title = _container_html(title="", link="/article/2")
    another_good = _container_html(title="Another Good", link="/article/3")

    html = _listing_html(good, no_title, another_good)

    with mock.patch.object(scraper, "_fetch_html", return_value=html) as mocked:
        articles = scraper.collect()
        mocked.assert_called_once_with(LISTING_URL)

    # Only the two valid containers survive.
    assert len(articles) == 2

    for article in articles:
        for field in WebScraper.REQUIRED_FIELDS:
            assert field in article
            assert article[field]
        assert article["source_name"] == "Wongnai"
        assert article["content_type"] == "news"
        assert "collected_date" in article

    assert articles[0]["article_url"] == "https://www.wongnai.com/article/1"
    assert articles[1]["article_url"] == "https://www.wongnai.com/article/3"


def test_collect_handles_fetch_failure():
    """A fetch failure (empty HTML) should yield an empty list, not crash."""
    scraper = _make_scraper()
    with mock.patch.object(scraper, "_fetch_html", return_value=""):
        articles = scraper.collect()
    assert articles == []


def test_collect_handles_malformed_container():
    """One malformed container is skipped; the rest still collected."""
    scraper = _make_scraper()

    good = _container_html(title="Good Article", link="/article/1")
    # A container missing the link selector entirely (no <a class=read-more>).
    malformed = (
        '<article class="post">'
        '<h2 class="title">No Link Here</h2>'
        "</article>"
    )

    html = _listing_html(good, malformed)
    with mock.patch.object(scraper, "_fetch_html", return_value=html):
        articles = scraper.collect()

    assert len(articles) == 1
    assert articles[0]["article_url"] == "https://www.wongnai.com/article/1"


def test_excerpt_truncated_to_500():
    scraper = _make_scraper()
    long_excerpt = "x" * 1200
    soup = BeautifulSoup(_container_html(excerpt=long_excerpt), "html.parser")
    container = soup.select_one(SELECTORS["article"])

    article = scraper._build_article(container)
    assert len(article["content_excerpt"]) <= 500


def test_fetch_html_returns_empty_on_network_error():
    """Network errors in _fetch_html are caught and return ''."""
    scraper = _make_scraper()
    with mock.patch(
        "collectors.web_scraper.requests.get",
        side_effect=Exception("network down"),
    ):
        assert scraper._fetch_html(LISTING_URL) == ""
