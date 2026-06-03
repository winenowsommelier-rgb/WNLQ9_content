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
7 Negroni (full Thai-twist draft). 4=Wine&Cheese, 5=Decant, 6=Bangkok still open.

**[VERIFY] resolved (web-confirmed):** Iron Balls Gin, Chalong Bay rum,
GranMonte/PB Valley/Monsoon Valley, Khao Yai distance — across 7 rows.

**Real-blog linking:** `docs/JULY_INTERNAL_LINK_PLAN.md` committed (full July→/blog
map). Inline canonical anchors injected into the premium cluster (A1, A8, E4, WS6,
WS2). Compliance kept (no price, LINE CTA, 20+, no emoji; /blog links only).

## Remaining
- Inline canonical `/blog` anchors into the 7 educational heroes (currently prose
  cross-refs only; link-plan doc already specifies targets for the HTML build).
- Dedup #4 Wine & Cheese (JUL-GC) + #5 Decanting (JUL-G6): June owns both on /blog
  (`day14-wine-cheese-pairing`, `day28-decanting-guide`) — recommend swap/thin +
  link-up. Awaiting differentiate-vs-swap decision.
- Dedup #6 Bangkok bars (JUL-T3): re-angle draft (placeholder); verify venues at publish.
- Run `compliance-lint.mjs` over edited rows; refresh `notion-backups/` (needs token).
