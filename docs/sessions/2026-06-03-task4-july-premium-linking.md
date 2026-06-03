# Task 4 — July content readiness + premium rebalance + real-blog linking

Branch: `claude/busy-wright-T1FtN` · Date: 2026-06-03

## Scope (as it evolved)
1. July content readiness: 8 Hero pillars ≥2,500 words, 7 dedup swaps, resolve [VERIFY].
2. (added) Rebalance toward the **premium persona** (more MOFU/BOFU).
3. (added) **Link July content to the real `/blog` articles** for SEO connection.

## Key state corrections (from live DB re-check)
- There are **8 Heroes, not 7** — the 2026-06-03 elevation turned two beginner
  pillars into premium heroes: **JUL-A1 Building a Fine-Wine Cellar** (wine) and
  **JUL-A2 The Collector's Bar** (spirits). A1 had been missed.
- July is **no longer 0 BOFU** — a premium/collector cluster was created by the
  elevation, but most pieces were undrafted `⟪ELEVATED⟫` placeholders.
- Content store is unchanged (Notion `Content EN/TH` properties; pages blank).
  June content lives as HTML in `pipeline/public/content/*.html` with canonical
  `/blog/<urlKey>.html` links; map in `pipeline/data/content-index.json` (52 arts).

## Done (live in Notion)
**Heroes expanded to ≥2,500 combined, Word Target=2500:**
G11 Home-Bar Tools · B1 Rum Guide · G1 Wine Tasting · C1 French Wine 101 ·
D1 Tequila 101 · E1 Scotch 101 · A2 Collector's Bar · **A1 Fine-Wine Cellar (new)**.

**Premium spokes drafted (were placeholders), category-level, /blog-linked:**
A8 6 Bottles Serious Collection (BOFU) · E4 Best-Value Blended Scotch (BOFU) ·
WS6 Grand Cru & First Growths (MOFU) · WS2 Serving Aged Wine/Coravin (MOFU).
(A5 Starter Cellar already drafted.)

**Dedup swaps:** 1 Tequila, 2 Beginner, 3 Single-Malt-vs-Blended (hero cross-links),
7 Negroni (full Thai-twist draft). 4=Wine&Cheese deferred (see below),
5=Decant deferred (see below), 6=Bangkok ✓ (T3 re-angled + linked, "Review").

**[VERIFY] resolved (web-confirmed):** Iron Balls Gin, Chalong Bay rum,
GranMonte/PB Valley/Monsoon Valley, Khao Yai distance — across 7 rows.

**Real-blog linking:** `docs/JULY_INTERNAL_LINK_PLAN.md` committed (full July→/blog
map). Inline canonical anchors injected into the premium cluster (A1, A8, E4, WS6,
WS2). Compliance kept (no price, LINE CTA, 20+, no emoji; /blog links only).

**Inline /blog anchors + premium connoisseur sections added to educational heroes:**
C1 French Wine 101 · D1 Tequila 101 · E1 Scotch 101 — all injected with:
- Real `<a href>` anchors replacing prose cross-refs (per §B of link plan)
- Premium connoisseur section (~100–150 words) before "How we can help"
All three set to Status "Review".

**Dedup #6 JUL-T3 Bangkok Cocktail Bars:** Full beginner-guide draft written (was
`⟪RE-ANGLED⟫` placeholder). Links to `liq9-day25-bangkok-cocktail-renaissance.html`.
`[VERIFY BEFORE PUBLISH]` note embedded — venue names/hours must be confirmed ≤2 weeks
before publish. Status "Review".

**Compliance lint (2026-06-03):** `compliance-lint.mjs` run over C1/D1/E1/T3 —
**4/4 CLEAN**, 0 errors, 0 warnings. Gate PASSED.

## Remaining / Deferred
- **Dedup #4 JUL-GC** (Wine & Cheese): No content production page exists yet in the
  July DB — brief-only in Master Topic Ledger. **Recommendation: swap/drop** (June's
  `day14-wine-cheese-pairing` owns the generic topic; re-angle to Thai snacks only if
  a content production slot is created). Link up to June canonical if kept.
- **Dedup #5 JUL-G6** (Decanting): No content production page exists in July DB.
  **Recommendation: swap/drop** (JUL-WS2 covers the enthusiast angle; TOFU duplicate
  adds little). Link up to `day28-decanting-guide` from any future mention.
- Refresh `notion-backups/` snapshot (requires live Notion token; not run this session).
- When July builds to `/pipeline/public/content/*.html`: wire §B + §D links as real
  `<a href>` canonicals; re-run link audit (`--score`) so every July page ≥2 inbound,
  ≥3 outbound, zero orphans.
