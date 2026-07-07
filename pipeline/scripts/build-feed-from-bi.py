#!/usr/bin/env python3
"""Build pipeline/data/products.json (expanded, in-stock snapshot) from BI pulls.

Inputs (argv): saved execute_sql tool-result files (escaped JSON rows) from the
WNLQ9 PI DB `products` table — a wine pull and a spirits pull, each stratified
per SKU-prefix and ordered by popularity_score → sold_qty → has_recent_sales.

Output schema matches what the renderer consumes (src/products.mjs): category is
derived from the SKU prefix (the only reliable signal — `color` is null,
`liquor_main_type` sparse), refined to Cognac where the name/region says so.
units_sold_90d carries real `sold_qty` only (never fabricated). SKUs cited in the
July plan doc are PINNED (always kept if in-stock) so curation never drops them.
"""
import json, re, sys, datetime

OUT = "pipeline/data/products.json"
PLAN_DOC = "docs/CONTENT_PLAN_JULY_2026.md"

# Final per-prefix quotas (pinned SKUs are kept on top of these).
QUOTA = {"WRW": 82, "WWW": 24, "WSP": 24, "WRS": 12,
         "LWH": 30, "LTQ": 18, "LRM": 16, "LGN": 12, "LBD": 12, "LVK": 8, "LLQ": 8}
PREFIX_CAT = {
    "WRW": "Red Wine", "WWW": "White Wine", "WSP": "Sparkling Wine", "WRS": "Rosé Wine",
    "LWH": "Whisky", "LVK": "Vodka", "LTQ": "Tequila", "LRM": "Rum",
    "LGN": "Gin", "LBD": "Brandy", "LLQ": "Liqueur",
}
SPIRIT_PREFIX = {"LWH", "LVK", "LTQ", "LRM", "LGN", "LBD", "LLQ"}

try:
    PIN = set(re.findall(r"\b[WL][A-Z]{2}[0-9]{4}[A-Z0-9]{2}\b", open(PLAN_DOC).read()))
except FileNotFoundError:
    PIN = set()


def load(src):
    raw = open(src).read()
    seg = raw[raw.index('[{'):raw.rindex('}]') + 2]
    try:
        return json.loads(seg)                          # raw JSON file (pins)
    except json.JSONDecodeError:
        return json.loads(json.loads('"' + seg + '"'))  # escaped tool-result


def category_of(r):
    pfx = r["prefix"]
    name = (r.get("name") or "").lower()
    region = (r.get("region") or "").lower()
    lmt = (r.get("liquor_main_type") or "").strip()
    if pfx == "LBD" and ("cognac" in name or "cognac" in region):
        return "Cognac"
    if pfx in SPIRIT_PREFIX:
        if lmt and lmt not in ("Others", "Beer"):
            return {"Sake/Shochu": "Sake"}.get(lmt, lmt)
        return PREFIX_CAT[pfx]
    return PREFIX_CAT.get(pfx, "Wine")


rows, seen = [], set()
for src in sys.argv[1:]:
    for r in load(src):
        if r["sku"] not in seen:
            seen.add(r["sku"])
            rows.append(r)

# Per-prefix selection: pinned first, then fill the quota in input (rank) order.
chosen = []
for pfx, quota in QUOTA.items():
    pool = [r for r in rows if r["prefix"] == pfx]
    pinned = [r for r in pool if r["sku"] in PIN]
    rest = [r for r in pool if r["sku"] not in PIN]
    chosen += pinned + rest[: max(0, quota - len(pinned))]

# Rank the whole set by popularity then real sales (informational bestseller_rank).
chosen.sort(key=lambda r: ((r.get("pop") or 0), (r.get("sold_qty") or 0)), reverse=True)

products = [{
    "sku": r["sku"],
    "product_name": r["name"],
    "brand": r.get("brand") or None,
    "category_raw": category_of(r),
    "country": r.get("country") or None,
    "region": (r.get("region") or None) or None,
    "price_thb": r["price_thb"],
    "units_sold_90d": r.get("sold_qty"),            # real sales only; null when BI has none
    "in_stock": True,                                # universe is is_in_stock='1'
    "must_move": r.get("has_recent_sales") != 1,     # informational; unused by renderer
    "bestseller_rank": i,                            # informational; never surfaced
} for i, r in enumerate(chosen, 1)]

doc = {
    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    "source": ("WNLQ9 PI DB products (Supabase dsyplzckfezcxiuikkfm); in-stock only; "
               "price+stock live (products table updated 2026-06-27); ranking=popularity_score; "
               "units_sold_90d=real sold_qty where present (popularity_qty_90d deprecated/null); "
               "category from SKU prefix; July-plan SKUs pinned; revenue/margin/PII excluded"),
    "window_days": 90,
    "count": len(products),
    "products": products,
}
open(OUT, "w").write(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")

from collections import Counter
print("written:", OUT, "| count:", len(products))
print("brand:", "wine", sum(1 for p in products if p["sku"][0] == "W"),
      "| spirit", sum(1 for p in products if p["sku"][0] == "L"))
print("category_raw:", dict(Counter(p["category_raw"] for p in products)))
print("real units_sold_90d:", sum(1 for p in products if p["units_sold_90d"] is not None))
print("pinned present:", len(set(p["sku"] for p in products) & PIN), "/", len(PIN))
