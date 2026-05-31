"""Content Hub collectors package.

Exposes the collector classes used by the automated content collection
pipeline for Wine-Now and LIQ9.
"""

from collectors.base_collector import BaseCollector
from collectors.rss_collector import RSSCollector

__all__ = ["BaseCollector", "RSSCollector"]
