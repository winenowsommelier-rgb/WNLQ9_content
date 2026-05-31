"""Content Hub processors package.

Post-collection processing for the automated content pipeline: removing
duplicate articles and enriching them with classification fields drawn
from the controlled vocabulary in config/taxonomy.json.
"""

from processors.categorizer import Categorizer
from processors.deduplicator import Deduplicator

__all__ = ["Deduplicator", "Categorizer"]
