# July 2026 — Cannibalization & Premium Audit

**Board:** `2026 JUL - WNLQ9 - Content Production` (`93ac15a8…`, data source
`collection://d342f9b8-3725-4068-9ccb-03b09821b0c8`). Audit 2026-06-04, based on the
~50 rows surfaced via semantic search (25 Wine-Now + 25 LIQ9) + 3 full-row samples.
Cross-referenced vs June (`docs/notion-drive-sweep-map.json`) and live rankers
(`docs/REAL_URL_INVENTORY.md`).

## Board reality (corrects the stale strategy-doc note)
The strategy doc says July is "generic, briefs empty." **Not true as of now:** every
sampled row is **briefed (KEY/TENSION/STORY/CTA/Brief ID) and has a draft**. But depth
is uneven:
- **Premium Hero** (`JUL-A1` Fine-Wine Cellar) = full ~2,500-word v2 draft, already
  "ELEVATED → fine-wine collector tier" on 2026-06-03.
- **Standard blogs** (`JUL-G7` organic, `JUL-D4` tequila-vs-mezcal, …) = **stub drafts**
  (~150–200 words: short answer + bullets + FAQ) against a 1,000-word target. **These
  violate Golden Rule #1 (no brief-style drafts) and must be expanded to v2 depth before
  HTML.**

## Two systemic fixes (apply board-wide)
1. **Internal links point to unpublished/assumed URLs.** Drafts link to guessed June
   paths like `https://th.wine-now.com/blog/day20-rare-collectible-wine.html` and
   `…/most-expensive-wines-2026.html` — these aren't live (June unpublished) and the slug
   is a guess. **Fix:** link to confirmed live rankers from `REAL_URL_INVENTORY.md`
   (e.g. the real `15-most-expensive-wine-in-the-world-en.html`), and only cross-link to
   sibling June/July articles once their real Final URLs exist. Don't hard-code guessed slugs.
2. **Stub → v2 expansion** required on all Standard rows at HTML time.

## A) True duplicates of FINISHED June articles → resolve (don't ship twice)
| July row | June twin (done) | Call |
|---|---|---|
| Organic & Biodynamic Wine Explained (`JUL-G7`, Day27) | `day5-natural-organic-biodynamic` (full) | **CUT or replace** July row — June already covers it at depth |
| Bangkok's New Wine Bars 2026 | `day27-bangkok-hidden-wine-bars` | **Differentiate** ("new openings 2026" vs "hidden gems") + cross-link, or cut |
| Khao Yai Wine Country in Rainy Season | `day6-wine-tourism-khao-yai` + `day26-rainy-season-drinks` | **Cut/merge** — June covers both halves |
| Bangkok Cocktail Bars for First-Timers 2026 (LIQ9) | `liq9-day25-bangkok-cocktail-renaissance` | **Differentiate** ("beginner-friendly" vs "renaissance/high-end") + link |

## B) Overlap but defensible as distinct angle → differentiate + link up (default)
| July row | Incumbent (June / live) | Angle to hold |
|---|---|---|
| Tequila vs Mezcal (`JUL-D4`) | June `liq9-day16-mezcal-101` | ✅ already links up — comparison angle. Keep. |
| Wine Tasting for Beginners | June `day16-wine-for-beginners` + live beginners posts | "how to taste (look/smell/taste)" vs "how to choose" |
| Champagne 101 | June `day8-champagne-vs-prosecco-vs-cava` + `day12-champagne-price` + live `champagne-or-sparkling-wine` (26k) | "what is champagne/sparkling 101" vs comparison vs price |
| Read a Wine Label in 5 Min | June `day1-wine-label-old-world-vs-new-world` + live `how-to-read-wine-labels` | quick how-to vs old/new-world framing |
| Dessert Wine 101 | live `wine/dessert-wine.html`, `history-of-port-wine` | 101 explainer; link to category + product |
| Best Alcohol-Free Wines 2026 | live `wine-now-selection/non-alcoholic` (3.1k) | link to the live selection page (commercial) |

## C) Intra-July over-clustering (the biggest issue) → consolidate
- **"X bottles for bar/collection" — 5 July rows + 1 June.** Home Wine Rack: 6 Bottles ·
  5 Best-Value Bottles for Home Bar · 3 Bottles That Round Out Any Home Bar · The
  Collector's Bar (premium) · 6 Bottles That Mark a Serious Collection (premium)
  [+ June `liq9-day14-capsule-bar-8-bottles`]. → **Collapse to 2 per site max:** one
  *entry* ("starter bar/rack") + one *premium* ("collector's bar"). Merge the two premium
  twins; merge the two entry spirits twins.
- **Tequila/agave — 6 July rows.** Tequila 101 · Tequila vs Mezcal · Tequila Day (3 ways)
  · Paloma 101 · Margarita · Tequila with Spicy Thai Food. → Keep Tequila 101 (pillar),
  Tequila vs Mezcal (compare), Margarita (hero cocktail), Tequila Day (timely peg, Jul 24).
  **Merge** Paloma into the cocktail set or Tequila-Day; **merge** "Tequila with Thai food"
  into a single Thai-pairing-with-agave note.
- **Thai-food wine pairing — 5 rows.** Thai Street Food · Som Tam (⊂ street food) · Thai
  Seafood · French Wine with Thai Food · Chocolate [+ June `day22-wine-thai-food-5-dishes`].
  → **Merge** Som Tam into Street Food; keep Seafood + French-with-Thai + Chocolate distinct.
- **Rum — 3 rows.** World Rum Day (3 cocktails, timely) · Ultimate Rum Cocktail Guide
  (evergreen) · Thai & Asian Rums. → Differentiate timely-vs-evergreen clearly, or merge
  the two cocktail pieces.
- **Scotch — 3 rows.** Scotch Whisky 101 · The 5 Scotch Regions · Best-Value Blended Scotch.
  → "Regions" overlaps "101"; **merge** regions into 101 (regions = one section) or make 101
  = what-is-scotch and Regions = deep-dive that links up.
- **Wine glasses — 2 rows.** How to Hold a Wine Glass · Choosing Wine Glasses (3 shapes)
  [+ live `how-to-choose-wine-glass-ep1`]. → **Merge** into one glassware guide.
- **Cocktail-101 — 8 recipes** (Whisky Sour, Margarita, Mojito, Espresso Martini, Paloma,
  G&T, 2-ingredient, Mocktail). Coherent as a *series* — keep, but **cross-link as a cluster**
  (each links to a "cocktail 101 hub") so they reinforce, not compete.

## D) Premium plan (user: do BOTH — new cluster + upgrade existing)
Already premium: Fine-Wine Cellar (wine Hero ✅), Collector's Bar + 6-Bottles-Serious
(spirits — merge to one). **Add to round out the cluster (maps to live high-traffic demand):**
- **Wine:** Icon-Producer Spotlight (DRC / Pétrus / Penfolds Grange — live brand pages pull
  real volume) · Prestige Champagne (vintage & grower) · "Most Expensive Wines" angle that
  links to the live 150k page rather than competing.
- **Spirits:** Rare/Collectible Whisky (ties to June Macallan/NAS/Japanese) · Luxury Cognac
  (XO+, ties to June VSOP-vs-XO).
- **Upgrade existing:** every Education/listicle row gets a premium-tier pick + real premium
  SKU card (from feed) alongside the value picks — so each piece spans value→premium.

## Net recommendation
Of ~50 rows: **~4 true-dup resolutions**, **~8 merges** (bottles ×3→2, tequila ×2,
thai-pairing ×1, scotch ×1, glasses ×1), the rest **differentiate + cross-link**. Net board
likely lands ~40 sharper rows + a fuller premium cluster. Then expand all Standard stubs to
v2 depth and wire real internal links at HTML time.
