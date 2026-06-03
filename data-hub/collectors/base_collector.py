"""Abstract base collector for the Content Trend Data Hub.

Defines the common contract that every source collector must implement:
field validation against the schema's required fields and metadata
enrichment (source attribution + collection timestamp).

Field names match data-schema.md exactly (snake_case).
"""

from __future__ import annotations

import datetime
from abc import ABC, abstractmethod
from typing import Dict, List, Optional


class BaseCollector(ABC):
    """Abstract base class for all content collectors.

    Subclasses must implement :meth:`collect`. The base class provides
    shared validation and enrichment helpers so every collector produces
    dicts conforming to the Content Hub schema.
    """

    # Required fields per data-schema.md "Core Fields". Every collected
    # article must have all of these present and non-empty.
    REQUIRED_FIELDS: List[str] = [
        "source_name",
        "article_url",
        "title",
        "published_date",
        "content_type",
        "content_excerpt",
    ]

    def __init__(
        self,
        name: str,
        source_config: Optional[dict] = None,
        vertical: Optional[str] = None,
        geo_focus: Optional[str] = None,
    ) -> None:
        self.name = name
        self.source_config = source_config or {}
        # The content vertical this source belongs to (wine, spirits, food,
        # lifestyle, travel, hospitality, ...). When set, enrich_article stamps
        # it onto each article's primary_category so the source's vertical is
        # authoritative (the categorizer keeps a valid preset).
        self.vertical = vertical
        # Optional geographic focus of the SOURCE itself (cross-vertical, NOT a
        # vertical). When set to "thailand", enrich_article stamps every article
        # with a thailand_focus="medium" BASELINE -- a Thai-market source is
        # locally relevant, but source-membership alone is not enough to call an
        # article genuinely about Thailand (Thai outlets carry plenty of
        # off-topic content). The categorizer UPGRADES this to "high" when an
        # actual Thailand keyword/Thai-script signal matches, and never
        # downgrades it.
        self.geo_focus = geo_focus

    def validate_article(self, article: Dict) -> bool:
        """Return True only if all REQUIRED_FIELDS are present and non-empty.

        A field is considered empty if it is missing, ``None``, or (for
        strings) blank after stripping whitespace.
        """
        if not isinstance(article, dict):
            return False
        for field in self.REQUIRED_FIELDS:
            if field not in article:
                return False
            value = article[field]
            if value is None:
                return False
            if isinstance(value, str) and value.strip() == "":
                return False
        return True

    def enrich_article(self, article: Dict) -> Dict:
        """Add pipeline metadata to an article.

        Sets ``source_name`` (to this collector's name) and
        ``collected_date`` (current UTC time in ISO 8601). Returns the same
        dict instance for convenience.
        """
        article["source_name"] = self.name
        article["collected_date"] = self._utc_now_iso()
        # Stamp the source's vertical onto primary_category (no new column).
        # The categorizer treats a valid preset as authoritative and won't
        # overwrite it; keyword detection is the fallback for un-stamped items.
        if self.vertical:
            article["primary_category"] = self.vertical
        # Stamp source-level Thailand focus (cross-vertical) as a MEDIUM
        # baseline: a Thai-market source is locally relevant, but not
        # necessarily Thailand-topical (off-topic Bangkok Post politics should
        # not be "high"). The categorizer upgrades this to "high" on an actual
        # Thailand keyword/Thai-script match and never downgrades it.
        if self.geo_focus == "thailand":
            article["thailand_focus"] = "medium"
        return article

    @staticmethod
    def _utc_now_iso() -> str:
        """Current UTC time as an ISO 8601 string with a 'Z' suffix."""
        now = datetime.datetime.now(datetime.timezone.utc)
        # e.g. 2024-05-16T14:22:00Z
        return now.strftime("%Y-%m-%dT%H:%M:%SZ")

    @abstractmethod
    def collect(self) -> List[Dict]:
        """Fetch and return a list of validated, enriched article dicts."""
        raise NotImplementedError
