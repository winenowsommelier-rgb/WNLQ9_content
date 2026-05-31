"""Content Hub ingestion pipeline package.

Exposes the orchestration layer that ties the collectors, processors, and
exporter together into a single daily ingestion run.

The ``IngestPipeline`` class is imported from :mod:`pipeline.ingest`. We
deliberately avoid eagerly importing it here so that ``python -m
pipeline.ingest`` does not emit a RuntimeWarning about the module already
being present in ``sys.modules``.
"""

__all__ = ["IngestPipeline"]
