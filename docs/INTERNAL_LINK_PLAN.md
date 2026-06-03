# Internal-Linking & Cluster Plan

Source of truth: `pipeline/data/content-index.json` (regenerate with
`node pipeline/scripts/build-articles-manifest.mjs`). As of last run: **52
articles, 22 orphans** (0 inbound links). This doc is the **plan** — execute the
edits in the GA/GSC refresh pass so content changes + Drive re-delivery happen
once (and so winners/pillars are confirmed by data first).

## Goal
Hub-and-spoke clusters: every article links **up** to its pillar and **across**
to 2–4 siblings; every pillar is linked **to** from its spokes. No orphans.
Target: each article ≥2 inbound links; each pillar ≥6 inbound.

## ⚠️ Execution flag — link href convention
New Day 8–30 posts use canonical `…/blog/<fileSlug>.html`, so relative links
`href="<fileSlug>.html"` are consistent. **Legacy Day 1–7 posts strip the
`dayN-` prefix in their canonical** (file `day1-most-expensive-wines-2026.html`
→ live `most-expensive-wines-2026.html`). Before wiring links, confirm how
Magento serves these (file basename vs canonical basename) and use whichever the
live site resolves. `content-index.json` carries both `fileSlug` and `urlKey`.

---

## Pillars (hubs)
| Cluster | Pillar | Now |
|---|---|---|
| Wine — beginners | `day16-wine-for-beginners` (Hero) | under-linked |
| Wine — sparkling/celebration | `day12-champagne-price-2026` (Hero) | **orphan — fix first** |
| Spirits — whisky | `liq9-day1-whisky-101` | strong (21) ✓ |
| Spirits — home bar/cocktails | `liq9-day14-capsule-bar-8-bottles` | orphan |

---

## Wine-Now prescriptions (give each orphan ≥2 inbound)

**Sparkling / celebration → pillar `day12-champagne-price-2026`**
- Inbound from: `day8-champagne-vs-prosecco-vs-cava`, `day19-aperitif-hour`, `day20-rare-collectible-wine`, `day1-most-expensive-wines-2026`, `day16-wine-for-beginners`.
- Pillar links out to: those four + `day3-white-wines-summer`.

**Food pairing cluster** (interlink + each links up to `day16-wine-for-beginners`)
- `day14-wine-cheese-pairing` ↔ `day22-wine-thai-food-5-dishes` ↔ `day24-vegetarian-thai-wine` ↔ `day26-rainy-season-drinks` ↔ `day19-aperitif-hour`.

**Knowledge / care cluster** (interlink + up to beginners pillar)
- `day2-tannin`, `day2-wine-acidity`, `day28-decanting-guide`, `day3-wine-storage-condo`, `day11-vintage-year`, `day5-natural-organic-biodynamic`.
- `day4-wine-excise-tax-2026` ← inbound from `day1-most-expensive-wines-2026`, `day12-champagne-price-2026`, `day20-rare-collectible-wine`.

**Region / collecting cluster**
- `day29-napa-2023-vintage` ← inbound from `day7-cabernet-sauvignon-101`, `day20-rare-collectible-wine`, `day1-most-expensive-wines-2026`.
- `day6-wine-tourism-khao-yai` ↔ `day27-bangkok-hidden-wine-bars` ↔ `day19-aperitif-hour`.

**Grape/varietal 101s** (already well-linked) — add cross-links so each points to `day16-wine-for-beginners`: `day5-pinot-noir-101`, `day7-cabernet-sauvignon-101`, `day1-wine-label-old-world-vs-new-world`.

---

## LIQ9 prescriptions

**Whisky cluster → pillar `liq9-day1-whisky-101`** (wire inbound to these orphans)
- `liq9-day27-japanese-whisky-guide` ← from whisky-101, `liq9-day11-hibiki-suntory`, `liq9-day9-single-malt-blended-grain`.
- `liq9-day28-nas-whisky` ← from whisky-101, `liq9-day9-single-malt-blended-grain`, `day8-scotch-double-cask-vs-sherry`.
- `liq9-day26-buy-whisky-online` ← from whisky-101, `liq9-day3-macallan-guide`, `liq9-day28-nas-whisky`.
- `liq9-day18-honey-whisky-cocktails` ← from whisky-101, `liq9-day7-bourbon-recommend`, `liq9-day20-beyond-highball`.
- `liq9-day24-spirit-tasting-notes` ← from whisky-101, `liq9-day9-single-malt-blended-grain`, `liq9-day22-congeners`.
- `liq9-day22-congeners` ← from `liq9-day24-spirit-tasting-notes`, `liq9-day30-storing-spirits-wrong`, `day5-proof-vs-abv`.

**Home bar / cocktail cluster → pillar `liq9-day14-capsule-bar-8-bottles`**
- Inbound from: `liq9-day4-spicy-thai-cocktails`, `liq9-day17-jigger-vs-free-pour`, `liq9-day20-beyond-highball`, `liq9-day21-low-no-abv-cocktails`, `liq9-day25-bangkok-cocktail-renaissance`.
- `liq9-day25-bangkok-cocktail-renaissance` ↔ `liq9-day4-spicy-thai-cocktails` ↔ `liq9-day20-beyond-highball`.

**Category guides cluster** (interlink "world of spirits")
- `liq9-day13-world-gin-day-2026`, `liq9-day16-mezcal-101`, `liq9-day29-sake-101`, `liq9-day30-indigenous-asian-spirits`, `liq9-day11-vsop-vs-xo-cognac`, `liq9-day5-buy-gin-online`.
- `day5-proof-vs-abv` ← from `liq9-day1-whisky-101`, `liq9-day22-congeners`, `liq9-day28-nas-whisky`.

**Spirits gift / occasion**
- `liq9-day19-fathers-day-gift-guide` ← from whisky-101, `liq9-day11-vsop-vs-xo-cognac`, `liq9-day3-macallan-guide`, `liq9-day26-buy-whisky-online`.

**Care/storage**
- `liq9-day30-storing-spirits-wrong` ↔ `liq9-day28-nas-whisky`, `day5-proof-vs-abv`, `liq9-day22-congeners`.

---

## Execution checklist (data session)
1. Re-run `build-articles-manifest.mjs`; confirm orphan list.
2. Apply the inbound links above (a "อ่านต่อ / บทความที่เกี่ยวข้อง" block per article), using the live-URL convention confirmed per the flag.
3. Re-run `validate-articles.mjs` (all must PASS) → `inline-css.mjs` → Drive (clean names, after old dupes deleted) → Notion `Drive file URL`.
4. Re-run the manifest; assert **0 orphans** and every pillar ≥6 inbound.
