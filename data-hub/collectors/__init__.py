"""Content Hub collectors package.

Exposes the collector classes used by the automated content collection
pipeline for Wine-Now and LIQ9.
"""

from collectors.base_collector import BaseCollector
from collectors.rss_collector import RSSCollector
from collectors.sitemap_collector import SitemapCollector
from collectors.web_scraper import WebScraper

__all__ = ["BaseCollector", "RSSCollector", "SitemapCollector", "WebScraper"]
