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


def test_detect_emerging_region(categorizer):
    article = _article(
        title="Thailand: An Emerging Region for Wine",
        excerpt="This new region is gaining attention from critics.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "emerging_region" in signals


def test_detect_health_positive(categorizer):
    article = _article(
        title="Red Wine and Heart Health",
        excerpt="Researchers tout the antioxidant health benefits of moderate consumption.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "health_angle_positive" in signals


def test_detect_health_negative(categorizer):
    article = _article(
        title="The Cancer Risk of Alcohol",
        excerpt="A new health warning about the dangers of drinking and liver damage.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "health_angle_negative" in signals


def test_detect_celebrity_tie(categorizer):
    article = _article(
        title="Inside the Celebrity-Owned Tequila Boom",
        excerpt="An actor and a musician launch a star-backed brand.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "celebrity_tie" in signals


def test_detect_limited_release(categorizer):
    article = _article(
        title="Macallan Drops a Limited Edition Single Malt",
        excerpt="A small batch, exclusive release for collectors.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "limited_release" in signals


def test_detect_viral_social(categorizer):
    article = _article(
        title="This Wine Cocktail Went Viral on TikTok",
        excerpt="A social media sensation trending on Instagram.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "viral_on_social" in signals


def test_detect_climate_impact(categorizer):
    article = _article(
        title="Frost Destroyed the Vintage in Burgundy",
        excerpt="Drought and heatwave conditions hammered the harvest amid global warming.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "climate_impact" in signals


def test_multiple_signals_coexist(categorizer):
    article = _article(
        title="Celebrity-Owned Limited Edition Whisky Goes Viral on TikTok",
        excerpt="A star-backed small batch release became a social media sensation.",
    )
    signals = categorizer._detect_trend_signals(article)
    assert "celebrity_tie" in signals
    assert "limited_release" in signals
    assert "viral_on_social" in signals


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


# -- vertical / preset primary_category (6-vertical expansion) ---------------


def test_categorize_respects_preset_primary_category(categorizer):
    """A valid preset primary_category (e.g. a stamped vertical) is kept."""
    article = _article(
        title="A Weekend in the Maldives",
        excerpt="The best overwater villas for a luxury escape.",
    )
    article["primary_category"] = "travel"  # stamped by the collector's vertical
    result = categorizer.categorize([article])[0]
    assert result["primary_category"] == "travel"


def test_categorize_detects_when_missing(categorizer):
    """With no preset primary_category, keyword detection runs as before."""
    article = _article(
        title="Islay Single Malt Scotch Whisky Tasting",
        excerpt="A peaty whisky from Scotland.",
    )
    assert "primary_category" not in article
    result = categorizer.categorize([article])[0]
    assert result["primary_category"] == "spirits"


def test_categorize_ignores_empty_preset_primary_category(categorizer):
    """An empty/invalid preset does not block detection."""
    article = _article(
        title="Napa Valley Cabernet vineyard report",
        excerpt="A vintage from the winery.",
    )
    article["primary_category"] = ""  # empty -> should be ignored
    result = categorizer.categorize([article])[0]
    assert result["primary_category"] == "wine"


def test_taxonomy_has_new_verticals(taxonomy):
    """taxonomy primary_categories includes the new verticals."""
    values = {c["value"] for c in taxonomy["primary_categories"]}
    for v in ("lifestyle", "travel", "hospitality", "food"):
        assert v in values
    # The 6-vertical reference list is present.
    assert "verticals" in taxonomy
    assert set(taxonomy["verticals"]) == {
        "wine", "spirits", "food", "lifestyle", "travel", "hospitality"
    }


# -- Thailand focus detection (cross-vertical geo-tagging) ------------------


def test_detect_thailand_high_in_title(categorizer):
    article = _article(title="Best rooftop bars in Bangkok")
    assert categorizer._detect_thailand_focus(article) == "high"


def test_detect_thailand_thai_script(categorizer):
    # Thai-script chars (U+0E00-U+0E7F) in the title -> high.
    article = _article(title="เที่ยวกรุงเทพ")
    assert categorizer._detect_thailand_focus(article) == "high"


def test_detect_thailand_medium_in_excerpt(categorizer):
    article = _article(
        title="A great evening out",
        excerpt="We visited a wine bar in Thailand last week.",
    )
    assert categorizer._detect_thailand_focus(article) == "medium"


def test_detect_thailand_none(categorizer):
    article = _article(
        title="Bordeaux 2024 En Primeur",
        excerpt="A report on the French vintage.",
    )
    assert categorizer._detect_thailand_focus(article) == ""


def test_detect_thailand_respects_preset(categorizer):
    # An already-stamped (source-level) value must NOT be downgraded.
    article = _article(title="A generic story with no geo signal")
    article["thailand_focus"] = "high"
    assert categorizer._detect_thailand_focus(article) == "high"


def test_detect_thailand_medium_upgraded_to_high_on_keyword(categorizer):
    # A geo_focus source baseline is 'medium'; an actual Thailand keyword in the
    # title upgrades it to 'high'.
    article = _article(title="Best rooftop bars in Bangkok")
    article["thailand_focus"] = "medium"
    assert categorizer._detect_thailand_focus(article) == "high"


def test_detect_thailand_medium_not_downgraded_without_keyword(categorizer):
    # A 'medium' baseline (Thai-source stamp) with no Thailand keyword stays
    # 'medium' -- it must never be downgraded to "". (Title avoids any
    # \bthai\b match so we exercise the no-keyword path.)
    article = _article(
        title="Cabinet reshuffle and the new budget",
        excerpt="A political story with no Thailand place keyword.",
    )
    article["thailand_focus"] = "medium"
    assert categorizer._detect_thailand_focus(article) == "medium"


def test_detect_thailand_high_preset_never_downgraded(categorizer):
    # An existing 'high' is authoritative and is never downgraded.
    article = _article(title="A generic story with no geo signal")
    article["thailand_focus"] = "high"
    assert categorizer._detect_thailand_focus(article) == "high"


def test_detect_thailand_no_false_positive(categorizer):
    # "thatched"/"Thanksgiving" must NOT match \bthai\b / \bthailand\b.
    article = _article(
        title="Thatcher's thatched roof and Thanksgiving",
        excerpt="A story about a thatched cottage.",
    )
    assert categorizer._detect_thailand_focus(article) == ""


def test_categorize_adds_thailand_focus(categorizer):
    # Every categorized article gets a thailand_focus field.
    article = _article(title="Phuket beach guide")
    result = categorizer.categorize([article])[0]
    assert result["thailand_focus"] == "high"

    plain = _article(title="Napa Valley Cabernet report")
    result2 = categorizer.categorize([plain])[0]
    assert result2["thailand_focus"] == ""


def test_taxonomy_has_thailand_focus_levels(taxonomy):
    assert "thailand_focus_levels" in taxonomy
    assert taxonomy["thailand_focus_levels"] == ["high", "medium", "none"]


# -- Beverage relevance detection (cross-vertical topical filter) -----------
# beverage_relevance cuts ACROSS verticals: it answers "is this actually about
# premium wine/spirits?" so broad lifestyle/travel/hospitality sources can be
# filtered down. high = core beverage; medium = food/drink-adjacent; low =
# genuinely off-topic (furniture, sports, royalty, pure politics).


def test_beverage_relevance_wine_vertical_is_high(categorizer):
    # A wine/spirits primary_category is core -> always high.
    article = _article(title="Napa Valley harvest report")
    article["primary_category"] = "wine"
    assert categorizer._detect_beverage_relevance(article) == "high"


def test_beverage_relevance_spirits_vertical_is_high(categorizer):
    article = _article(title="A profile piece")
    article["primary_category"] = "spirits"
    assert categorizer._detect_beverage_relevance(article) == "high"


def test_beverage_relevance_lifestyle_with_whisky_is_high(categorizer):
    # A lifestyle-vertical article whose TITLE mentions a strong beverage term
    # is still high -- the topic is about the drink.
    article = _article(
        title="The new collector's whisky everyone wants",
        excerpt="A lifestyle look at a rare bottling.",
    )
    article["primary_category"] = "lifestyle"
    assert categorizer._detect_beverage_relevance(article) == "high"


def test_beverage_relevance_hotel_restaurant_no_drink_is_medium(categorizer):
    # A hospitality piece with food/drink context but no strong beverage term
    # -> medium (adjacent, not core).
    article = _article(
        title="A new hotel restaurant opens downtown",
        excerpt="The dining room and menu reviewed.",
    )
    article["primary_category"] = "hospitality"
    assert categorizer._detect_beverage_relevance(article) == "medium"


def test_beverage_relevance_office_furniture_is_low(categorizer):
    # Genuinely off-topic -> low.
    article = _article(
        title="Office furniture power unit explained",
        excerpt="A guide to powering the modern desk.",
    )
    article["primary_category"] = "hospitality"
    assert categorizer._detect_beverage_relevance(article) == "low"


def test_beverage_relevance_sports_is_low(categorizer):
    article = _article(
        title="Rafael Nadal's wife and their new home",
        excerpt="A look at the tennis star's family life.",
    )
    article["primary_category"] = "lifestyle"
    assert categorizer._detect_beverage_relevance(article) == "low"


def test_beverage_relevance_respects_valid_preset(categorizer):
    # An agent-set value (one of the 3 levels) wins over the keyword fallback.
    article = _article(
        title="Office furniture power unit explained",
    )
    article["primary_category"] = "hospitality"
    article["beverage_relevance"] = "high"  # agent override
    assert categorizer._detect_beverage_relevance(article) == "high"


def test_beverage_relevance_ignores_invalid_preset(categorizer):
    # An invalid preset is ignored; keyword fallback runs.
    article = _article(title="Office furniture power unit explained")
    article["primary_category"] = "hospitality"
    article["beverage_relevance"] = "banana"  # not a valid level
    assert categorizer._detect_beverage_relevance(article) == "low"


def test_beverage_relevance_word_boundary_no_false_positive(categorizer):
    # "ginger" must not match the strong term "gin"; "beard" must not match
    # "beer". With no real beverage/adjacent term -> low.
    article = _article(
        title="Ginger the cat and the bearded man",
        excerpt="A heartwarming pet story.",
    )
    article["primary_category"] = "lifestyle"
    assert categorizer._detect_beverage_relevance(article) == "low"


def test_categorize_adds_beverage_relevance(categorizer):
    # Every categorized article gets a beverage_relevance field.
    article = _article(title="Single malt scotch tasting notes")
    result = categorizer.categorize([article])[0]
    assert result["beverage_relevance"] == "high"

    off_topic = _article(title="Best office chairs of the year")
    result2 = categorizer.categorize([off_topic])[0]
    assert result2["beverage_relevance"] == "low"


def test_categorize_respects_beverage_relevance_preset(categorizer):
    # A valid preset survives categorize() (agent-set value wins).
    article = _article(title="Best office chairs of the year")
    article["beverage_relevance"] = "high"
    result = categorizer.categorize([article])[0]
    assert result["beverage_relevance"] == "high"


def test_taxonomy_has_beverage_relevance_levels(taxonomy):
    assert "beverage_relevance_levels" in taxonomy
    assert taxonomy["beverage_relevance_levels"] == ["high", "medium", "low"]
