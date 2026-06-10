# Striking-Distance Roadmap — demand-led refresh/CTR priorities

**Source:** GSC pull 2026-03-01→06-03 (page-level: impressions, clicks, position). This is the
**demand-led roadmap** — fix what already gets impressions instead of guessing new topics.
Re-pull with **query-level** GSC to pin exact target keywords per page before editing (the
analytics connector gives `query` + `page`); page-level below is enough to prioritise.

## Two opportunity types
- **A) CTR fix** — good position (≤8) but low CTR → rewrite **title + meta + intent match**.
  Wins clicks with *no* ranking change. Fastest ROI.
- **B) Page-2 push** — position 9–15 with real impressions → **refresh/expand + internal links**
  to move onto page 1.

## 🔴 Type A — CTR fixes (rank is fine, clicks are leaking)
| Page | Imp | Clicks | CTR | Pos | Why / fix |
|---|---|---|---|---|---|
| `15-most-expensive-wine-in-the-world-en` | 150,778 | 362 | **0.24%** | 7.7 | flagship — title likely intent-mismatched; rewrite + consolidate (see consolidation map) |
| `accessory/wine-accessory/function-stopper` | 28,874 | 25 | **0.09%** | 7.7 | ranking for the wrong intent; re-title or noindex if not commercial |
| `how-to-cheers-around-the-world` | 40,249 | 267 | 0.66% | 6.2 | huge demand, weak title — strong CTR upside |
| `champagne-or-sparkling-wine` | 26,307 | 245 | 0.93% | 5.4 | pos 5 already — a title/meta rewrite alone should lift clicks |
| `accessory/glassware/wine-glass` | 8,129 | 25 | 0.31% | 12.7 | both A+B: fix intent *and* push |
| `what-is-rose-wine` | 12,138 | 141 | 1.16% | 7.6 | thin title; add the question users actually ask |

## 🟠 Type B — page-2 pushes (refresh + internal links to reach page 1)
| Page | Imp | Pos | Move |
|---|---|---|---|
| `robert_mondavi` (brand hub) | 16,139 | 11.2 | refresh + link from Mondavi product pages/blogs → page 1 |
| `10-prestige-Italian-wine` | 13,677 | 12.6 | expand + link from Italian category; premium intent |
| `5-recommended-wine-for-beginners` | 16,843 | 9.8 | merge into beginners pillar (see consolidation), then push |
| `top-10-best-selling-red-wine-of-2024` | 14,371 | 9.6 | **stale year** — refresh to 2026, reclaim |
| `10-affordable-bordeaux-wine` | 10,604 | 9.1 | expand; link from Bordeaux brand pages |
| `10-must-know-italian-wine-under-3000` | 3,648 | 10.7 | commercial; link to products |
| `10-vivino-plus-4-review-red-wine-under-3000` | 8,549 | 10.4 | refresh reviews; strong buy-intent |

## 🟢 Cross-brand signal → LIQ9 opportunity
`blog/jack-daniel-s-tennessee-whiskey.html` ranks on **wine-now** at **54,126 imp / pos 6.3**.
That's spirits demand landing on the wine site. **Action:** build the canonical Jack Daniel's /
American-whiskey page on **LIQ9**, cross-link from this WN post — seeds LIQ9's empty footprint
with proven demand. (Mirror for any other spirits terms ranking on WN.)

## Winners to protect & replicate (high CTR — study what works)
`donnafugata-rosa…` (6,156 imp / 1,685 clicks / **pos 2.7**, ~27% CTR) · `penfolds-bin-2`
(810 clicks / pos 4.3) · `jacob-s-creek-classic-cabernet` (707 / pos 6.0). Pattern: specific
product + buy-intent + good position. **Replicate** this template for other in-stock hero SKUs.

## How to run this monthly (ties to the cadence doc)
1. Pull GSC query+page, last 28 days.
2. Filter **position 5–15, impressions > ~2,000, CTR below the position benchmark**.
3. Bucket into A (CTR fix) vs B (push) vs new-gap.
4. Feed top ~10 into the month's board as **refresh** rows (not new URLs).
5. Read back next month; keep/kill.
