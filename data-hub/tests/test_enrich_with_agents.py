"""Tests for the PURE helpers of the agent-enrichment operator script.

``scripts/enrich_with_agents.py`` is an operator CLI that talks to the live DB
(and, on --remirror, the live Sheets API) so it is NOT part of the mocked
suite (same convention as verify_sheets_setup.py / remirror_to_sheets.py).
The pure, side-effect-free building blocks ARE unit-tested here -- no DB, no
network, no filesystem, no clock:

* ``build_input_record``       -- DB row dict -> input.jsonl record shape.
* ``out_line_to_update_fields``-- out.jsonl object -> store.update_article args.
* ``select_where``             -- scope name -> (where_clause, params).
"""

from __future__ import annotations

import os
import sys

# Make the data-hub package + scripts importable.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts.enrich_with_agents import (
    build_input_record,
    out_line_to_update_fields,
    select_where,
)


# -- build_input_record ------------------------------------------------------


def test_build_input_record_shape_and_index():
    row = {
        "article_url": "https://example.com/napa",
        "title": "Napa Cabernet",
        "content_excerpt": "A look at Napa.",
        "source_name": "Decanter",
        "primary_category": "wine",
        # extra columns must be dropped:
        "kind": "backfill",
        "enriched": 0,
    }
    rec = build_input_record(row, 7)
    assert rec == {
        "n": 7,
        "url": "https://example.com/napa",
        "title": "Napa Cabernet",
        "excerpt": "A look at Napa.",
        "source": "Decanter",
        "vertical": "wine",
    }
    # Exactly the six expected keys, nothing else.
    assert set(rec) == {"n", "url", "title", "excerpt", "source", "vertical"}


def test_build_input_record_missing_fields_default_to_empty_strings():
    rec = build_input_record({"article_url": "https://x.com/a"}, 0)
    assert rec["n"] == 0
    assert rec["url"] == "https://x.com/a"
    assert rec["title"] == ""
    assert rec["excerpt"] == ""
    assert rec["source"] == ""
    assert rec["vertical"] == ""


def test_build_input_record_index_is_preserved_as_int():
    rec = build_input_record({"article_url": "u"}, 123)
    assert rec["n"] == 123
    assert isinstance(rec["n"], int)


# -- out_line_to_update_fields -----------------------------------------------


def _full_out_obj(**overrides):
    obj = {
        "url": "https://example.com/napa",
        "content_excerpt": "A clean factual summary.",
        "topic_region": "USA (California)",
        "spirits_type": "",
        "trend_signals": ["award_winning", "emerging_region"],
        "primary_category": "wine",
        "buyer_persona": "enthusiast",
        "aeo_citation_opportunity": "high",
        "thailand_focus": "",
        "beverage_relevance": "high",
    }
    obj.update(overrides)
    return obj


def test_out_line_maps_all_fields_and_sets_enriched():
    fields = out_line_to_update_fields(_full_out_obj())
    assert fields["content_excerpt"] == "A clean factual summary."
    assert fields["topic_region"] == "USA (California)"
    assert fields["spirits_type"] == ""
    assert fields["trend_signals"] == ["award_winning", "emerging_region"]
    assert fields["primary_category"] == "wine"
    assert fields["buyer_persona"] == "enthusiast"
    assert fields["aeo_citation_opportunity"] == "high"
    assert fields["thailand_focus"] == ""
    # The agent enrichment path also carries beverage_relevance through.
    assert fields["beverage_relevance"] == "high"
    # enriched is ALWAYS set to 1.
    assert fields["enriched"] == 1
    # url is the routing key, not an update column.
    assert "url" not in fields


def test_out_line_drops_unknown_keys():
    obj = _full_out_obj(some_garbage="x", another=42)
    fields = out_line_to_update_fields(obj)
    assert "some_garbage" not in fields
    assert "another" not in fields


def test_out_line_missing_url_returns_none():
    obj = _full_out_obj()
    del obj["url"]
    assert out_line_to_update_fields(obj) is None
    # Empty url also counts as missing.
    assert out_line_to_update_fields(_full_out_obj(url="")) is None
    assert out_line_to_update_fields(_full_out_obj(url=None)) is None


def test_out_line_trend_signals_json_array_string_to_list():
    fields = out_line_to_update_fields(
        _full_out_obj(trend_signals='["award_winning", "limited_release"]')
    )
    assert fields["trend_signals"] == ["award_winning", "limited_release"]


def test_out_line_trend_signals_pipe_string_to_list():
    fields = out_line_to_update_fields(
        _full_out_obj(trend_signals="award_winning | limited_release")
    )
    assert fields["trend_signals"] == ["award_winning", "limited_release"]


def test_out_line_trend_signals_already_list_passthrough():
    fields = out_line_to_update_fields(_full_out_obj(trend_signals=["a", "b"]))
    assert fields["trend_signals"] == ["a", "b"]


def test_out_line_trend_signals_empty_string_is_empty_list():
    fields = out_line_to_update_fields(_full_out_obj(trend_signals=""))
    assert fields["trend_signals"] == []


def test_out_line_trend_signals_missing_is_empty_list():
    obj = _full_out_obj()
    del obj["trend_signals"]
    fields = out_line_to_update_fields(obj)
    assert fields["trend_signals"] == []


def test_out_line_only_provided_fields_present():
    # A sparse out line: only url + one field. We still get enriched=1 and the
    # one field; absent classification keys are simply not written.
    fields = out_line_to_update_fields(
        {"url": "https://x.com/a", "primary_category": "spirits"}
    )
    assert fields["primary_category"] == "spirits"
    assert fields["enriched"] == 1
    # trend_signals is always normalized to a list even when absent.
    assert fields["trend_signals"] == []
    assert "topic_region" not in fields


# -- select_where ------------------------------------------------------------


def test_select_where_unenriched_is_default_clause():
    where, params = select_where("unenriched", months=6)
    # Treats NULL / '' / 0 all as un-enriched.
    assert "enriched" in where
    assert "0" in where
    assert params == []


def test_select_where_live_filters_kind_live():
    where, params = select_where("live", months=6)
    assert "kind = 'live'" in where


def test_select_where_recent_includes_live_or_recent_backfill():
    where, params = select_where("recent", months=6)
    assert "kind = 'live'" in where
    assert "backfill" in where
    assert "published_date >=" in where
    # The cutoff is passed as a bound parameter (ISO date string).
    assert len(params) == 1
    assert isinstance(params[0], str)


def test_select_where_all_has_no_filter():
    where, params = select_where("all", months=6)
    assert where.strip() == ""
    assert params == []


def test_select_where_unknown_scope_falls_back_to_unenriched():
    where_unknown, _ = select_where("bogus", months=6)
    where_default, _ = select_where("unenriched", months=6)
    assert where_unknown == where_default
