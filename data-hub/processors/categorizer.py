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
from typing import Dict, List, Optional

# config/taxonomy.json lives alongside this package, one level up.
_DEFAULT_TAXONOMY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "config",
    "taxonomy.json",
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

    # -- helpers --------------------------------------------------------

    @staticmethod
    def _text(article: Dict) -> str:
        """Lowercased title + excerpt for case-insensitive keyword matching."""
        if not isinstance(article, dict):
            return ""
        title = article.get("title") or ""
        excerpt = article.get("content_excerpt") or ""
        return f"{title} {excerpt}".lower()
