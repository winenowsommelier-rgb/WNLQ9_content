"""Tests for Categorizer (Task 5, TDD).

Written BEFORE the implementation. The Categorizer enriches collected
articles with classification fields whose values must come exactly from
config/taxonomy.json.
"""

import json
import os

import pytest

from processors.categorizer import Categorizer


TAXONOMY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "config", "taxonomy.json"
)


@pytest.fixture(scope="module")
def categorizer():
    return Categorizer()


@pytest.fixture(scope="module")
def taxonomy():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _article(title="", excerpt="", content_type="news"):
    return {
        "title": title,
        "content_excerpt": excerpt,
        "content_type": content_type,
    }


def test_detect_content_type_review(categorizer):
    article = _article(title="Macallan 18 Review: A Sherried Stunner")
    assert categorizer._detect_content_type(article) == "review"


def test_detect_content_type_guide(categorizer):
    article = _article(title="How to Pair Wine With Cheese: Pairing 101")
    assert categorizer._detect_content_type(article) == "guide"


def test_detect_spirits_type_whisky(categorizer):
    article = _article(
        title="Islay Single Malt Scotch Whisky Tasting",
        excerpt="A peaty whisky from Scotland.",
    )
    assert categorizer._detect_spirits_type(article) == "whisky"


def test_detect_region_france(categorizer):
    article = _article(
        title="Bordeaux 2024 En Primeur",
        excerpt="The Bordeaux campaign looks strong this year.",
    )
    assert categorizer._detect_region(article) == "France"


def test_detect_region_japan(categorizer):
    article = _article(
        title="Yamazaki and the Rise of Japanese Whisky",
        excerpt="Japanese whisky continues to command high prices.",
    )
    assert categorizer._detect_region(article) == "Japan"


def test_detect_trend_signals_scarcity(categorizer):
    article = _article(
        title="Global Shortage Hits Rare Bourbon",
        excerpt="Supply is scarce amid an allocation crunch.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "scarcity/shortage" in signals


def test_detect_trend_signals_multiple(categorizer):
    article = _article(
        title="Award-Winning Rare Whisky Wins Gold Medal",
        excerpt="A rare collector's bottle prized by investors.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "award_winning" in signals
    assert "investment_opportunity" in signals


def test_estimate_aeo_high(categorizer):
    guide = _article(title="Wine Buying Guide", content_type="news")
    # Force guide classification via title keyword.
    enriched_guide = dict(guide)
    enriched_guide["content_type"] = categorizer._detect_content_type(guide)
    assert categorizer._estimate_aeo_value(enriched_guide) == "high"

    review = _article(title="Cabernet Review", content_type="review")
    assert categorizer._estimate_aeo_value(review) == "high"


def test_categorize_adds_all_fields(categorizer):
    article = _article(
        title="Bordeaux 2024: A Buying Guide to Award-Winning Reds",
        excerpt="A guide to scarce, award-winning Bordeaux wines.",
    )
    [result] = categorizer.categorize([article])
    for field in (
        "topic_region",
        "spirits_type",
        "trend_signals",
        "primary_category",
        "buyer_persona",
        "aeo_citation_opportunity",
    ):
        assert field in result
    assert isinstance(result["trend_signals"], list)


def test_enum_values_match_taxonomy(categorizer, taxonomy):
    valid_content_types = {c["value"] for c in taxonomy["content_types"]}
    valid_categories = {c["value"] for c in taxonomy["primary_categories"]}
    valid_signals = {s["value"] for s in taxonomy["trend_signals"]}
    valid_spirits = {s["value"] for s in taxonomy["spirits_types"]}
    valid_personas = {p["value"] for p in taxonomy["buyer_personas"]}
    valid_aeo = {a["value"] for a in taxonomy["aeo_citation_opportunity"]}
    valid_wine_regions = {r["region"] for r in taxonomy["regions_wine"]}
    valid_spirits_regions = {r["region"] for r in taxonomy["regions_spirits"]}
    valid_regions = valid_wine_regions | valid_spirits_regions | {"Other"}

    articles = [
        _article("Bordeaux Cabernet Review", "An award-winning Bordeaux."),
        _article("Islay Scotch Whisky 101", "How to taste peaty whisky."),
        _article("Napa Valley Sustainability", "Organic biodynamic farming."),
        _article("Why Tequila Is the Next Big Thing", "An opinion on agave."),
        _article("Champagne Shortage Warning", "Counterfeit fakes on the rise."),
    ]
    for result in categorizer.categorize(articles):
        assert result["content_type"] in valid_content_types
        assert result["primary_category"] in valid_categories
        assert result["buyer_persona"] in valid_personas
        assert result["aeo_citation_opportunity"] in valid_aeo
        assert result["topic_region"] in valid_regions
        if result["spirits_type"] is not None:
            assert result["spirits_type"] in valid_spirits
        for signal in result["trend_signals"]:
            assert signal in valid_signals
