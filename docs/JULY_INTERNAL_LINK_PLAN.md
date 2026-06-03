# July 2026 — Internal Link Plan (July content → real /blog SEO connection)

**Purpose.** Wire the July 2026 slate (planned in Notion) into the **52 live
June/earlier `/blog` articles** so link equity flows from new July pages to the
established money pages, and crawlers see cross-month topical depth. This is the
July counterpart to `docs/INTERNAL_LINK_PLAN.md` (June) and follows the same
rules.

**Canonical URL format** (authoritative source: `pipeline/data/content-index.json`
`canonical` field, i.e. each file's `<link rel="canonical">`):

```
https://th.wine-now.com/blog/<urlKey>.html      # Wine-Now
https://th.liq9.com/blog/<urlKey>.html          # LIQ9
```

> ⚠️ The live blog has been observed serving some slugs **without** `.html`
> (e.g. `/blog/buy-gin-online-thailand`). `content-index.json` canonicals carry
> `.html`. **Confirm the live form once** and apply consistently; this plan uses
> the canonical `.html` form. Cross-brand links are fine (Wine-Now ↔ LIQ9) but
> keep the bulk of each piece's links **same-brand**.

**Rules (inherited from June plan).**
- Every July piece links **out** to ≥3 contextually relevant targets (hub/spoke
  + cross-month) and, where it is itself a hub, is linked to by its spokes.
- Use **descriptive anchors**, never "click here." Relevance over volume.
- Do **not** add price, cart, or buy links — LINE CTA only (§9). These are
  editorial blog-to-blog links, not product links.
- Premium/BOFU July pieces should link to the **premium money pages** (most-
  expensive-wines, rare-collectible, VSOP-vs-XO cognac, capsule bar, buy-whisky-
  online) to concentrate equity on conversion-stage content.

---

## A. Live `/blog` target dictionary (52 articles, by urlKey)

**Wine-Now** (`https://th.wine-now.com/blog/<key>.html`)
`most-expensive-wines-2026` · `old-world-vs-new-world-wine` · `day10-rose-myths-debunked` ·
`day11-vintage-year` · `day12-champagne-price-2026` · `day14-wine-cheese-pairing` ·
`day16-wine-for-beginners` · `day19-aperitif-hour` · `tannin-explained` · `wine-acidity` ·
`day20-rare-collectible-wine` · `day22-wine-thai-food-5-dishes` · `day24-vegetarian-thai-wine` ·
`day26-rainy-season-drinks` · `day27-bangkok-hidden-wine-bars` · `day28-decanting-guide` ·
`day29-napa-2023-vintage` · `white-wines-summer` · `wine-storage-condo` · `wine-excise-tax-2026` ·
`natural-organic-biodynamic-wine` · `pinot-noir-101` · `wine-tourism-khao-yai` ·
`cabernet-sauvignon-101` · `champagne-vs-prosecco-vs-cava`

**LIQ9** (`https://th.liq9.com/blog/<key>.html`)
`proof-vs-abv` · `scotch-double-cask-vs-sherry` · `whisky-101` · `liq9-day11-hibiki-suntory` ·
`liq9-day11-vsop-vs-xo-cognac` · `liq9-day13-world-gin-day-2026` · `liq9-day14-capsule-bar-8-bottles` ·
`liq9-day16-mezcal-101` · `liq9-day17-jigger-vs-free-pour` · `liq9-day18-honey-whisky-cocktails` ·
`liq9-day19-fathers-day-gift-guide` · `liq9-day20-beyond-highball` · `liq9-day21-low-no-abv-cocktails` ·
`liq9-day22-congeners` · `liq9-day24-spirit-tasting-notes` · `liq9-day25-bangkok-cocktail-renaissance` ·
`liq9-day26-buy-whisky-online` · `liq9-day27-japanese-whisky-guide` · `liq9-day28-nas-whisky` ·
`liq9-day29-sake-101` · `macallan-guide` · `liq9-day30-indigenous-asian-spirits` ·
`liq9-day30-storing-spirits-wrong` · `spicy-thai-cocktails` · `buy-gin-online-thailand` ·
`bourbon-recommend` · `liq9-day9-single-malt-blended-grain`

---

## B. July piece → real `/blog` links (cross-month)

### Wine-Now — Heroes & premium (link equity → money pages)
| July piece (Brief) | Out-links to live `/blog/<key>.html` |
|---|---|
| French Wine 101 (JUL-C1) | `cabernet-sauvignon-101`, `pinot-noir-101`, `old-world-vs-new-world-wine`, `champagne-vs-prosecco-vs-cava` |
| Wine Tasting for Beginners (JUL-G1) | `tannin-explained`, `wine-acidity`, `day16-wine-for-beginners`, `old-world-vs-new-world-wine` |
| Building a Fine-Wine Cellar (JUL-A1, Hero/MOFU) | `most-expensive-wines-2026`, `day20-rare-collectible-wine`, `day11-vintage-year`, `wine-storage-condo`, `day29-napa-2023-vintage`, `day28-decanting-guide` |
| Grand Cru & First Growths (JUL-WS6, MOFU) | `most-expensive-wines-2026`, `day20-rare-collectible-wine`, `cabernet-sauvignon-101` |
| Serving Aged & Fine Wine / Coravin (JUL-WS2, MOFU) | `day28-decanting-guide`, `day11-vintage-year` |
| Build Your Starter Cellar (JUL-A5, MOFU) | `wine-storage-condo`, `most-expensive-wines-2026`, `old-world-vs-new-world-wine` |
| Everyday-Value Wines (JUL-A3, MOFU) | `day16-wine-for-beginners`, `old-world-vs-new-world-wine`, `white-wines-summer` |

### Wine-Now — education & spokes
| July piece | Out-links |
|---|---|
| Champagne 101 (JUL-C3) | `champagne-vs-prosecco-vs-cava`, `day12-champagne-price-2026` |
| Rosé 101 (JUL-WS3) | `day10-rose-myths-debunked`, `white-wines-summer` |
| Organic & Biodynamic (JUL-G7) | `natural-organic-biodynamic-wine` |
| Wine Serving Temperatures / Store Opened Bottle (JUL-G3/G4) | `wine-storage-condo`, `day28-decanting-guide` |
| Pairing Wine w/ Thai Street Food, Seafood, Som Tam (JUL-WS10/G8/G10) | `day22-wine-thai-food-5-dishes`, `day24-vegetarian-thai-wine` |
| Rainy-Season Wines (JUL-B8) | `day26-rainy-season-drinks`, `white-wines-summer` |
| Khao Yai Travel (JUL-T1) / Thai Wineries (JUL-S1) | `wine-tourism-khao-yai`, `day29-napa-2023-vintage` |
| Bangkok Wine Bars (JUL-T2) | `day27-bangkok-hidden-wine-bars` |

### LIQ9 — Heroes & premium
| July piece (Brief) | Out-links |
|---|---|
| Tequila 101 (JUL-D1) | `liq9-day16-mezcal-101`, `spicy-thai-cocktails` |
| Scotch Whisky 101 (JUL-E1) | `liq9-day9-single-malt-blended-grain`, `scotch-double-cask-vs-sherry`, `whisky-101`, `liq9-day27-japanese-whisky-guide` |
| Ultimate Rum Cocktail Guide (JUL-B1) | `liq9-day20-beyond-highball`, `spicy-thai-cocktails`, `liq9-day14-capsule-bar-8-bottles` |
| Home-Bar Tools 101 (JUL-G11) | `liq9-day17-jigger-vs-free-pour`, `liq9-day14-capsule-bar-8-bottles` |
| The Collector's Bar (JUL-A2, Hero/MOFU) | `liq9-day14-capsule-bar-8-bottles`, `liq9-day11-vsop-vs-xo-cognac`, `liq9-day27-japanese-whisky-guide`, `liq9-day28-nas-whisky`, `liq9-day30-storing-spirits-wrong` |
| 6 Bottles Serious Collection (JUL-A8, BOFU) | `liq9-day11-vsop-vs-xo-cognac`, `liq9-day27-japanese-whisky-guide`, `macallan-guide`, `liq9-day28-nas-whisky`, `liq9-day14-capsule-bar-8-bottles` |
| Best-Value Blended Scotch (JUL-E4, BOFU) | `liq9-day9-single-malt-blended-grain`, `whisky-101`, `scotch-double-cask-vs-sherry`, `liq9-day26-buy-whisky-online` |
| 5 Best-Value Bottles (JUL-A4, MOFU) | `buy-gin-online-thailand`, `liq9-day14-capsule-bar-8-bottles` |

### LIQ9 — recipes, technique & spokes
| July piece | Out-links |
|---|---|
| Gin & Tonic Guide (JUL-G16) | `buy-gin-online-thailand`, `liq9-day13-world-gin-day-2026` |
| Highball 101 (JUL-E?) | `liq9-day20-beyond-highball`, `spicy-thai-cocktails` |
| Tequila vs Mezcal (JUL-D4) / Tequila w/ Thai food (JUL-D5) | `liq9-day16-mezcal-101`, `spicy-thai-cocktails` |
| Mocktails & Low-ABV (JUL-F3) | `liq9-day21-low-no-abv-cocktails` |
| Hangover Myths (JUL-LS10) | `liq9-day22-congeners` |
| How to Read a Spirits Label (JUL-LS6) | `proof-vs-abv`, `liq9-day24-spirit-tasting-notes` |
| Bartender Lingo (JUL-?) | `liq9-day24-spirit-tasting-notes` |
| Thai & Asian Rums (JUL-B5) | `liq9-day30-indigenous-asian-spirits` |

---

## C. Dedup pairs — link-up resolution (June owns the topic on /blog)

These July topics **duplicate a live June `/blog` page**. Cleanest fix: keep
July only if it carries a distinct angle, and **link up to June's canonical** as
the authority. If no distinct angle, **swap/drop the July slot** (these three are
still ledger-only `Brief Ready`, no content drafted — low cost to drop).

| July (Brief) | June canonical it duplicates | Recommendation |
|---|---|---|
| Wine & Cheese Pairing Basics (JUL-GC) | `day14-wine-cheese-pairing` | **Swap or thin** → if kept, re-angle to "wine + Thai cheese/snacks" and link up. June owns the generic guide. |
| Do You Really Need to Decant? (JUL-G6) | `day28-decanting-guide` | **Swap or thin** → the premium JUL-WS2 (Serving Aged Wine/Coravin) already covers the enthusiast angle; this TOFU duplicate adds little. Link up if kept. |
| Bangkok Cocktail Bars First-Timers (JUL-T3) | `liq9-day25-bangkok-cocktail-renaissance` | **Re-angle** (already flagged) → beginner "where to start"; link up to June scene piece. Verify venues at publish. |

*(Already resolved in-content: Tequila/Scotch/Wine-Tasting/Negroni — see Notion.)*

---

## D. Within-July hub-and-spoke (Notion cross-refs)

Each cluster hub ↔ its spokes (these are Notion Brief-ID references, wired to
canonical July URLs once July builds to `/blog`):

- **Rum (JUL-B1 hub)** ↔ Daiquiri/Mojito/Piña Colada/World Rum Day/Thai Rums (B2–B6)
- **French Wine (JUL-C1 hub)** ↔ Champagne 101, Bordeaux vs Burgundy, Loire/Rhône, Pairing French + Thai (C3–C6)
- **Tequila (JUL-D1 hub)** ↔ Paloma/Margarita/Tequila vs Mezcal/Tequila + Thai food (D3–D6)
- **Scotch (JUL-E1 hub)** ↔ 5 Scotch Regions, Highball 101, Best-Value Blended Scotch (E2–E4)
- **Wine Tasting (JUL-G1 hub)** ↔ Label, Serving Temp, Glasses, Decant, Terms (G2–G9)
- **Home-Bar Tools (JUL-G11 hub)** ↔ Ice, Syrups, Garnish, Shake-vs-Stir, Starter kit
- **Collector's Bar (JUL-A2 hub, spirits)** ↔ 6 Bottles Serious Collection, Elevated Old Fashioned, Advanced Bartending, Best-Value Blended Scotch
- **Fine-Wine Cellar (JUL-A1 hub, wine)** ↔ Grand Cru, Serving Aged Wine/Coravin, Starter Cellar, Home Wine Rack, Everyday-Value, Best-Value buying guides

---

## E. Execution checklist
- [ ] Confirm live `.html` vs no-`.html` slug form once; apply consistently.
- [ ] Inject the §B cross-month links inline into Notion `Content EN/TH`
      (descriptive anchors) for the 8 Heroes + premium pieces.
- [ ] When July builds to `pipeline/public/content/*.html`, wire §B + §D as real
      `<a href>` canonical links; re-run the June link audit (`--score`) so every
      July page has ≥2 inbound and ≥3 outbound, zero orphans.
- [ ] Decide Wine & Cheese / Decanting (swap vs thin) per §C.
