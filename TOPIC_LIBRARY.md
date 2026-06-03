# Topic Library — Wine-Now & LIQ9

The content production queue for both brands. Every blog topic lives here with a
priority score and a production status, so "what do we write next" is a sort, not
a meeting.

## Files

| File | What it is |
|---|---|
| `wine-now-topic-library.csv` | Wine-Now topics, normalized, ranked by priority. **88 topics** (11 published, 77 backlog). |
| `liq9-topic-library.csv` | LIQ9 topics, normalized, ranked by priority. **89 topics** (6 published, 83 backlog). |
| `topic-library-master.csv` | Both brands merged into one global ranked queue. **177 topics** (17 published, 160 backlog). |
| `data-hub/scripts/operationalize_topic_library.py` | The script that produces all three from the raw inputs. Re-runnable. |

All three share one schema. The per-brand files are the editing surface; the
master file is the cross-brand "what's next" view.

## Schema

| Column | Values | Notes |
|---|---|---|
| `Brand` | `wine-now`, `liq9` | |
| `Topic Title (Thai \| EN)` | free text | Thai title, then `\|`, then English. |
| `Content Type` | `Pillar`, `Blog`, `Guide`, `Spotlight` | Pillars anchor a content cluster. |
| `Primary Keyword` | free text | The head term the piece targets. |
| `Long-tail Keywords` | comma-separated | Secondary terms / fan-out queries. |
| `Search Intent` | `Informational`, `Commercial`, `Transactional` | Commercial/transactional lean toward revenue. |
| `Buyer Persona` | wine: `Explorer`, `Enthusiast`, `Collector` · liq9: `Casual Drinker`, `Enthusiast`, `Collector` | Beginner tier differs by brand by design (Explorer ≈ Casual Drinker). |
| `Category` | `Education`, `Tips & Guides`, `Spotlights`, `Pairing & Serving`, `Travel & Experiences`, `Cocktails & Mixing` | One shared taxonomy across both brands. |
| `Seasonality` | `Evergreen`, `Seasonal` | The window (Summer, Holidays, …) is kept in `Notes`. |
| `Demand Signal` | `High`, `Medium`, `Low` | **Qualitative estimate, not a real volume.** See "Adding real search volume". |
| `Thai Keyword` | free text | The Thai-language search term. |
| `AEO Value` | `High`, `Medium`, `Low` | Likelihood of being cited by AI answer engines. |
| `Priority Score` | 0–100 | Computed — see below. |
| `Priority` | `P1`, `P2`, `P3` | Tier derived from the score. |
| `Production Status` | `Published`, `Not started` | `Published` means a live article file exists. |
| `Article File` | path | The produced HTML under `pipeline/public/content/`, when published. |
| `Notes` | free text | Rationale, season window, mapping caveats, original LIQ9 AEO note. |

## Priority scoring

`Priority Score` is the sum of four signals — transparent and reproducible, no
black box:

| Signal | Points |
|---|---|
| Demand Signal | High 30 · Medium 20 · Low 10 |
| AEO Value | High 30 · Medium 20 · Low 10 |
| Search Intent | Transactional 25 · Commercial 20 · Informational 10 |
| Content Type | Pillar 15 · Guide 8 · Spotlight 5 · Blog 0 |

**Tiers:** P1 ≥ 70 · P2 55–69 · P3 < 55. Across the master queue: **60 P1, 48 P2,
69 P3.**

To re-weight (e.g. push commercial intent harder, or down-weight AEO), edit the
point tables at the top of `operationalize_topic_library.py` and re-run.

## Production status — how the 17 published articles map

16 articles + an index were already written in `pipeline/public/content/`. They
map to library rows like this:

**Direct matches (topic existed, article = that topic):**
- `day2-tannin.html` → Tannins Explained
- `day2-wine-acidity.html` → Acidity in Wine
- `day1-wine-label-old-world-vs-new-world.html` → Wine Labels Decoded
- `day3-wine-storage-condo.html` → Wine Cellar Storage (localized to condo / hot city)
- `day5-natural-organic-biodynamic.html` → Natural Wine (also covers the Organic Wine row)
- `day6-wine-tourism-khao-yai.html` → Thai Wine Tourism (Khao Yai)
- `liq9-day1-whisky-101.html` → Whisky 101
- `liq9-day3-macallan-guide.html` → The Macallan (broadened from "Macallan 25" to the full range)
- `liq9-day4-spicy-thai-cocktails.html` → Spirits & Thai Food (narrowed to spicy × cocktails)

**Net-new (article had no matching topic → added as a new row, status Published):**
- `day1-most-expensive-wines-2026.html` → The World's Most Expensive Wines 2026
- `day3-white-wines-summer.html` → White Wines for a Summer Party
- `day4-wine-excise-tax-2026.html` → Why Wine & Spirits Got Pricier in 2026 (cross-brand)
- `day5-pinot-noir-101.html` → Pinot Noir 101
- `day7-cabernet-sauvignon-101.html` → Cabernet Sauvignon 101
- `day5-proof-vs-abv.html` → Proof vs ABV (LIQ9)
- `liq9-day5-buy-gin-online.html` → Buy Gin Online Thailand (the informational "Gin 101" pillar stays backlog)
- `liq9-day7-bourbon-recommend.html` → Bourbon Recommendations (the informational "American Bourbon" row stays backlog)

The two "stays backlog" notes matter: a *commercial* buy/recommend article was
written, but the *informational* pillar/education topic it's adjacent to is still
unwritten. They're different pieces, so both remain in the queue.

## What this pass changed

- **One schema** across both brands (LIQ9's free-text "AI Citation Opportunity"
  became a `High/Med/Low` `AEO Value`; the original wording is preserved in `Notes`).
- **Deduped:** "Napa 2023" appeared twice in the wine library — merged to one row.
- **Fixed a data error:** one LIQ9 row had Buyer Persona = "Commercial" (not a
  persona) → set to Enthusiast.
- **Renamed for honesty:** "Est. Search Volume" → `Demand Signal` (it was never a
  real volume), "Thai Language Keyword" → `Thai Keyword`.
- **Added** `Brand`, `Priority Score`, `Priority`, `Production Status`,
  `Article File`, and the 8 net-new published rows.

## Recommended next batch

Top un-published **P1** topics (the highest-leverage things to write next):

**Wine-Now** (31 P1 in backlog):
1. Bangkok's Hidden Wine Bars (Pillar, Commercial) — 95
2. Buying Wine Online in Thailand: The Checklist (Transactional) — 85
3. Wine 101: Your Ultimate Wine Buying Guide (Pillar) — 85
4. Wine Geography: Bordeaux, Burgundy & Beyond (Pillar) — 85
5. The World's Best Wine Regions (Pillar) — 85
6. Champagne Producers You Should Know (Commercial) — 80
7. Moo Kata x Wine / Bangkok Seafood x Wine (Commercial pairings) — 80
8. Wine Recommendations Under 1,000 Baht (Commercial) — 80

**LIQ9** (17 P1 in backlog):
1. Yamazaki Distillery (Spotlight, Commercial) — 85
2. Cocktail 101 / Gin 101 / Rum 101 / Tequila 101 (the four un-written Pillars) — 85
3. Cognac 101 (Pillar) — 75
4. Hennessy XO · Jameson · Tanqueray · Bacardi (commercial brand Spotlights) — 75

Sort `topic-library-master.csv` by `Priority Score` desc and filter
`Production Status = Not started` for the full live list.

## Known issues & follow-ups

1. **Wine Thai titles are machine-garbled.** Many wine rows have broken Thai
   titles (e.g. "Tannins Explained" rendered as *"ทำไมขนาดของไวน์ถึงสำคัญ"* — "why
   wine *size* matters"). The English titles and keywords are sound. **Before
   producing any wine topic, write a fresh Thai title** per the content playbook —
   don't trust the stored Thai title. (LIQ9 Thai titles are noticeably cleaner.)
   This is a content rewrite, intentionally out of scope for this operationalization
   pass — flag it for a dedicated pass if you want the library itself cleaned.

2. **Demand Signal & AEO Value are qualitative.** They're informed estimates, not
   measured numbers — deliberately, so nothing is fabricated. See below for how to
   replace them with real data.

3. **LIQ9 AEO Value was derived heuristically** from the original free-text notes
   (keyword classifier in the script). The source wording is preserved in `Notes`
   as "AEO note: …" so any row can be hand-corrected.

### Adding real search volume (the "where available" upgrade)

Two real sources exist; both are follow-ups, not blockers:

- **Ahrefs Keywords Explorer** — true monthly volume + difficulty per `Primary
  Keyword`. The cleanest replacement for `Demand Signal`.
- **Supabase GSC views** (already wired: `dashboard/supabase/migrations/20260603_dashboard_seo_views.sql`,
  `pipeline/scripts/ga-gsc-from-supabase.mjs`) — real impressions for terms the
  sites already rank for. Note: coverage is currently thin because most library
  keywords are English/informational while live GSC demand skews Thai/branded, so
  this validates a subset rather than the whole library.

Either can be joined in as a new `Real Volume` column without disturbing the
existing schema. Ask and I'll wire it.

## Re-running

```bash
python3 data-hub/scripts/operationalize_topic_library.py
```

The script keeps a pristine copy of each original CSV under
`/tmp/wnlq9_topic_orig/` on first run and always reads from there, so re-runs are
safe even though it overwrites the canonical files. To start over from the true
originals, `git checkout` the two CSVs and delete that temp folder.
