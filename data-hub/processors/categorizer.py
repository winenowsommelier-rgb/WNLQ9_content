"""Categorizer for the Content Trend Data Hub.

Adds the classification / enrichment layer on top of the core fields
produced by the collectors. Raw RSS and scraped articles carry only the
schema's core fields; this processor fills in the wine/spirits and SEO
classification fields:

    topic_region, spirits_type, trend_signals, primary_category,
    buyer_persona, aeo_citation_opportunity

All enumerated values are drawn from config/taxonomy.json, which is the
single source of truth (data-schema.md, "Enum Fields"). Classification
uses lightweight, case-insensitive keyword heuristics over the article
title and excerpt -- no ML.
"""

from __future__ import annotations

import json
import os
import re
from typing import Dict, List, Optional

# config/taxonomy.json lives alongside this package, one level up.
_DEFAULT_TAXONOMY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "config",
    "taxonomy.json",
)

# -- Thailand-focus detection (cross-vertical geo-tagging) -------------------
# Geo-relevance cuts ACROSS the six verticals; it is NOT a vertical. The
# categorizer tags each article high / medium / "" so any article (wine,
# spirits, travel, ...) can be filtered down to Thailand/Bangkok relevance.

# Valid (non-empty) stamped/detected levels; "" means not Thailand-focused.
_VALID_THAILAND_FOCUS = {"high", "medium"}

# Any character in the Thai Unicode block U+0E00-U+0E7F is a strong signal.
_THAI_SCRIPT_RE = re.compile(r"[฀-๿]")

# STRONG signals: word-boundaried so "thai" never matches inside "Thatcher",
# "thatched", "Thanksgiving", etc. A strong signal in the TITLE or URL -> high.
_THAILAND_STRONG_RE = re.compile(
    r"\b(?:thailand|thai|bangkok|phuket|chiang\s*mai|pattaya|"
    r"koh\s*samui|krabi|isaan|isan)\b"
)

# WEAKER signals: regional / currency cues. Anywhere -> at most medium.
_THAILAND_WEAK_RE = re.compile(r"\b(?:southeast\s*asia|baht)\b")

# -- Beverage relevance detection (cross-vertical topical filter) ------------
# Cuts ACROSS the verticals like Thailand-focus does. Answers "is this actually
# about premium wine/spirits?" so broad lifestyle/travel/hospitality sources
# (and their sitemap backfill) can be filtered down to what matters. Levels:
#   high   -- core beverage (wine/spirits vertical, or a strong beverage term)
#   medium -- food/drink/hospitality-adjacent (no strong beverage term)
#   low    -- genuinely off-topic (furniture, sports, royalty, pure politics)

# Valid (settable) levels. An agent may preset one of these; it then wins over
# the keyword fallback below.
_VALID_BEVERAGE_RELEVANCE = {"high", "medium", "low"}

# STRONG beverage terms -> high. Word-boundaried so "gin" never matches inside
# "ginger" and "beer" never matches inside "beard". Multi-word terms ("wine
# bar") are matched as phrases.
_BEVERAGE_STRONG_RE = re.compile(
    r"\b(?:wine|spirits|whisky|whiskey|scotch|bourbon|gin|rum|vodka|tequila|"
    r"mezcal|cognac|brandy|champagne|prosecco|sake|cocktail|mixology|"
    r"distillery|distiller|winery|vineyard|sommelier|brewery|beer|aperitif|"
    r"liqueur|vermouth|bartender|wine\s+bar|cocktail\s+bar)\b"
)

# ADJACENT (food/drink/hospitality context) terms -> medium, only when no
# strong term matched.
_BEVERAGE_ADJACENT_RE = re.compile(
    r"\b(?:restaurant|dining|chef|menu|hotel|bar|hospitality|beverage|drinks|"
    r"pairing|tasting|nightlife)\b"
)


class Categorizer:
    """Enrich collected articles with taxonomy-backed classification fields.

    The controlled vocabulary is loaded once in :meth:`__init__`. Every
    value returned by the detection helpers is validated against that
    vocabulary; an unknown value is treated as a bug and falls back to a
    safe default rather than emitting an invalid enum.
    """

    DEFAULT_BUYER_PERSONA = "enthusiast"
    DEFAULT_REGION = "Other"

    def __init__(self, taxonomy_path: Optional[str] = None) -> None:
        self.taxonomy_path = taxonomy_path or _DEFAULT_TAXONOMY_PATH
        with open(self.taxonomy_path, "r", encoding="utf-8") as fh:
            self.taxonomy = json.load(fh)

        # Pre-compute valid value sets for fast, exact validation.
        self._valid_content_types = {
            c["value"] for c in self.taxonomy["content_types"]
        }
        self._valid_categories = {
            c["value"] for c in self.taxonomy["primary_categories"]
        }
        self._valid_signals = {
            s["value"] for s in self.taxonomy["trend_signals"]
        }
        self._valid_spirits = {
            s["value"] for s in self.taxonomy["spirits_types"]
        }
        self._valid_personas = {
            p["value"] for p in self.taxonomy["buyer_personas"]
        }
        self._valid_aeo = {
            a["value"] for a in self.taxonomy["aeo_citation_opportunity"]
        }
        self._valid_regions = (
            {r["region"] for r in self.taxonomy["regions_wine"]}
            | {r["region"] for r in self.taxonomy["regions_spirits"]}
            | {self.DEFAULT_REGION}
        )
        # Thailand-focus levels for reference/validation. "" maps to "none".
        # Backward compatible: default to the canonical set if the key is
        # absent from an older taxonomy.json.
        self._valid_thailand_focus = set(
            self.taxonomy.get("thailand_focus_levels", ["high", "medium", "none"])
        )
        # Beverage-relevance levels for reference/validation. Backward
        # compatible: default to the canonical set if the key is absent.
        self._valid_beverage_relevance = set(
            self.taxonomy.get(
                "beverage_relevance_levels", ["high", "medium", "low"]
            )
        )

    # -- public API -----------------------------------------------------

    def categorize(self, articles: List[Dict]) -> List[Dict]:
        """Add classification fields to each article and return them.

        Mutates each dict in place (and returns the list) so callers can
        chain this after deduplication. Fields added/overwritten:
        ``content_type``, ``primary_category``, ``topic_region``,
        ``spirits_type``, ``trend_signals``, ``buyer_persona``,
        ``aeo_citation_opportunity``.
        """
        enriched: List[Dict] = []
        for article in articles:
            content_type = self._detect_content_type(article)
            article["content_type"] = content_type

            primary_category = self._detect_primary_category(article)
            article["primary_category"] = primary_category

            article["topic_region"] = self._detect_region(article)
            # spirits_type only meaningful for spirits content; NULL otherwise
            # per data-schema.md ("Conditional ... otherwise NULL").
            if primary_category == "spirits":
                article["spirits_type"] = self._detect_spirits_type(article)
            else:
                article["spirits_type"] = None

            article["trend_signals"] = self._detect_trend_signals(article)
            article["buyer_persona"] = self._detect_buyer_persona(article)
            article["aeo_citation_opportunity"] = self._estimate_aeo_value(article)
            # Cross-vertical Thailand geo-tagging (high / medium / "").
            article["thailand_focus"] = self._detect_thailand_focus(article)
            # Cross-vertical beverage relevance (high / medium / low). Computed
            # AFTER primary_category so the wine/spirits short-circuit works.
            article["beverage_relevance"] = self._detect_beverage_relevance(article)

            enriched.append(article)
        return enriched

    # -- detection helpers ----------------------------------------------

    def _detect_content_type(self, article: Dict) -> str:
        """Classify the article format from title/excerpt keywords."""
        text = self._text(article)

        if "review" in text:
            ct = "review"
        elif any(k in text for k in ("how to", "how-to", " guide", "guide ",
                                     "101", "tutorial", "explained")):
            ct = "guide"
        elif any(k in text for k in ("announce", "releases", "launch",
                                     "news", "unveil")):
            ct = "news"
        elif any(k in text for k in ("opinion", "why ", "perspective",
                                     "column")):
            ct = "opinion"
        else:
            # Fall back to whatever the collector set, else "news".
            existing = article.get("content_type")
            ct = existing if existing in self._valid_content_types else "news"

        return ct if ct in self._valid_content_types else "news"

    def _detect_spirits_type(self, article: Dict) -> str:
        """Classify the spirits category from keywords; default 'other'."""
        text = self._text(article)

        if any(k in text for k in ("whisky", "whiskey", "scotch", "bourbon",
                                    "rye")):
            st = "whisky"
        elif "gin" in text:
            st = "gin"
        elif "rum" in text:
            st = "rum"
        elif "tequila" in text:
            st = "tequila"
        elif "mezcal" in text:
            st = "mezcal"
        elif "cognac" in text:
            st = "cognac"
        elif "brandy" in text:
            st = "brandy"
        elif "vodka" in text:
            st = "vodka"
        elif "liqueur" in text:
            st = "liqueur"
        else:
            st = "other"

        return st if st in self._valid_spirits else "other"

    def _detect_region(self, article: Dict) -> str:
        """Detect the geographic region of focus from keywords."""
        text = self._text(article)

        # Ordered keyword -> taxonomy region map. First match wins.
        region_keywords = [
            (("bordeaux", "burgundy", "champagne", "rhone", "loire",
              "alsace", "provence"), "France"),
            (("cognac", "armagnac", "calvados"), "France"),
            (("tuscany", "piedmont", "veneto", "barolo", "chianti",
              "prosecco", "italian", "italy"), "Italy"),
            (("rioja", "ribera del duero", "priorat", "rias baixas",
              "sherry", "spanish", "spain"), "Spain"),
            (("napa", "sonoma", "paso robles", "california", "santa barbara"),
             "USA (California)"),
            (("oregon", "willamette", "washington state", "finger lakes"),
             "USA (Other)"),
            (("yamazaki", "nikka", "hokkaido", "japanese", "japan"), "Japan"),
            (("islay", "speyside", "highland", "lowland", "scotch",
              "scottish", "scotland"), "Scotland"),
            (("irish", "ireland"), "Ireland"),
            (("kentucky", "tennessee", "bourbon"), "USA"),
            (("jalisco", "oaxaca", "tequila", "mezcal", "mexican", "mexico"),
             "Mexico"),
            (("mendoza", "argentin"), "Argentina"),
            (("maipo", "casablanca valley", "carmenere", "chilean", "chile"),
             "Chile"),
            (("barossa", "margaret river", "yarra", "clare valley",
              "australian", "australia"), "Australia"),
            (("marlborough", "central otago", "hawkes bay",
              "new zealand"), "New Zealand"),
            (("mosel", "rheingau", "pfalz", "german", "germany"), "Germany"),
            (("douro", "alentejo", "portuguese", "portugal"), "Portugal"),
            (("santorini", "nemea", "greek", "greece"), "Greece"),
            (("stellenbosch", "franschhoek", "paarl",
              "south africa"), "South Africa"),
            (("georgia", "lebanon", "thailand", "thai"), "Emerging"),
        ]

        for keywords, region in region_keywords:
            if any(k in text for k in keywords):
                if region in self._valid_regions:
                    return region

        return self.DEFAULT_REGION

    def _detect_trend_signals(self, article: Dict) -> List[str]:
        """Scan for trend indicators; return a list of taxonomy values."""
        text = self._text(article)
        signals: List[str] = []

        # keyword groups -> exact taxonomy trend_signals value.
        signal_keywords = [
            (("scarce", "scarcity", "shortage", "allocation",
              "supply"), "scarcity/shortage"),
            (("price surge", "price spike", "prices rise", "expensive",
              "inflation", "soaring price"), "price_spike"),
            (("award", "medal", "winner", "best ", "gold ",
              "competition"), "award_winning"),
            (("sustainab", "organic", "biodynamic", "natural wine",
              "eco-"), "sustainability_focus"),
            (("celebrity", "influencer", "viral", "tiktok",
              "instagram"), "cultural_moment"),
            (("investment", "collector", "rare", "collectible",
              "auction"), "investment_opportunity"),
            (("counterfeit", "fake", "fraud", "authentication"),
             "counterfeit_warning"),
            (("emerging", "up-and-coming", "new region", "rising",
              "underrated", "overlooked"), "emerging_region"),
            (("health benefits", "antioxidant", "heart health",
              "good for you", "wellness"), "health_angle_positive"),
            (("health risk", "cancer", "liver", "warning", "harmful",
              "dangers of"), "health_angle_negative"),
            (("celebrity", "celebrity-owned", "actor", "musician",
              "athlete", "star-backed"), "celebrity_tie"),
            (("limited release", "limited edition", "limited run",
              "exclusive release", "small batch"), "limited_release"),
            (("viral", "tiktok", "instagram", "trending on", "went viral",
              "social media sensation"), "viral_on_social"),
            (("climate", "frost", "drought", "heatwave", "wildfire",
              "global warming", "vintage conditions"), "climate_impact"),
        ]

        for keywords, signal in signal_keywords:
            if any(k in text for k in keywords):
                if signal in self._valid_signals and signal not in signals:
                    signals.append(signal)

        return signals

    def _detect_primary_category(self, article: Dict) -> str:
        """Classify the major subject.

        A source-stamped vertical takes precedence: if the article already
        carries a non-empty ``primary_category`` that is a valid taxonomy
        value, it is authoritative and kept as-is. Only un-stamped (or
        invalid/empty) articles fall through to keyword detection, which now
        also infers the new verticals (food / lifestyle / travel /
        hospitality) as a fallback.
        """
        preset = article.get("primary_category")
        if isinstance(preset, str) and preset.strip() in self._valid_categories:
            return preset.strip()

        text = self._text(article)

        spirits_kw = ("whisky", "whiskey", "scotch", "bourbon", "rye", "gin",
                      "rum", "tequila", "mezcal", "cognac", "brandy", "vodka",
                      "liqueur", "spirits", "distill")
        wine_kw = ("wine", "vineyard", "vintage", "cabernet", "merlot",
                   "pinot", "chardonnay", "champagne", "bordeaux", "burgundy",
                   "riesling", "rose", "winery", "winemaker")
        food_kw = ("recipe", "restaurant", "chef", "dish", "cooking",
                   "cuisine", "menu", "dining", "food", "eatery")
        hospitality_kw = ("hotel", "resort", "hospitality", "lodging",
                          "guest experience", "concierge", "restaurant chain",
                          "foodservice")
        travel_kw = ("travel", "destination", "vacation", "flight", "airline",
                     "tourism", "getaway", "itinerary", "hotel stay")
        lifestyle_kw = ("luxury", "lifestyle", "fashion", "watches", "yacht",
                        "design", "estate", "couture", "high society")
        cultural_kw = ("culture", "history", "tradition",
                       "celebration", "festival")

        has_spirits = any(k in text for k in spirits_kw)
        has_wine = any(k in text for k in wine_kw)

        if has_spirits and not has_wine:
            cat = "spirits"
        elif has_wine and not has_spirits:
            cat = "wine"
        elif has_wine and has_spirits:
            # Both present -> broader food/beverage coverage.
            cat = "food"
        elif any(k in text for k in hospitality_kw):
            cat = "hospitality"
        elif any(k in text for k in travel_kw):
            cat = "travel"
        elif any(k in text for k in food_kw):
            cat = "food"
        elif any(k in text for k in lifestyle_kw):
            cat = "lifestyle"
        elif any(k in text for k in cultural_kw):
            cat = "cultural"
        else:
            cat = "other"

        return cat if cat in self._valid_categories else "other"

    def _detect_buyer_persona(self, article: Dict) -> str:
        """Infer the target audience segment from content cues."""
        text = self._text(article)

        if any(k in text for k in ("collector", "investment", "rare",
                                   "auction", "vintage", "cellar")):
            persona = "collector"
        elif any(k in text for k in ("how to", "how-to", "101", "guide",
                                     "review", "tasting", "explained",
                                     "beginner")):
            persona = "enthusiast"
        elif any(k in text for k in ("cheap", "budget", "affordable",
                                     "value", "everyday")):
            persona = "casual_drinker"
        else:
            persona = self.DEFAULT_BUYER_PERSONA

        return persona if persona in self._valid_personas else self.DEFAULT_BUYER_PERSONA

    def _estimate_aeo_value(self, article: Dict) -> str:
        """Estimate AEO citation opportunity as high / medium / low.

        high   -- guide/review content, or any trend signal present
        medium -- educational/research/spotlight content
        low    -- everything else (opinion, generic news)
        """
        content_type = article.get("content_type") or self._detect_content_type(article)
        signals = article.get("trend_signals")
        if signals is None:
            signals = self._detect_trend_signals(article)

        if content_type in ("guide", "review") or signals:
            value = "high"
        elif content_type in ("research", "spotlight"):
            value = "medium"
        else:
            value = "low"

        return value if value in self._valid_aeo else "low"

    def _detect_thailand_focus(self, article: Dict) -> str:
        """Classify cross-vertical Thailand relevance as high / medium / "".

        Two paths feed this field. A ``geo_focus: thailand`` source stamps a
        ``"medium"`` BASELINE (locally relevant); this keyword/Thai-script path
        then refines it:

        * A preset of ``"high"`` is authoritative -- KEEP it (never downgrade).
        * A preset of ``"medium"`` (the Thai-source baseline) is UPGRADED to
          ``"high"`` when an actual Thailand keyword/Thai-script signal matches,
          but is otherwise kept at ``"medium"`` (never downgraded to "").
        * With no preset: HIGH when a strong, word-boundaried signal
          (thailand/thai/bangkok/phuket/chiang mai/pattaya/koh samui/krabi/
          isaan, or any Thai-script char) appears in the TITLE or URL; MEDIUM
          when a strong signal appears only in the excerpt/body or a weaker
          signal (southeast asia / baht) appears anywhere; "" otherwise.

        Net effect: Thai-source + keyword -> high; Thai-source, no keyword ->
        medium; non-Thai source + keyword -> high; nothing -> "".

        Word-boundaried matching means "Thatcher", "thatched" and
        "Thanksgiving" never trigger a false positive on ``\\bthai\\b``.
        """
        if not isinstance(article, dict):
            return ""

        # An authoritative HIGH preset is never downgraded and short-circuits.
        preset = article.get("thailand_focus")
        preset = preset.strip() if isinstance(preset, str) else ""
        if preset == "high":
            return "high"

        title = article.get("title") or ""
        excerpt = article.get("content_excerpt") or ""
        url = article.get("article_url") or ""

        title_url = f"{title} {url}".lower()
        excerpt_lower = str(excerpt).lower()

        # Strong signal in the title or URL (or Thai script in the raw title)
        # -> HIGH.
        if (
            _THAILAND_STRONG_RE.search(title_url)
            or _THAI_SCRIPT_RE.search(str(title))
            or _THAI_SCRIPT_RE.search(str(url))
        ):
            return "high"

        # Strong signal only in the excerpt/body (or Thai script there), or a
        # weaker signal anywhere -> MEDIUM.
        if (
            _THAILAND_STRONG_RE.search(excerpt_lower)
            or _THAI_SCRIPT_RE.search(str(excerpt))
            or _THAILAND_WEAK_RE.search(f"{title_url} {excerpt_lower}")
        ):
            return "medium"

        # No keyword match. Preserve an existing MEDIUM baseline (the Thai-source
        # stamp) -- it is locally relevant even without an explicit keyword and
        # must never be downgraded. Otherwise: not Thailand-focused.
        if preset == "medium":
            return "medium"
        return ""

    def _detect_beverage_relevance(self, article: Dict) -> str:
        """Classify cross-vertical beverage relevance as high / medium / low.

        Answers "is this actually about premium wine/spirits?" so off-topic
        articles from broad lifestyle/travel/hospitality sources can be
        filtered out of the trend views (non-destructively -- a flag, never a
        delete).

        Resolution order:

        * A valid preset (``high`` / ``medium`` / ``low``) is authoritative and
          kept as-is -- an agent-set value WINS over the keyword fallback.
        * Else, a ``primary_category`` of wine or spirits is core -> ``high``.
        * Else, scan title+excerpt (lowercased):
            - a STRONG beverage term (word-boundaried) -> ``high``
            - else an ADJACENT food/drink/hospitality term -> ``medium``
            - else -> ``low``

        Word-boundaried matching means "ginger"/"beard" never trigger a false
        positive on ``\\bgin\\b`` / ``\\bbeer\\b``.
        """
        if not isinstance(article, dict):
            return "low"

        # A valid preset (agent-set) is authoritative and short-circuits.
        preset = article.get("beverage_relevance")
        preset = preset.strip().lower() if isinstance(preset, str) else ""
        if preset in self._valid_beverage_relevance:
            return preset

        # Core verticals are always highly relevant.
        category = article.get("primary_category")
        if isinstance(category, str) and category.strip() in ("wine", "spirits"):
            return "high"

        text = self._text(article)

        if _BEVERAGE_STRONG_RE.search(text):
            level = "high"
        elif _BEVERAGE_ADJACENT_RE.search(text):
            level = "medium"
        else:
            level = "low"

        return level if level in self._valid_beverage_relevance else "low"

    # -- helpers --------------------------------------------------------

    @staticmethod
    def _text(article: Dict) -> str:
        """Lowercased title + excerpt for case-insensitive keyword matching."""
        if not isinstance(article, dict):
            return ""
        title = article.get("title") or ""
        excerpt = article.get("content_excerpt") or ""
        return f"{title} {excerpt}".lower()
