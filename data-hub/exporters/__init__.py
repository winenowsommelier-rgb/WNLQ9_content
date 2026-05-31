"""Exporters for the Content Trend Data Hub.

Push processed, schema-conforming articles out to the chosen storage hub.
Currently provides :class:`SheetsExporter` for Google Sheets.
"""

from exporters.sheets_exporter import SheetsExporter

__all__ = ["SheetsExporter"]
