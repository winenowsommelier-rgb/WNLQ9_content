#!/usr/bin/env python3
"""
Operationalize the Wine-Now & LIQ9 topic libraries.

Reads the two legacy CSVs (wine-now-topic-library.csv, liq9-topic-library.csv),
normalizes them to ONE shared schema, dedupes, maps already-produced articles to
their rows (Production Status), computes a transparent Priority Score, and writes:

  - wine-now-topic-library.csv   (normalized, priority-ranked)
  - liq9-topic-library.csv       (normalized, priority-ranked)
  - topic-library-master.csv     (both brands, one global ranked queue)

Run from repo root:  python3 data-hub/scripts/operationalize_topic_library.py

NOTE: "Demand Signal" and "AEO Value" are QUALITATIVE estimates (High/Med/Low),
not real search-volume numbers. No real volumes are fabricated here. Replace with
Ahrefs/GSC data when available (see TOPIC_LIBRARY.md).
"""
import csv
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

WINE_SRC = os.path.join(ROOT, "wine-now-topic-library.csv")
LIQ9_SRC = os.path.join(ROOT, "liq9-topic-library.csv")
CONTENT_DIR = "pipeline/public/content"  # relative path stored in Article File

# Idempotency guard: keep a pristine copy of each ORIGINAL (pre-normalization) CSV
# the first time we run, and always READ from that copy. This makes re-runs safe
# even though we overwrite the canonical files with the normalized output.
BACKUP_DIR = "/tmp/wnlq9_topic_orig"
ORIGINAL_HEADER = "Est. Search Volume"  # only present in the un-normalized schema


def resolve_source(path):
    """Return a path to the pristine original; create the backup on first run."""
    import shutil
    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup = os.path.join(BACKUP_DIR, os.path.basename(path))
    if not os.path.exists(backup):
        with open(path, encoding="utf-8") as fh:
            header = fh.readline()
        if ORIGINAL_HEADER not in header:
            sys.exit(
                f"ERROR: {path} is already normalized and no pristine backup exists "
                f"at {backup}. Restore the original (git checkout) before running."
            )
        shutil.copy2(path, backup)
    return backup

# ----------------------------------------------------------------------------
# Normalization maps
# ----------------------------------------------------------------------------
CATEGORY_MAP = {
    "Education": "Education",
    "Tips": "Tips & Guides",
    "Tips & Guides": "Tips & Guides",
    "Spotlights": "Spotlights",
    "Spotlight": "Spotlights",
    "Pairing": "Pairing & Serving",
    "Pairing & Serving": "Pairing & Serving",
    "Travel": "Travel & Experiences",
    "Travel & Experiences": "Travel & Experiences",
    "Cocktails & Mixing": "Cocktails & Mixing",
}
CONTENT_TYPE_MAP = {
    "Pillar": "Pillar",
    "Blog": "Blog",
    "Guide": "Guide",
    "Spotlight": "Spotlight",
    "Spotlights": "Spotlight",
}
# Persona: keep brand-native beginner tiers (wine=Explorer, liq9=Casual Drinker).
# Only fix the one data error in liq9 (persona "Commercial").
PERSONA_FIX = {"Commercial": "Enthusiast"}


def norm_seasonality(raw):
    """Return (Seasonality in {Evergreen, Seasonal}, season_window_note_or_None)."""
    raw = (raw or "").strip()
    if not raw or raw.lower().startswith("evergreen"):
        return "Evergreen", None
    # e.g. "Seasonal (Holidays)" -> ("Seasonal", "Holidays")
    window = None
    if "(" in raw and ")" in raw:
        window = raw[raw.index("(") + 1 : raw.index(")")].strip()
    return "Seasonal", window


# Heuristic: convert LIQ9's free-text "AI Citation Opportunity" -> High/Med/Low.
# Original free text is preserved verbatim in Notes ("AEO note: ...").
AEO_HIGH = (
    "highly cited", "very common", "foundational", "benchmark", "globally",
    "most popular", "most famous", "widely", "frequently asked", "ai search",
    "aeo query", "ai quer", "ai cocktail", "highly respected", "icon", "crown",
    "largest", "popular comparison", "popular aeo", "classic whisk",
)
AEO_LOW = (
    "niche", "budget-friendly", "basic ", "basic", "emerging", "auction",
    "preservation", "compliance", "rarest", "oldest irish", "gender", "health-conscious",
)


def aeo_from_text(text):
    t = (text or "").strip().lower()
    if t in ("high", "medium", "low"):
        return t.capitalize()
    for kw in AEO_HIGH:
        if kw in t:
            return "High"
    for kw in AEO_LOW:
        if kw in t:
            return "Low"
    return "Medium"


# ----------------------------------------------------------------------------
# Production status: produced article -> source row (1-based, matching dump order)
# Loose/divergent articles are NOT force-mapped; they are appended as NEW rows.
# ----------------------------------------------------------------------------
WINE_PUBLISHED = {
    3: ("day2-tannin.html", ""),
    4: ("day2-wine-acidity.html", ""),
    6: ("day1-wine-label-old-world-vs-new-world.html", "Article covers Old World vs New World label reading."),
    11: ("day5-natural-organic-biodynamic.html", "Article also covers Organic (overlaps row 'Organic Wine')."),
    16: ("day3-wine-storage-condo.html", "Article localized to condo / hot-city storage."),
    29: ("day6-wine-tourism-khao-yai.html", ""),
}
LIQ9_PUBLISHED = {
    1: ("liq9-day1-whisky-101.html", "Article framed as Scotch vs Bourbon vs Japanese."),
    6: ("liq9-day3-macallan-guide.html", "Broadened from Macallan 25 to full Macallan range (Double Cask, Sherry Oak)."),
    44: ("liq9-day4-spicy-thai-cocktails.html", "Narrowed to spicy Thai food x cocktails."),
}

# NEW rows = published articles with no matching topic (net-new). Status=Published.
# Columns: title, content_type, primary_kw, longtail, intent, persona, category,
#          seasonality, demand, thai_kw, aeo, notes, article_file
NEW_WINE = [
    ("ไวน์แพงที่สุดในโลก 2026: 20 อันดับ และขวดที่ดื่มแล้วใกล้เคียงในงบจริง | The World's Most Expensive Wines 2026 (+ Affordable Dupes)",
     "Spotlight", "most expensive wine", "most expensive wines 2026, expensive wine ranking, affordable wine alternatives, luxury wine dupes",
     "Commercial", "Collector", "Spotlights", "Evergreen", "High", "ไวน์แพงที่สุดในโลก",
     "High", "Listicle + affordable-dupe angle drives both authority and conversion.",
     "day1-most-expensive-wines-2026.html"),
    ("ไวน์ขาวสำหรับงานเลี้ยงฤดูร้อน: เลือกสไตล์ไหน เสิร์ฟกี่องศา จัดปาร์ตี้ยังไง | White Wines for a Summer Party: Styles, Temps & Hosting",
     "Blog", "white wine for summer", "white wine summer party, best white wine hot weather, serving temperature white wine, summer wine Thailand",
     "Commercial", "Explorer", "Pairing & Serving", "Seasonal", "High", "ไวน์ขาวหน้าร้อน",
     "High", "Season: Summer. Strong Thai hot-climate hook.",
     "day3-white-wines-summer.html"),
    ("ทำไมไวน์/เหล้าขึ้นราคาปี 2026: เข้าใจภาษีสรรพสามิตใหม่ และขวดที่ยังคุ้ม | Why Wine & Spirits Got Pricier in 2026: The New Excise Tax",
     "Blog", "wine excise tax thailand 2026", "thailand wine tax 2026, liquor excise tax, why wine expensive thailand, alcohol tax thailand",
     "Commercial", "Enthusiast", "Education", "Seasonal", "High", "ภาษีไวน์ 2026",
     "High", "Season: 2026 news. Cross-brand (also relevant to LIQ9 regulations row). Thai-specific, highly citable.",
     "day4-wine-excise-tax-2026.html"),
    ("Pinot Noir 101: ไวน์แดงเบาที่ใครๆ ก็รัก (รสชาติ–แหล่ง–คู่อาหาร) | Pinot Noir 101: Taste, Regions & Pairings",
     "Spotlight", "pinot noir", "pinot noir 101, pinot noir taste, pinot noir food pairing, best pinot noir thailand, light red wine",
     "Commercial", "Explorer", "Spotlights", "Evergreen", "High", "ปิโนต์ นัวร์",
     "High", "Single-varietal 101 spotlight (reveals a varietal-101 gap in the library).",
     "day5-pinot-noir-101.html"),
    ("Cabernet Sauvignon 101: รสชาติ แหล่งผลิต และขวดที่ดีที่สุดในแต่ละงบ | Cabernet Sauvignon 101: Taste, Regions & Best Bottles by Budget",
     "Spotlight", "cabernet sauvignon", "cabernet sauvignon 101, cabernet taste, best cabernet thailand, cabernet food pairing, full bodied red wine",
     "Commercial", "Explorer", "Spotlights", "Evergreen", "High", "กาแบร์เน ซ6วีญง",
     "High", "Single-varietal 101 spotlight (varietal-101 gap).",
     "day7-cabernet-sauvignon-101.html"),
]
NEW_LIQ9 = [
    ("Proof vs ABV: ระบบวัดแอลกอฮอล์ที่สับสนมา 200 ปี | Proof vs ABV: The 200-Year-Old Confusion Explained",
     "Blog", "proof vs abv", "what is proof alcohol, abv vs proof, alcohol percentage explained, whisky proof meaning",
     "Informational", "Casual Drinker", "Education", "Evergreen", "Medium", "พรูฟ vs ABV",
     "Medium", "Foundational spirits-literacy explainer; common AI question.",
     "day5-proof-vs-abv.html"),
    ("Buy Gin Online Thailand: คู่มือสไตล์จิน เลือกตาม botanical และสูตร G&T | Buy Gin Online Thailand: Styles, Botanicals & G&T",
     "Blog", "buy gin online thailand", "buy gin online thailand, gin delivery bangkok, best gin thailand, gin and tonic guide, gin styles",
     "Transactional", "Casual Drinker", "Tips & Guides", "Evergreen", "High", "ซื้อจินออนไลน์",
     "High", "Commercial buy-online angle (informational 'Gin 101' pillar still a backlog gap).",
     "liq9-day5-buy-gin-online.html"),
    ("Bourbon แนะนำ: เข้าใจกฎ 51% corn เลือกตามงบ และทำ Old Fashioned | Bourbon Recommendations: The 51% Rule, Budget Picks & Old Fashioned",
     "Spotlight", "bourbon recommendations", "best bourbon thailand, bourbon by budget, bourbon old fashioned, what is bourbon, bourbon buying guide",
     "Commercial", "Enthusiast", "Spotlights", "Evergreen", "High", "เบอร์เบินแนะนำ",
     "High", "Commercial recommendation angle (informational 'American Bourbon' education row stays backlog).",
     "liq9-day7-bourbon-recommend.html"),
]

# Dedupe: drop these 1-based source rows (merged into another).
WINE_DROP = {32}  # "Napa 2023 Vintage" dup of row 14 "Napa 2023"
LIQ9_DROP = set()

OUT_COLUMNS = [
    "Brand", "Topic Title (Thai | EN)", "Content Type", "Primary Keyword",
    "Long-tail Keywords", "Search Intent", "Buyer Persona", "Category",
    "Seasonality", "Demand Signal", "Thai Keyword", "AEO Value",
    "Priority Score", "Priority", "Production Status", "Article File", "Notes",
]

DEMAND_PTS = {"High": 30, "Medium": 20, "Low": 10}
AEO_PTS = {"High": 30, "Medium": 20, "Low": 10}
INTENT_PTS = {"Transactional": 25, "Commercial": 20, "Informational": 10}
TYPE_PTS = {"Pillar": 15, "Guide": 8, "Spotlight": 5, "Blog": 0}


def score(rec):
    s = (
        DEMAND_PTS.get(rec["Demand Signal"], 0)
        + AEO_PTS.get(rec["AEO Value"], 0)
        + INTENT_PTS.get(rec["Search Intent"], 0)
        + TYPE_PTS.get(rec["Content Type"], 0)
    )
    return s


def tier(s):
    if s >= 70:
        return "P1"
    if s >= 55:
        return "P2"
    return "P3"


def load(src, brand, published_map, drop):
    out = []
    with open(src, encoding="utf-8") as fh:
        for i, row in enumerate(csv.DictReader(fh), start=1):
            if i in drop:
                continue
            notes = (row.get("Notes") or "").strip()
            ctype = CONTENT_TYPE_MAP.get((row.get("Content Type") or "").strip(),
                                         (row.get("Content Type") or "").strip())
            cat = CATEGORY_MAP.get((row.get("Category") or "").strip(),
                                   (row.get("Category") or "").strip())
            persona = (row.get("Buyer Persona") or "").strip()
            persona = PERSONA_FIX.get(persona, persona)
            season, window = norm_seasonality(row.get("Seasonality"))
            if window:
                notes = (notes + f" Season: {window}.").strip()

            aeo_raw = (row.get("AI Citation Opportunity") or "").strip()
            aeo = aeo_from_text(aeo_raw)
            if aeo_raw and aeo_raw not in ("High", "Medium", "Low"):
                notes = (notes + f" AEO note: {aeo_raw}").strip()

            status, article = "Not started", ""
            if i in published_map:
                fname, extra = published_map[i]
                status = "Published"
                article = f"{CONTENT_DIR}/{fname}"
                if extra:
                    notes = (notes + " " + extra).strip()

            rec = {
                "Brand": brand,
                "Topic Title (Thai | EN)": (row.get("Topic Title (Thai | EN)") or "").strip(),
                "Content Type": ctype,
                "Primary Keyword": (row.get("Primary Keyword") or "").strip(),
                "Long-tail Keywords": (row.get("Long-tail Keywords") or "").strip(),
                "Search Intent": (row.get("Search Intent") or "").strip(),
                "Buyer Persona": persona,
                "Category": cat,
                "Seasonality": season,
                "Demand Signal": (row.get("Est. Search Volume") or "").strip(),
                "Thai Keyword": (row.get("Thai Language Keyword") or "").strip(),
                "AEO Value": aeo,
                "Production Status": status,
                "Article File": article,
                "Notes": notes,
            }
            out.append(rec)
    return out


def add_new(out, brand, rows):
    for (title, ctype, pk, longtail, intent, persona, cat, season, demand,
         thaikw, aeo, notes, article) in rows:
        out.append({
            "Brand": brand,
            "Topic Title (Thai | EN)": title,
            "Content Type": ctype,
            "Primary Keyword": pk,
            "Long-tail Keywords": longtail,
            "Search Intent": intent,
            "Buyer Persona": persona,
            "Category": cat,
            "Seasonality": season,
            "Demand Signal": demand,
            "Thai Keyword": thaikw,
            "AEO Value": aeo,
            "Production Status": "Published",
            "Article File": f"{CONTENT_DIR}/{article}",
            "Notes": (notes + " [Added: published article had no matching topic row].").strip(),
        })


def finalize(records):
    for r in records:
        s = score(r)
        r["Priority Score"] = s
        r["Priority"] = tier(s)
    # Stable ranked order: Priority Score desc, then Brand, then title.
    records.sort(key=lambda r: (-r["Priority Score"], r["Brand"], r["Topic Title (Thai | EN)"]))
    return records


def write_csv(path, records):
    with open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=OUT_COLUMNS)
        w.writeheader()
        for r in records:
            w.writerow({k: r.get(k, "") for k in OUT_COLUMNS})


def main():
    wine = load(resolve_source(WINE_SRC), "wine-now", WINE_PUBLISHED, WINE_DROP)
    add_new(wine, "wine-now", NEW_WINE)
    liq9 = load(resolve_source(LIQ9_SRC), "liq9", LIQ9_PUBLISHED, LIQ9_DROP)
    add_new(liq9, "liq9", NEW_LIQ9)

    wine = finalize(wine)
    liq9 = finalize(liq9)
    master = finalize(wine + liq9)

    write_csv(WINE_SRC, wine)
    write_csv(LIQ9_SRC, liq9)
    write_csv(os.path.join(ROOT, "topic-library-master.csv"), master)

    # ---- summary to stdout (for verification) ----
    def summarize(name, recs):
        from collections import Counter
        pub = sum(1 for r in recs if r["Production Status"] == "Published")
        pri = Counter(r["Priority"] for r in recs)
        aeo = Counter(r["AEO Value"] for r in recs)
        print(f"\n=== {name}: {len(recs)} topics | Published {pub} | Backlog {len(recs)-pub} ===")
        print(f"  Priority: {dict(pri)}   AEO: {dict(aeo)}")

    summarize("WINE-NOW", wine)
    summarize("LIQ9", liq9)
    summarize("MASTER", master)

    print("\n=== NEXT BATCH (top 15 un-published P1, global) ===")
    nb = [r for r in master if r["Production Status"] != "Published" and r["Priority"] == "P1"]
    for r in nb[:15]:
        en = r["Topic Title (Thai | EN)"].split("|")[-1].strip()
        print(f"  {r['Priority Score']:>3} {r['Brand']:<9} {r['Content Type']:<8} {r['Search Intent']:<13} {en[:60]}")
    print(f"\n  (total un-published P1: {len(nb)})")


if __name__ == "__main__":
    main()
