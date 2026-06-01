"""Tests for DashboardBootstrap (Task 9, TDD).

Written BEFORE the implementation. The helper creates the dashboard tab
structure (Dashboard, Trends, Regions, Brands, AEO Opportunities,
Editorial) in an existing hub spreadsheet and seeds formula cells, via the
Google Sheets API.

The API is mocked entirely: ``_get_service`` is the single seam (same
pattern as SheetsExporter), so no real credentials or network access are
ever required. The constructor must build without credentials.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from exporters.dashboard_bootstrap import DashboardBootstrap


SHEET_ID = "test-sheet-id-123"


@pytest.fixture
def boot():
    # Construct without real credentials -- __init__ must NOT connect.
    return DashboardBootstrap(
        sheet_id=SHEET_ID, credentials_path="config/does-not-exist.json"
    )


def _make_mock_service(existing_titles=None):
    """Build a mock Sheets service.

    ``existing_titles`` controls what spreadsheets().get() reports already
    exists, so create_dashboard_tabs can decide what to add vs skip.
    """
    existing_titles = existing_titles or []
    service = MagicMock()

    get = service.spreadsheets.return_value.get
    get.return_value.execute.return_value = {
        "sheets": [
            {"properties": {"title": title}} for title in existing_titles
        ]
    }

    batch = service.spreadsheets.return_value.batchUpdate
    batch.return_value.execute.return_value = {"replies": []}

    update = service.spreadsheets.return_value.values.return_value.update
    update.return_value.execute.return_value = {"updatedCells": 1}

    return service, get, batch, update


# -- construction -----------------------------------------------------


def test_constructs_without_credentials():
    # No file access, no network in the constructor.
    b = DashboardBootstrap(sheet_id=SHEET_ID, credentials_path="nope.json")
    assert b.sheet_id == SHEET_ID
    assert b._service is None


def test_default_tabs_match_guide():
    # The six dashboard tabs from DASHBOARD_GUIDE.md, in order.
    assert DashboardBootstrap.DASHBOARD_TABS == [
        "Dashboard",
        "Trends",
        "Regions",
        "Brands",
        "AEO Opportunities",
        "Editorial",
    ]


# -- create_dashboard_tabs --------------------------------------------


def test_create_dashboard_tabs_calls_batchupdate(boot):
    service, get, batch, _ = _make_mock_service(existing_titles=["Articles"])
    with patch.object(boot, "_get_service", return_value=service):
        result = boot.create_dashboard_tabs()

    batch.assert_called_once()
    _, kwargs = batch.call_args
    assert kwargs["spreadsheetId"] == SHEET_ID
    requests = kwargs["body"]["requests"]
    # One addSheet request per dashboard tab (none existed yet).
    titles = [r["addSheet"]["properties"]["title"] for r in requests]
    assert titles == DashboardBootstrap.DASHBOARD_TABS
    assert result["created"] == DashboardBootstrap.DASHBOARD_TABS
    assert result["skipped"] == []


def test_create_dashboard_tabs_skips_existing(boot):
    # Dashboard + Trends already present -> only the other four are added.
    service, get, batch, _ = _make_mock_service(
        existing_titles=["Articles", "Dashboard", "Trends"]
    )
    with patch.object(boot, "_get_service", return_value=service):
        result = boot.create_dashboard_tabs()

    _, kwargs = batch.call_args
    titles = [
        r["addSheet"]["properties"]["title"]
        for r in kwargs["body"]["requests"]
    ]
    assert titles == ["Regions", "Brands", "AEO Opportunities", "Editorial"]
    assert "Dashboard" in result["skipped"]
    assert "Trends" in result["skipped"]
    assert "Regions" in result["created"]


def test_create_dashboard_tabs_all_exist_no_batchupdate(boot):
    service, get, batch, _ = _make_mock_service(
        existing_titles=["Articles"] + DashboardBootstrap.DASHBOARD_TABS
    )
    with patch.object(boot, "_get_service", return_value=service):
        result = boot.create_dashboard_tabs()

    # Nothing to add -> we must not issue an empty batchUpdate.
    batch.assert_not_called()
    assert result["created"] == []
    assert sorted(result["skipped"]) == sorted(DashboardBootstrap.DASHBOARD_TABS)


def test_create_dashboard_tabs_fail_soft(boot):
    service = MagicMock()
    service.spreadsheets.return_value.get.side_effect = RuntimeError("boom")
    with patch.object(boot, "_get_service", return_value=service):
        result = boot.create_dashboard_tabs()

    assert "error" in result
    assert "boom" in result["error"]


# -- write_formulas ---------------------------------------------------


def test_write_formulas_calls_values_update(boot):
    service, _, _, update = _make_mock_service()
    formulas = {
        "A2": "Total articles",
        "B2": "=COUNTA(Articles!C2:C)",
    }
    with patch.object(boot, "_get_service", return_value=service):
        result = boot.write_formulas("Dashboard", formulas)

    update.assert_called_once()
    _, kwargs = update.call_args
    assert kwargs["spreadsheetId"] == SHEET_ID
    # USER_ENTERED so '=' strings are parsed as formulas.
    assert kwargs["valueInputOption"] == "USER_ENTERED"
    assert result["written"] == 2


def test_write_formulas_uses_correct_a1_ranges(boot):
    service, _, _, update = _make_mock_service()
    formulas = {"B2": "=COUNTA(Articles!C2:C)"}
    with patch.object(boot, "_get_service", return_value=service):
        boot.write_formulas("Trends", formulas)

    _, kwargs = update.call_args
    # Single-cell write targets the tab-qualified A1 range.
    assert kwargs["range"] == "Trends!B2"
    assert kwargs["body"]["values"] == [["=COUNTA(Articles!C2:C)"]]


def test_write_formulas_empty_no_api_call(boot):
    service, _, _, update = _make_mock_service()
    with patch.object(boot, "_get_service", return_value=service):
        result = boot.write_formulas("Dashboard", {})
    update.assert_not_called()
    assert result["written"] == 0


def test_write_formulas_fail_soft(boot):
    service = MagicMock()
    service.spreadsheets.return_value.values.return_value.update.side_effect = (
        RuntimeError("kaboom")
    )
    with patch.object(boot, "_get_service", return_value=service):
        result = boot.write_formulas("Dashboard", {"A1": "=1+1"})

    assert result["written"] == 0
    assert "error" in result
    assert "kaboom" in result["error"]


# -- seed_default_formulas --------------------------------------------


def test_seed_default_formulas_writes_each_seeded_tab(boot):
    service, _, _, update = _make_mock_service()
    with patch.object(boot, "_get_service", return_value=service):
        result = boot.seed_default_formulas()

    # At least one update call per tab that has starter formulas.
    assert update.call_count >= 1
    # Every tab written must be a known dashboard tab.
    for tab in result["seeded"]:
        assert tab in DashboardBootstrap.DASHBOARD_TABS
    # The summary Dashboard tab is always seeded with its headline metrics.
    assert "Dashboard" in result["seeded"]
