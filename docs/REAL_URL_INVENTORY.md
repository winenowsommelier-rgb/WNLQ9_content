# Real URL Inventory & Cannibalization Map — WN × LIQ9

**Source:** Google Search Console (authenticated, `winenowsommelier@gmail.com`), 2026-03-01→06-03,
pulled 2026-06-04. GA4 also connected. This is the **real, live** link graph for internal
linking. Sitemaps (`/sitemap.xml`) 503 to anonymous fetch (bot protection) — GSC is the
working source.

## Connections (for future pulls)
| System | Wine-Now | LIQ9 |
|---|---|---|
| GSC site (Supermetrics ds `GW`) | `https://th.wine-now.com/` | `https://th.liq9.com/` |
| GA4 property (ds `GAWA`) | `377750759` (WN TH - GA4) | `396617303` (LIQ9 TH - GA4) |

> ⚠️ **The new June/July articles are NOT published yet** (Strategy doc: "nothing Published,
> no Final URLs"). So new articles must internal-link to the **existing live pages below**,
> NOT to each other, until they go live on Magento and get real URLs.

## Wine-Now — live URL patterns (rich; link into these)
- **Category hubs:** `/wine/red-wine.html` `/wine/white-wine.html` `/wine/champagne-wine.html`
  `/wine/sparkling-wine.html` `/wine/rose-wine.html` `/wine/dessert-wine.html` `/wine/port-wine.html`
  `/wine.html` `/recommend.html` `/recommend/fast-delivery.html`
- **Curated selections:** `/wine-now-selection/<slug>.html` (e.g. `the-prosecco`,
  `great-wine-under-1000thb`, `napa-valley-selection`, `barolo`, `amarone-selection`,
  `non-alcoholic`, `chianti-classico`, `rose-champagne`)
- **Brand/landing pages:** `/penfolds` `/robert_mondavi` `/dom_perignon` `/moet_chandon`
  `/opus_one` `/domaine_de_la_romanee_conti` `/chateau_margaux` `/chateau_latour`
  `/chateau_lafite_rothschild` `/chateau_petrus` `/veuve_clicquot` `/louis_roederer`
  `/ruinart` `/cloudy_bay` `/granmonte` `/monsoon_valley` `/19_crimes` `/french-wine-guide`
  `/italian-wine-guide`
- **Top blog posts (highest impressions — anchor internal links here):**
  - `/blog/15-most-expensive-wine-in-the-world-en.html` — **150,778 imp** ⭐
  - `/blog/jack-daniel-s-tennessee-whiskey.html` — 54,126
  - `/blog/how-to-cheers-around-the-world.html` — 40,249
  - `/blog/18-noble-grapes-wine-challenge.html` — 31,712
  - `/blog/6-recommended-white-wine-for-beginners-th.html` — 28,488
  - `/blog/champagne-or-sparkling-wine.html` — 26,307
  - `/blog/3-reasons-to-buy-chateau-clerc-milon-th.html` — 24,206
  - `/blog/10-recommend-prosecco.html` — 21,658
  - `/blog/5-recommended-wine-for-beginners.html` — 16,843
- **Commerce:** product pages live at `/<product-slug>.html`; LINE CTA per Golden Rules.

## LIQ9 — live URL reality (thin)
- GSC shows **only `https://th.liq9.com/` (homepage) indexed** (1,710 imp), plus one
  near-zero bourbon blog + two image files. **No established blog/category graph to link
  into.** LIQ9 new articles can only safely link to the homepage + (to verify) category/
  product pages + LINE. Treat LIQ9 internal-linking as "build the graph from scratch."

## Cannibalization map — NEW content vs EXISTING live rankers (Wine-Now)
The new monthly articles risk competing with pages that already rank. Decide per row:
**REFRESH** the existing URL (preferred when it has real impressions) **or DIFFERENTIATE**
the new piece to a distinct angle that *links to* (not competes with) the incumbent.

| New article (slug) | Existing live ranker (imp) | Risk | Suggested |
|---|---|---|---|
| `day1-most-expensive-wines-2026` | `15-most-expensive-wine-in-the-world-en.html` (150,778) + `-th` + base | 🔴 high | REFRESH incumbent / canonical to it |
| `day16-wine-for-beginners` | `6-recommended-white-wine-for-beginners-th` (28k), `5-recommended-wine-for-beginners` (16.8k), `wine-selection-guide-for-complete-beginners` | 🔴 high | DIFFERENTIATE + link up |
| `day2-tannin` / `day2-wine-acidity` | `what-is-tannin.html` (8.6k), `what-is-body-tannin-and-acidity.html` | 🟠 med | DIFFERENTIATE |
| `day8-champagne-vs-prosecco-vs-cava` | `champagne-or-sparkling-wine` (26k), `cava-champagne-from-spain`, `5-minute-guide-to-sparkling-wine` | 🔴 high | DIFFERENTIATE / consolidate |
| `day28-decanting-guide` | `what-is-decanting`, `when-should-you-decant-wine`, `decant-vs-aerator` | 🟠 med | DIFFERENTIATE |
| `day14-wine-cheese-pairing` | `wine-and-cheese-pairing`, `cheese-board-x-wine` | 🟠 med | REFRESH/merge |
| `day10-rose-myths-debunked` | `what-is-rose-wine.html` (12k) | 🟠 med | DIFFERENTIATE |
| `day20-rare-collectible-wine` | `10-collectors-most-wanted-wine`, `top-30-premium-red-wine` | 🟠 med | DIFFERENTIATE (premium cluster) |
| `day12-champagne-price-2026` | `ultra-prestige-champagne`, `5-world-class-champagne-for-celebrate` | 🟠 med | DIFFERENTIATE |

## Premium signal (live demand for the "more premium" ask)
High-end/luxury already pulls real volume on Wine-Now — supports leaning the mix premium:
`15-most-expensive-wine-in-the-world` (150k), `top-30-premium-red-wine`, `ultra-prestige-champagne`,
`10-collectors-most-wanted-wine`, icon brand pages (DRC, Petrus, Lafite, Latour, Margaux, Opus One,
Dom Pérignon, Penfolds Bin/Grange). A premium cluster (fine-wine cellaring, investment/provenance,
icon-producer spotlights, prestige champagne) maps directly to existing demand.
