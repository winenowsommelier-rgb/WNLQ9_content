# WNLQ9 — Content Strategy & Planning System

The **"why" + "what to make next"** layer for Wine-Now and LIQ9, and how we
repurpose it across channels. Pairs with:
- **`CLAUDE.md`** — non-negotiable rules.
- **`docs/CONTENT_PRODUCTION_PLAYBOOK.md`** — *how* to write each article.
- **`docs/RUNBOOK.md`** — *where things live*, keys, sync, deploy.
- **`docs/SESSION_HANDOFF.md`** — subsystem map (`pipeline/` vs `dashboard/` vs `data-hub/`) + verified infra.
- **July execution detail →** `docs/JULY_DEDUP_PLAN.md`, `docs/JULY_CANNIBALIZATION_AUDIT.md`, `docs/REAL_URL_INVENTORY.md`.

> This is the document the "content council" signs off before a batch is authored.
> A planned article must clear the gate (§8): real demand **or** a deliberate
> premium/brand play, **and** real in-stock inventory, **and** a distinct angle
> that links to (not competes with) existing rankers.

_Consolidated 2026-06-04 from two parallel strategy passes. Data windows: GSC + GA4, 2026-03-06 → 2026-06-04 (90d)._

---

## 1. The two brands are NOT symmetric — plan them differently

The single most important finding, backed by live data (not intuition):

| | **Wine-Now** (th.wine-now.com) | **LIQ9** (th.liq9.com) |
|---|---|---|
| Google organic exposure (GSC, 90d) | **~1.2M impressions / ~46k clicks** | **~1.7k impressions** (homepage only indexed) |
| GA4 traffic (90d, homepage views) | ~64k | ~15.7k |
| **Traffic channel reality** | **Organic search is a large, real channel** | **Direct / LINE / brand / social** — *not* organic search |
| Non-branded search demand | Large, wine-led (see §5) | ~zero (only "liq9" navigational) |
| Live indexed URL graph | **~300 URLs**, deep (see `REAL_URL_INVENTORY.md`) | thin — homepage + ~1 blog |
| Inventory depth (product feed) | **73 SKUs** (Red 48, White 16, Champ 4, +5) | **27 SKUs** (Whisky 11, Tequila 5, Brandy 3, Liqueur 3, Vodka 2, Rum 2, Gin 1) |
| **Primary content lever** | **SEO volume** — rank for proven wine demand | **Premium/luxury storytelling** — AEO, AI-citation, brand, LINE conversion |
| Success metric | Impressions → clicks → sessions → product views | AI-citation, brand recall, LINE enquiries, AOV on premium SKUs |

**Why LIQ9 ≠ a search play (yet):** LIQ9 gets ~15.7k GA4 homepage views but only
~1.7k Google impressions — its audience arrives **direct/LINE/brand**, not from
Google. Volume-SEO spirits content earns ~no search traffic this period. The right
LIQ9 play is **premium, story-rich content** that (a) earns AEO/AI-citation, (b)
builds authority while indexing recovers, (c) converts the existing direct/LINE
audience on high-AOV bottles. Evidence it already works: the VSOP Cognac blog pulled
672 views; premium single-malt PDPs (Wolfburn, Prakaan, Hibiki) draw traffic with no
organic help.

---

## 2. Current-state review (May → Jul 2026) and process problems

| Month | Board | Character |
|---|---|---|
| **May** | `📝 Content Production` | **Quality benchmark** — distinctive, opinion-led, Thai-context-first, locally timed. |
| **June** | `2026 JUN` | Transitional — good pegs + heavy commercial/product push; 52 articles authored & delivered to Drive. |
| **July** | `2026 JUL` | SEO foundation: evergreen TOFU "101" + drink-day pegs. Rows **are** briefed with stub drafts; stubs need v2 expansion (see `JULY_CANNIBALIZATION_AUDIT.md`). |

**Process problems to keep fixing:**
1. **Briefs written too late** → drafts start cold. Fix: brief gate (§8).
2. **No ship = no feedback** — nothing `Published`, no `Final URL`s → no GA loop.
3. **Demand data underused** — GSC/GA4 are live (Supermetrics) + the SEO-Automation
   Supabase holds ~364k GSC + ~111k GA4 rows. Pick topics from data, not intuition.
4. **`content_plan` mirror unreliable** (≈12/75 rows) → **Notion is the only source
   of truth today.**
5. **Cannibalization** — new monthly articles overlap existing live rankers (e.g. the
   live `15-most-expensive-wine-in-the-world-en.html` @ **150,778 imp**). Refresh/link
   to incumbents; don't compete (see `REAL_URL_INVENTORY.md`).
6. **"Social" type defined but unused** — the multi-platform layer is empty (§7).

---

## 3. The content loop (every layer verified live, 2026-06)

```
  TREND          REAL DEMAND          TOPIC               INVENTORY          BRIEF            ARTICLE          FEEDBACK
  data-hub   ▶   GSC (live ✅)    ▶   topic libraries  ▶  products.json  ▶   scored & SKU- ▶  blog-writer  ▶  GA4 + GSC ▶
  (publishers)   impressions,         (168 topics +       (100 SKUs,         attached +       skill → Thai     read GA Views
                 position, CTR        viral boosters)     premium flags)     Hook+KEY pts     v2 HTML          monthly → kill/scale
```

| Layer | Source | State |
|---|---|---|
| Trend signals | `data-hub/` (Decanter, Spirits Biz, Punch, Whisky Advocate) | Runs externally; DB not in repo |
| **Real demand** | **Google Search Console via Supermetrics MCP** (ds `GW`) | **✅ Live, authed** |
| **Real traffic** | **Google Analytics 4 via Supermetrics MCP** (WN `377750759`, LIQ9 `396617303`) | **✅ Live, authed** |
| Topic bank | `wine-now-topic-library.csv` (83), `liq9-topic-library.csv` (85), `viral-seo-boosters.csv` (33) | Present |
| Inventory | `pipeline/data/products.json` (100 SKUs) | Live, from BI feed |
| Authoring | `wnlq9-blog-writer-skill/` + playbook | Active |
| Plan of record | Notion month boards | Live (sole source of truth) |

**Topic selection = data.** Each month, pull GSC queries with high impressions +
weak position (5–20) / low CTR → those gaps are the topic list. **Brief gate:** no row
leaves *Not started* until KEY / TENSION / STORY + Target Keyword + Hook + 3–5 KEY
points exist. Drafting starts at **Brief Ready**.

**Known wiring gaps:** (1) Notion rows not auto-enriched from libraries/GSC. (2)
`pipeline/data/articles.json` was stale (being rebuilt). (3) Internal-link/cluster map
lives in `REAL_URL_INVENTORY.md` — wire it at HTML time.

---

## 4. Fixed monthly skeleton (per site, ~24–26 posts) — stops quality drift

| Bucket | Count | Funnel | Notes |
|---|---|---|---|
| **Pillar** | 2 | TOFU/MOFU | Evergreen cornerstone + internal-link hub |
| **Education / Evergreen** | 8–10 | TOFU | The "101" base — **every piece gets a Thai-context hook** |
| **Commercial / Spotlight** | 6–8 | BOFU | Real in-stock SKUs, buy-intent, "สั่งซื้อทาง LINE" |
| **Timely** | 4–6 | any | Calendar pegs + events |
| **Signature POV** | 2–4 | any | May-style opinion pieces — **protect these; they are the brand** |

**Calendar pegs (standing list):** Thai-local — Mother's Day (Aug 12), Father's Day
(Dec 5), Songkran, Visakha/Buddhist alcohol-restricted days (→ sober-curious angle),
New Year gifting. Global drink-days — World Gin/Rum Day, Tequila Day (Jul 24), Scotch
Day, Bastille Day (Jul 14), Champagne Day (Oct). Trade — vintage releases, tax/price
changes, expos.

**Pillar → cluster linking:** each pillar gets 4–6 supporting blogs that link up to it
(pillar links down). Stop publishing flat, unlinked posts.

---

## 5. Wine-Now: demand-ranked priorities (from live GSC)

Real queries, real impressions (90d). Where we already rank ~position 6–8 with low CTR,
**depth + title/meta upgrades on existing pages beat net-new** for near-term clicks.

| Cluster | Proven demand (impr, 90d) | Action |
|---|---|---|
| **Champagne / Sparkling** | แชมเปญ 18.9k · cava 9.9k · prosecco 6k · sparkling 3.8k · live `champagne-or-sparkling-wine` 26k | **Priority pillar.** Differentiate "101" vs price vs comparison; link to incumbent. 4 Champagne SKUs incl. Dom Pérignon. |
| **"Most expensive wine"** | ~38k across variants + **live page 150,778** | **REFRESH/canonical to the live page** — never compete. Premium cluster anchor. |
| **Red wine basics** | ไวน์แดง 11.5k · cabernet 2.4k · red wine 2.2k | Pillar + product cards (48 red SKUs — deepest inventory). |
| **White wine basics** | ไวน์ขาว 7.6k (~position 2) | Defend & expand; high-intent, already ranking. |
| **Brand/varietal we stock** | robert mondavi 11k · jacob's creek 2k | Brand buying-guides w/ real SKUs (Jacob's Creek Cab is a top GA4 product page). |
| **Premium / icon** | live `top-30-premium-red-wine`, `ultra-prestige-champagne`, `10-collectors-most-wanted`, DRC/Pétrus/Lafite/Opus One/Dom Pérignon brand pages | Premium cluster maps directly to live demand — lean in. |

---

## 6. LIQ9: premium / luxury storytelling play

LIQ9 competes on **story, prestige, AEO** — not search volume. Build around the
genuinely premium, story-rich SKUs we stock:

| Premium SKU (in stock) | ~Price | Story angle |
|---|---|---|
| The Macallan 18 Sherry Oak | ฿20,738 | Sherry-cask craft, why 18yo, collector appeal |
| St Agnes X.O. 40 Year Old | ฿31,654 | Australia's oldest brandy house, 40-yr patience |
| Martell Chanteloup XXO | ฿23,467 | Cognac prestige tier, XXO category explainer |
| Ballantine's 30 Years | ฿18,133 | Blended Scotch at the top end |
| 1800 Guachimonton / 818 Eight Reserve | ~฿12,500 | Premium añejo tequila narrative |
| Hibiki / premium Japanese malts | — | Already draw PDP traffic with no SEO help |

**LIQ9 rules:** lead with narrative/provenance, not keyword density; target AEO/AI-
citation phrasing; keep authority pillars (Whisky/Scotch/Tequila 101); **stop spawning
thin spirits BOFU/social** with neither stock nor demand (e.g. Gin — 1 SKU) — redirect
to premium stories or to Wine-Now. Golden Rule 3 still binds (real in-stock SKU card +
LINE CTA; no fabricated tasting/critic numbers). LIQ9 internal links: homepage + verified
category/product pages + LINE only — build the graph from scratch.

---

## 7. Multi-platform repurposing engine (blog = source of truth)

One blog spawns a derivative pack; nothing authored natively from scratch. Stays inside
Option B (Claude Code drafts blog + repurposed copy; a human posts/schedules).

| Channel | Asset | Derived from | Cadence |
|---|---|---|---|
| **Blog (Magento, TH, v2)** | Hero article | — (source) | every row |
| **IG/TikTok/FB** | Carousel (5–7 slides = KEY points); Reel (30–45s = strongest Hook); FB teaser + link | KEY points + TENSION + hero image dir | Pillars + Commercial + Timely |
| **LINE OA** | Rich card: hook + 2–3 product chips (blog SKUs) + "สั่งซื้อทาง LINE" | Commercial blogs + weekly digest | weekly |
| **Email** | Monthly roundup + 2–3 product picks; pillars get a feature | month's blogs | monthly |
| **Video/YouTube** | Pillar → 3–5 min explainer; Shorts = TikTok cut | Pillars | 1–2/mo |

**Make it mechanical** — every brief also carries: **Hook** (one-line TENSION), **3–5
KEY points**, **hero image direction / POP concept**, **SKU chips**. **Board schema add:**
`Platforms` (multi-select) + `Repurpose Status`; track derived assets in the parent blog
row, not new rows (avoid bloat). ≈ 2–3 derived assets per blog.

---

## 8. Prioritization model + content-council gate

```
priority =  demand        (Wine-Now: GSC impressions; LIQ9: AEO/citation + premium AOV, since search ≈ 0)
          × inventory      (in-stock SKU depth; 0 stock = route-to-LINE, deprioritize for BOFU)
          × funnel_fit     (fills a TOFU/MOFU/BOFU gap, not a duplicate)
          × must_move      (BI must_move / margin flag)
          ÷ cannibalization (penalize competing with an existing/sibling page instead of linking)
```
Authoring order within a batch: **Hero pillars → demand-proven standard blogs → premium
LIQ9 stories → fillers/socials.**

**Council gate — a batch passes only when every row clears:**
1. **Brand-channel fit** — Wine-Now row tied to real GSC demand; LIQ9 row tied to a premium/AEO story angle.
2. **Inventory reconciliation** — matched in-stock SKUs, or explicit route-to-LINE.
3. **Keyword/intent + brief** — KEY/TENSION/STORY + Target Keyword + Hook + 3–5 KEY points.
4. **Internal-link target** — pillar hub + sibling spokes named, using **real live URLs** (`REAL_URL_INVENTORY.md`); no guessed slugs.
5. **No cannibalization** — REFRESH/DIFFERENTIATE decided vs incumbent rankers.
6. **No fabricated facts** — verify-list for any tax/price/score/ABV/PPM claim.

---

## 9. Governance / definition-of-done
- **Brief Ready** = KEY/TENSION/STORY + Target Keyword + Hook + 3–5 KEY points.
- **Done** = v2 TH HTML in `pipeline/public/content/`, mapped in `articles.json`, Drive-uploaded, Notion `Drive file URL` set.
- **Published** = live on Magento + `Final URL` set + repurpose pack drafted.
- **Reviewed** = `GA Views` read back at month-end; kill/scale logged.

---

## 10. Fix-it backlog
1. Enrich Notion rows from topic libraries + a live GSC pull (wiring gap #1).
2. Rebuild `pipeline/data/articles.json` to cover all delivered articles (gap #2).
3. Repair or retire the `content_plan` Supabase mirror (12/≈75 rows).
4. Ship June → Drive → set `Final URL` + `Published` to restart the feedback loop.
5. Add `Platforms` + `Repurpose Status` to the month boards.
6. Codify the §4 monthly skeleton as the August board template.

---

## 11. July 2026 execution (the live build)

Gate **passed** across `JULY_DEDUP_PLAN.md` (18 rows already applied to Notion: 4 premium
repurposes + 14 sharpen directives), `JULY_CANNIBALIZATION_AUDIT.md`, and
`REAL_URL_INVENTORY.md`. Remaining build work:
- **Expand Standard stub drafts (~150–200w) → full v2 depth** (Golden Rule #1).
- **Author the 4 new premium articles** (briefs ready): Icon-Producer Spotlight, Prestige
  Champagne, Rare/Collectible Whisky, Luxury Cognac.
- **Wire real live internal links** (`REAL_URL_INVENTORY.md`) + add a value→premium real-SKU
  card per Education/listicle row.
- **Consolidate over-clustered rows** (bottles ×3→2, tequila, Thai-pairing, scotch, glasses).
- **Upload the clean set to a fresh `2026-07 July` Drive subfolder**; set each Notion row's link.
