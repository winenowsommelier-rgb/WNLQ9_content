# WNLQ9 — Content Strategy & Planning System

The **"why" and "what to make next"** layer for Wine-Now and LIQ9. Pairs with:
- **`CLAUDE.md`** — non-negotiable rules.
- **`docs/CONTENT_PRODUCTION_PLAYBOOK.md`** — *how* to write each article.
- **`docs/RUNBOOK.md`** — *where things live*, keys, sync, deploy.
- **this file** — *how we decide what to write, in what order, for which brand, backed by real data.*

> This is the document the "content council" signs off on before a batch is
> authored. If a planned article can't be justified against this strategy
> (real demand **or** a deliberate premium/brand play **and** real in-stock
> inventory), it doesn't get built.

_Last updated: 2026-06-04. Data windows below are GSC + GA4, 2026-03-06 → 2026-06-04 (90 days)._

---

## 1. The two brands are NOT symmetric — plan them differently

This is the single most important finding, and it is backed by live data, not intuition.

| | **Wine-Now** (th.wine-now.com) | **LIQ9** (th.liq9.com) |
|---|---|---|
| Google organic exposure (GSC, 90d) | **~1.2M impressions / ~46k clicks** | **~1.7k impressions** (barely indexed) |
| GA4 traffic (90d, homepage views) | ~64k | ~15.7k |
| **Traffic channel reality** | **Organic search is a real, large channel** | **Direct / LINE / brand / social** — *not* organic search |
| Non-branded search demand | Large, wine-led (see §3) | Effectively zero (only "liq9" navigational) |
| Inventory depth (product feed) | **73 SKUs** (Red 48, White 16, Champ 4, Rosé/Sparkling/Orange 5) | **27 SKUs** (Whisky 11, Tequila 5, Brandy 3, Liqueur 3, Vodka 2, Rum 2, Gin 1) |
| **Primary content lever** | **SEO volume** — rank for proven wine demand | **Premium/luxury storytelling** — AEO, AI-citation, brand, LINE conversion |
| Success metric | Organic impressions → clicks → sessions → product views | AI-citation, brand recall, LINE enquiries, AOV on premium SKUs |

**Why LIQ9 ≠ a search play (yet):** LIQ9 gets ~15.7k homepage views in GA4 but only ~1.7k Google impressions — so its audience arrives **direct/LINE/brand**, not from Google. Google currently doesn't index/rank it for non-branded terms. Writing volume-SEO spirits content into that gap earns ~no search traffic this period. **The right LIQ9 play is premium, story-rich content** that (a) earns AI-citation/AEO ("what is the best Japanese whisky", "Macallan 18 review"), (b) builds brand authority while indexing recovers, and (c) converts the existing direct/LINE audience on high-AOV bottles. Evidence it already works: the VSOP Cognac blog pulled 672 views and premium single-malt PDPs (Wolfburn, Prakaan, Hibiki) draw traffic with no organic help.

---

## 2. The content loop (every layer is live as of 2026-06)

```
  TREND               REAL DEMAND            TOPIC                INVENTORY            BRIEF              ARTICLE            FEEDBACK
  data-hub      ▶     GSC (live ✅)     ▶    topic libraries  ▶   products.json   ▶    scored & SKU-  ▶   blog-writer   ▶   GA4 + GSC
  (publishers,        impressions,           (168 topics +        (100 SKUs,           attached           skill →            (live ✅) →
  AEO signals)        clicks, position       viral boosters,      in-stock,            (see §5)           Thai HTML          re-rank next
                                             keyword/intent)      premium flags)                          + product cards    period
```

| Layer | Source | State |
|---|---|---|
| Trend signals | `data-hub/` (Decanter, Spirits Biz, Punch, Whisky Advocate → SQLite/Sheet) | Runs externally; DB not in repo |
| **Real demand** | **Google Search Console via Supermetrics MCP** | **✅ Live, authed** |
| **Real traffic** | **Google Analytics 4 via Supermetrics MCP** (WN `377750759`, LIQ9 `396617303`) | **✅ Live, authed** |
| Topic bank | `wine-now-topic-library.csv` (83), `liq9-topic-library.csv` (85), `viral-seo-boosters.csv` (33) | Present, static |
| Inventory | `pipeline/data/products.json` (100 SKUs) | Live, regenerated from BI feed |
| Authoring | `wnlq9-blog-writer-skill/` + playbook | Active |
| Plan of record | Notion board (per period) | Live |

**Known wiring gaps to close:** (1) Notion rows are bare topic lines — not enriched from the topic libraries or GSC. (2) `pipeline/data/articles.json` is stale (maps 14 of 52 June articles). (3) No internal-link/cluster map across articles.

---

## 3. Wine-Now: demand-ranked priorities (from live GSC)

These are **real queries with real impressions** (90d) — write/upgrade against these first. CTR is low (1–3%) where we rank ~position 6–8, so **depth + title/meta upgrades on existing pages can beat net-new** for near-term clicks.

| Cluster | Proven demand (impressions, 90d) | Action |
|---|---|---|
| **Champagne / Sparkling** | แชมเปญ 18.9k · cava 9.9k · prosecco 6k · sparkling wine 3.8k · แชมเปญ ราคา 3.4k | **Priority pillar.** July's "Prestige Champagne" is a placeholder — promote it. We stock 4 Champagne SKUs incl. Dom Pérignon. |
| **"Most expensive wine"** | ~38k across variants (most expensive wine 16k + 14.5k + …) | Evergreen monster. June Day 1 targets it — **refresh & expand**, add internal links. |
| **Red wine basics** | ไวน์แดง 11.5k · cabernet sauvignon 2.4k · red wine 2.2k | Pillar + product cards (48 red SKUs — deepest inventory). |
| **White wine basics** | ไวน์ขาว 7.6k (already ~position 2) · white-wine category live | Defend & expand; high-intent, already ranking. |
| **Brand/varietal terms we stock** | robert mondavi 11k (across variants) · jacob's creek 2k | Brand-led buying-guide pages with real SKUs (Jacob's Creek Cab is a top GA4 product page). |
| **General "ไวน์ / wine"** | ไวน์ 34.9k · wine 9.8k | Hub/pillar that links down to all clusters above. |

> GA4 confirms the blog→product flow works: top blog landing pages (18-noble-grapes 1.3k, recommended-white-wine 1.2k, recommended-wine 1.1k, cheap-and-expensive-wine 1k, prosecco 879, bangkok-chillable-reds 910) feed product pages (Donnafugata 2.3k, Jacob's Creek Cab 1k, Penfolds Bin 2 1k).

---

## 4. LIQ9: premium / luxury storytelling play

LIQ9 doesn't compete on search volume this period. It competes on **story, prestige, and AEO**. Build content around the genuinely premium, story-rich SKUs we actually stock:

| Premium SKU (in stock) | ~Price | Story angle |
|---|---|---|
| The Macallan 18 Sherry Oak | ฿20,738 | Sherry-cask craft, why 18yo, collector appeal |
| St Agnes X.O. 40 Year Old | ฿31,654 | Australia's oldest brandy house, 40-year patience |
| Martell Chanteloup XXO | ฿23,467 | Cognac prestige tier, XXO category explainer |
| Ballantine's 30 Years | ฿18,133 | Blended-Scotch at the top end |
| 1800 Guachimonton / 818 Eight Reserve | ~฿12,500 | Premium añejo tequila, celebrity/terroir narrative |
| Hibiki / premium Japanese single malts | — | Already drawing PDP traffic with no SEO help |

**LIQ9 content rules:**
- Lead with **narrative and provenance**, not keyword density. Target AEO/AI-citation phrasing ("what makes Macallan 18 worth it", "best premium tequila Thailand").
- Keep the **authority pillars** (Whisky/Scotch/Tequila 101) — they build the foundation while indexing recovers and are strong AI-citation surfaces.
- **Stop spawning thin spirits BOFU/social pieces** with neither stock nor demand (e.g. Gin — 1 SKU). Redirect that effort to (a) premium spirits stories, or (b) Wine-Now, where demand + inventory exist.
- Every premium piece still obeys Golden Rule 3: real in-stock SKU card + LINE CTA; no fabricated tasting/critic numbers.

---

## 5. Prioritization model (how to order a batch)

Score each candidate article; author high scores first.

```
priority =  demand        (Wine-Now: GSC impressions for the target query
                           LIQ9: AEO/citation potential + premium AOV, since search ≈ 0)
          × inventory      (in-stock SKU depth in the matched category; 0 stock = route-to-LINE, deprioritize for BOFU)
          × funnel_fit     (does it fill a TOFU/MOFU/BOFU gap rather than duplicate one?)
          × must_move      (BI "must_move" / margin flag from the product feed)
          ÷ cannibalization (penalize if it competes with an existing/sibling page instead of linking to it)
```

**Authoring order within a batch:** Hero pillars → demand-proven standard blogs → premium LIQ9 stories → fillers/socials.

---

## 6. Content-council gate (run before authoring a batch, and before publish)

A batch passes only when every row clears:
1. **Brand-channel fit** — Wine-Now row tied to real GSC demand; LIQ9 row tied to a premium/AEO story angle (not volume).
2. **Inventory reconciliation** — matched in-stock SKUs identified, or explicitly flagged route-to-LINE (no phantom BOFU).
3. **Keyword/intent assigned** — primary keyword + search intent + funnel stage pulled from the topic libraries / GSC.
4. **Internal-link target** — its pillar hub + sibling spokes named (no orphan articles).
5. **No fabricated facts** — verify-list attached for any tax/price/score/ABV/PPM claim.

---

## 7. July 2026 — what to adjust (applying the above)

- **Rebalance away from 39/38 wine/spirits** toward wine, where demand *and* inventory live. Convert thin-spirits volume pieces into either premium LIQ9 stories or Wine-Now demand pieces.
- **Promote "Prestige Champagne" (D25) from placeholder to priority pillar** — 30k+ proven sparkling/champagne impressions.
- **Fix the 10 placeholder rows** into real briefs before any HTML (see prior audit).
- **Lock the BOFU rows against the feed first** (D21, D31×2, D4) — confirm value SKUs exist or convert to route-to-LINE.
- **LIQ9 pillars stay; LIQ9 thin BOFU/social (esp. Gin, 2nd mocktail) gets cut or converted to premium stories.**
- **Build the cluster/internal-link map** so the 8 pillars + spokes reinforce each other (esp. the 5-piece Thai-food-pairing cluster → 1 hub + 4 spokes).
- **Create a fresh `WNLQ9 2026-JUL` Drive subfolder** at the start of the run (per CLAUDE.md convention).

---

## 8. Backlog to harden this system

- Enrich Notion rows directly from the topic libraries + a live GSC pull (close wiring gap #1).
- Rebuild `pipeline/data/articles.json` to cover all delivered articles (close gap #2).
- Stand up the internal-link/cluster map as a tracked artifact (close gap #3).
- Optional: scheduled monthly GSC/GA4 pull → auto-refresh the priority ranking in this doc.
