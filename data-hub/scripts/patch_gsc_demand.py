#!/usr/bin/env python3
"""
patch_gsc_demand.py — Apply real GSC impression counts to the WNLQ9 topic libraries.

Reads the Intel_ContentGap table (keyword | site | impressions | clicks | avg_rank |
market_articles) extracted from the Google Sheet file, fuzzy-matches each topic
library row's Primary Keyword against the GSC keyword list, and updates:

  - Demand Signal  → actual impression count (int) when matched
  - GSC Impressions → raw impression count (new column, always written)

Impression → demand tier mapping (mirrors operationalize_topic_library.py scoring):
  ≥1000  → "High"   (30 pts)
  100–999 → "Medium" (20 pts)
  <100   → "Low"    (10 pts)

Qualitative fallback if no GSC match: existing Demand Signal value is preserved.

Run from repo root:
    python3 data-hub/scripts/patch_gsc_demand.py

Outputs:
  - wine-now-topic-library.csv   (updated)
  - liq9-topic-library.csv       (updated)
  - topic-library-master.csv     (rebuilt from both updated files)
"""

import csv
import json
import os
import re
import sys

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WINE_CSV = os.path.join(ROOT, "wine-now-topic-library.csv")
LIQ9_CSV = os.path.join(ROOT, "liq9-topic-library.csv")
MASTER_CSV = os.path.join(ROOT, "topic-library-master.csv")

GSC_FILE = (
    "/Users/admin/.claude/projects/-Users-admin-WNLQ9-CONTENT/"
    "c5c04614-3abe-4103-bbe3-b16b55f63dee/tool-results/"
    "mcp-a15357b9-e66c-4108-8c95-e579744594c7-read_file_content-1780578074268.txt"
)

# ---------------------------------------------------------------------------
# Scoring helpers (must stay in sync with operationalize_topic_library.py)
# ---------------------------------------------------------------------------
DEMAND_PTS = {"High": 30, "Medium": 20, "Low": 10}
AEO_PTS = {"High": 30, "Medium": 20, "Low": 10}
INTENT_PTS = {"Transactional": 25, "Commercial": 20, "Informational": 10}
TYPE_PTS = {"Pillar": 15, "Guide": 8, "Spotlight": 5, "Blog": 0}


def impressions_to_demand(n: int) -> str:
    """Convert raw impression count to High/Medium/Low demand tier."""
    if n >= 1000:
        return "High"
    if n >= 100:
        return "Medium"
    return "Low"


def score(rec: dict) -> int:
    demand_val = rec.get("Demand Signal", "")
    # If demand is a numeric string (impression count stored as str), tier it first
    try:
        imp = int(demand_val)
        demand_key = impressions_to_demand(imp)
    except (ValueError, TypeError):
        demand_key = str(demand_val).strip()

    return (
        DEMAND_PTS.get(demand_key, 0)
        + AEO_PTS.get(rec.get("AEO Value", ""), 0)
        + INTENT_PTS.get(rec.get("Search Intent", ""), 0)
        + TYPE_PTS.get(rec.get("Content Type", ""), 0)
    )


def tier(s: int) -> str:
    if s >= 70:
        return "P1"
    if s >= 55:
        return "P2"
    return "P3"


# ---------------------------------------------------------------------------
# GSC extraction
# ---------------------------------------------------------------------------
def load_gsc_keywords():
    """
    Parse the Intel_ContentGap markdown table from the saved Sheet JSON file.
    Returns a dict keyed by lowercase keyword →
        {"site": str, "impressions": int, "clicks": int}
    Only wine-now rows are present in this dataset; liq9 has no GSC data yet.
    """
    with open(GSC_FILE, encoding="utf-8") as fh:
        raw = json.load(fh)
    content = raw["fileContent"]

    # Find the table header
    header_idx = content.find("| keyword | site | impressions |")
    if header_idx == -1:
        sys.exit("ERROR: Could not find Intel_ContentGap table in GSC file.")

    table_text = content[header_idx:]
    lines = table_text.split("\n")

    gsc = {}
    for line in lines[2:]:  # skip header + separator
        stripped = line.strip()
        if not stripped.startswith("|"):
            if stripped == "":
                continue
            break  # end of table
        parts = [p.strip() for p in stripped.split("|")]
        parts = [p for p in parts if p]  # remove empty
        if len(parts) < 4:
            continue
        keyword_raw = parts[0].replace("\\", "")
        site = parts[1]
        try:
            impressions = int(parts[2])
        except ValueError:
            continue
        try:
            clicks = int(parts[3])
        except ValueError:
            clicks = 0

        if site != "wine-now":
            continue  # only wine-now data is available

        kw_lower = keyword_raw.lower().strip()
        # Keep highest-impression entry if duplicates exist
        if kw_lower not in gsc or gsc[kw_lower]["impressions"] < impressions:
            gsc[kw_lower] = {
                "keyword": keyword_raw,
                "site": site,
                "impressions": impressions,
                "clicks": clicks,
            }

    return gsc


# ---------------------------------------------------------------------------
# Fuzzy matching
# ---------------------------------------------------------------------------
def normalise(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", text.lower())).strip()


def find_gsc_match(primary_kw, gsc):
    """
    Return best GSC entry for `primary_kw`, or None.

    Strategy (in order of confidence):
      1. Exact match on normalised key.
      2. GSC keyword is a substring of the topic keyword (or vice-versa).
      3. All words in the shorter token appear in the longer token.
    Returns the highest-impression match when multiple candidates qualify.
    """
    pk_norm = normalise(primary_kw)
    pk_words = set(pk_norm.split())

    candidates = []
    for gsc_key, entry in gsc.items():
        gsc_norm = normalise(gsc_key)
        gsc_words = set(gsc_norm.split())

        # Exact
        if pk_norm == gsc_norm:
            candidates.append((entry, 3))
            continue
        # Substring
        if gsc_norm in pk_norm or pk_norm in gsc_norm:
            candidates.append((entry, 2))
            continue
        # All words in shorter appear in longer (at least 2 shared words)
        overlap = pk_words & gsc_words
        if len(overlap) >= 2 and (
            overlap == pk_words or overlap == gsc_words
        ):
            candidates.append((entry, 1))

    if not candidates:
        return None
    # Prefer by confidence tier desc, then impressions desc
    candidates.sort(key=lambda x: (-x[1], -x[0]["impressions"]))
    return candidates[0][0]


# ---------------------------------------------------------------------------
# CSV I/O
# ---------------------------------------------------------------------------
def read_csv(path):
    """Return (fieldnames, rows)."""
    with open(path, encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)
    return fieldnames, rows


def write_csv(path, fieldnames, rows):
    with open(path, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in fieldnames})


# ---------------------------------------------------------------------------
# Core patch logic
# ---------------------------------------------------------------------------
def patch_rows(rows, fieldnames, gsc, brand):
    """
    Mutate rows in-place (Demand Signal, GSC Impressions, Priority Score, Priority).
    Returns (updated_rows, updated_fieldnames, match_log).
    """
    # Add GSC Impressions column if not present
    if "GSC Impressions" not in fieldnames:
        # Insert right after Demand Signal
        try:
            ds_idx = fieldnames.index("Demand Signal")
            fieldnames.insert(ds_idx + 1, "GSC Impressions")
        except ValueError:
            fieldnames.append("GSC Impressions")

    match_log = []
    for row in rows:
        pk = row.get("Primary Keyword", "").strip()
        if not pk:
            row.setdefault("GSC Impressions", "")
            continue

        match = find_gsc_match(pk, gsc)
        if match:
            impressions = match["impressions"]
            old_demand = row.get("Demand Signal", "")
            new_demand = impressions_to_demand(impressions)
            row["Demand Signal"] = new_demand
            row["GSC Impressions"] = impressions
            match_log.append({
                "brand": brand,
                "topic_keyword": pk,
                "gsc_keyword": match["keyword"],
                "impressions": impressions,
                "old_demand": old_demand,
                "new_demand": new_demand,
            })
        else:
            row.setdefault("GSC Impressions", "")

        # Recompute Priority Score and Priority
        s = score(row)
        row["Priority Score"] = s
        row["Priority"] = tier(s)

    return rows, fieldnames, match_log


# ---------------------------------------------------------------------------
# Master CSV rebuild
# ---------------------------------------------------------------------------
def rebuild_master(wine_rows, liq9_rows):
    """Merge both brand rows, re-sort by Priority Score desc, write master CSV."""
    all_rows = wine_rows + liq9_rows

    # Determine combined fieldnames (union, preserving wine-now order as base)
    wine_fns, _ = read_csv(WINE_CSV)
    liq9_fns, _ = read_csv(LIQ9_CSV)
    master_fns = list(wine_fns)
    for f in liq9_fns:
        if f not in master_fns:
            master_fns.append(f)

    all_rows.sort(key=lambda r: (
        -int(r.get("Priority Score", 0) or 0),
        r.get("Brand", ""),
        r.get("Topic Title (Thai | EN)", ""),
    ))
    write_csv(MASTER_CSV, master_fns, all_rows)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("Loading GSC keywords...")
    gsc = load_gsc_keywords()
    # Only wine-now data present
    wine_gsc = {k: v for k, v in gsc.items() if v["site"] == "wine-now"}
    print(f"  Loaded {len(wine_gsc)} unique wine-now GSC keywords")

    # --- Wine-Now ---
    print("\nPatching wine-now-topic-library.csv...")
    wine_fns, wine_rows = read_csv(WINE_CSV)
    wine_rows, wine_fns, wine_matches = patch_rows(wine_rows, wine_fns, wine_gsc, "wine-now")
    write_csv(WINE_CSV, wine_fns, wine_rows)
    print(f"  Matched and updated: {len(wine_matches)} rows")

    # --- LIQ9 (no GSC data — preserve existing values, still rewrite for GSC Impressions column) ---
    print("\nPatching liq9-topic-library.csv (no GSC data available for liq9)...")
    liq9_fns, liq9_rows = read_csv(LIQ9_CSV)
    liq9_rows, liq9_fns, liq9_matches = patch_rows(liq9_rows, liq9_fns, {}, "liq9")
    write_csv(LIQ9_CSV, liq9_fns, liq9_rows)
    print(f"  Matched and updated: 0 rows (expected — no liq9 GSC data in this dataset)")

    # --- Master ---
    print("\nRebuilding topic-library-master.csv...")
    _, wine_rows_fresh = read_csv(WINE_CSV)
    _, liq9_rows_fresh = read_csv(LIQ9_CSV)
    rebuild_master(wine_rows_fresh, liq9_rows_fresh)
    print(f"  Master written: {len(wine_rows_fresh) + len(liq9_rows_fresh)} total rows")

    # --- Report ---
    all_matches = wine_matches + liq9_matches
    print(f"\n{'='*70}")
    print(f"SUMMARY: {len(all_matches)} topic rows matched to GSC keywords")
    print(f"{'='*70}")

    if all_matches:
        # Sort by impressions desc
        all_matches.sort(key=lambda m: -m["impressions"])
        print(f"\nALL MATCHES (sorted by impressions):")
        print(f"  {'Topic Keyword':<38} {'GSC Keyword':<38} {'Impr':>6}  {'Old':>6} -> {'New'}")
        print(f"  {'-'*38} {'-'*38} {'-'*6}  {'-'*6}    {'-'*6}")
        for m in all_matches:
            print(f"  {m['topic_keyword'][:38]:<38} {m['gsc_keyword'][:38]:<38} "
                  f"{m['impressions']:>6}  {m['old_demand']:>6} -> {m['new_demand']}")

        print(f"\nTOP 5 MATCHES:")
        for i, m in enumerate(all_matches[:5], 1):
            print(f"  {i}. [{m['brand']}] \"{m['topic_keyword']}\" "
                  f"→ GSC: \"{m['gsc_keyword']}\" "
                  f"({m['impressions']} impressions, {m['old_demand']} → {m['new_demand']})")
    else:
        print("\n  No matches found. Script is ready for when more GSC data arrives.")
        print("  Hint: GSC data is currently wine-now only. LIQ9 data would need to be")
        print("  added to the Sheet export for those rows to be matched.")

    # Demand signal change summary
    changed = [m for m in all_matches if m["old_demand"] != m["new_demand"]]
    print(f"\nDemand Signal changes: {len(changed)} rows updated "
          f"({len(all_matches) - len(changed)} already correct tier)")

    print(f"\nFiles updated:")
    print(f"  {WINE_CSV}")
    print(f"  {LIQ9_CSV}")
    print(f"  {MASTER_CSV}")


if __name__ == "__main__":
    main()
