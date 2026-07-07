# WNLQ9 — August 2026 Content Plan · Preparation Brief

**Brands:** Wine-Now (th.wine-now.com · wine · established) · LIQ9 (th.liq9.com · spirits · greenfield)
**Period:** 1–31 August 2026
**Status:** PREP BRIEF — the spec to build against. Topics here are *directional* and must be
data-validated (Step 6) before they go on the board. No GSC numbers are invented in this doc.

> **How to use this doc.** This is the single source of truth that carries forward (a) the original
> task spec, (b) every adjustment we made across July, and (c) the expert-review fixes. Build August
> by running Step 6 (data pull) FIRST, then slotting validated topics into Sections 5/7 and pushing
> to a fresh August Notion board (Section 9).

---

## 1 · Objective & brand positioning

Design a complete, data-first August 2026 editorial calendar for both brands, structured on the
**5 content-style categories** (Recommend · Selection/Curation · Food Pairing & Lifestyle ·
Education · Trend), where **every topic is pinned to a real GSC signal or a verified BI trend** —
nothing invented.

**Wine-Now** — established, impression-rich / click-poor (July baseline: ~555k impr at ~4% CTR; a
single EN guide leaking ~47k impr at 0.41% CTR from page 1). August job: **keep trading the brand
up** (sommelier voice, named producers, Collector tier) *and* **convert existing demand** — fix the
title/cannibalization leaks, lean BOFU on the proven red-wine / champagne / cava clusters, and own
the **Mother's Day gifting** moment.

**LIQ9** — greenfield (July baseline: a handful of indexed pages, ~hundreds of impressions). August
job: **first-index velocity with a premium signature, depth-first** — stop spreading thin across
five spirits; **own whisky** as the anchor category this month (see §3.4), with everything else
occasional.

---

## 2 · Non-negotiables (golden rules — never skip)

1. **Thai-first / Thai-only**, full ready-to-publish posts at "Whisky 101 v2" depth
   (`pipeline/public/content/liq9-day1-whisky-101.html` exemplar). Native senior-copywriter Thai —
   **never** machine-translation, never brief-style stubs. Hit the row's Word Target.
2. **No fabricated facts** — tax/price/ABV/PPM/critic-scores/ranks/vineyard hours. Write around the
   gap, add a visible verify-note, keep a verify-list. Real numbers only (BI feed or cited source).
3. **Every product card = a real, in-stock SKU** from the product feed (`data-sku` + visible `SKU:`
   chip). No matching stock → 0 cards + route to LINE. Soft badges only, no `#NN` ranks.
4. **Compliance:** approximate price `~฿` + "สอบถามราคา/สั่งซื้อทาง LINE"; footer
   `ดื่มอย่างมีความรับผิดชอบ · 20+`; branded E-E-A-T byline.
5. **HTML:** standalone page, shared `assets/article.css`, Sarabun webfont, canonical, OG+Twitter
   (incl. og:image placeholder), 3 JSON-LD blocks (Article headline = H1; FAQPage mirrors on-page
   FAQ); `.figph`/`img` hold 16/9 aspect-ratio for CLS.

---

## 3 · Adjustments to bake in from Day 0 (everything we learned in July)

These are the deltas that make August better than July from the start — not afterthoughts.

### 3.1 Premium-first, native Thai, Collector tier
Provenance over definition, discernment over price; named producers + sourced critics
(Decanter / Wine Advocate / Jancis · Whisky Advocate / Serge Valentin · BNIC) — **attributed, never
fabricated**, heavy on the Collector/Icon tentpoles, lighter elsewhere. Keep the **Collector tier**
on both brands (dormant icons: Opus One, Continuum, Cristal, Macallan 18, Martell XXO).

### 3.2 Worldwide food pairing (not Thai-only)
Lead with the **universal principle**, then exemplify across global cuisines (cheese boards, French
bistro, steak & grilled meats, pasta, sushi). Keep **one** elegant Thai exemplar where it has real
search volume — don't bench Thai entirely, just stop it being the whole story.

### 3.3 Pyramid publishing model — NOT two full pillars every day
July's "62 pieces / 2-a-day" diluted a premium brand. August ships **fewer, better**:
- **~6–8 Hero pillars** (full depth + schema; the Collector pieces, the Mother's Day tentpole).
- **~12–16 Standard** posts.
- **Remainder Light** (listicles, serve/recipe cards, social-first repurposes).
Use the board's existing `Priority` field (Hero / Standard / Filler). Fill the calendar with the
*right* cadence, not a post-per-slot quota.

### 3.4 LIQ9 = depth-first on ONE category (whisky)
A near-zero-authority domain ranks by **owning a topic cluster**, not breadth. August LIQ9 spine =
a tight whisky hub-and-spoke (Whisky 101 → Scotch regions → single malt vs blend → Highball →
Macallan icon), internally linked. Rum/tequila/gin/vodka are *occasional*, not parallel pillars
(that's a September problem).

### 3.5 Per-brand KPIs (judge them differently)
- **Wine-Now:** clicks / impressions / average position movement on existing queries (30–60-day
  horizon). This is where August revenue actually is.
- **LIQ9:** *leading* indicators only — indexation rate, pages crawled, first impressions appearing,
  branded-search growth. Do **not** judge on revenue in an early month.
- **Collector/Icon pieces** (Opus One ~฿17k, Macallan 18 ~฿20k): measured on rankings / links /
  dwell / authority — **never** on "ask-on-LINE" conversion. They're E-E-A-T halo + link-bait.

### 3.6 Magazine feel — monthly theme + recurring columns
Give August an editorial spine so it reads like a title, not an SEO feed:
- **Theme candidate:** *"The Family Table"* (Mother's Day gifting + green-season home entertaining).
- **Recurring franchises** (weekly): *Sommelier's Pick of the Week* · *Bartender's Corner* ·
  *Collector's Notebook*. Cross-link wine ↔ spirit where natural.

### 3.7 Collector CTA tier
"สอบถามราคาทาง LINE" is right for a ฿600 Riesling; for a ฿20k Macallan it reads cheap. Collector
pieces get **concierge language** — *private client / allocation / ติดต่อทีมดูแลลูกค้าพิเศษ* —
matched to the price tier (still compliant: no hard price, LINE route).

### 3.8 Cannibalization map + funnel balance
One **primary keyword per piece**; wire "101"s as hub→spoke so they reinforce, not compete. Ensure
Wine-Now carries enough hard **BOFU** ("best red under ฿1,000", "Bordeaux vs Napa", buying guides) —
that's what converts the existing impressions.

---

## 4 · The 5-category framework (per brand)

| Category | Wine-Now lens | LIQ9 lens |
|---|---|---|
| **Recommend** | "Best X for Mother's Day / under ฿N" buying guides (BOFU) | "Where to start with single malt" ladders (TOFU→MOFU) |
| **Selection / Curation** | Cellar/Collector edits; red-wine & champagne clusters | Whisky regions / styles flights |
| **Food Pairing & Lifestyle** | Worldwide cuisines + one Thai exemplar; family-table | Highball & cocktails; food-friendly serves |
| **Education** | Grape/region 101s tied to live GSC terms | Whisky 101 hub-and-spoke (anchor cluster) |
| **Trend** | Cultural moments (e.g. Pinot Noir) pinned to BI | Premiumisation / Japanese-whisky scarcity, pinned to BI |

Map to the board's `Category` field: Selection+Recommend → **Spotlights**, Pairing → **Pairing**,
Education → **Education**, Trend → **Tips** (keep the true style category in `Content Brief`).

---

## 5 · August seasonality & pegs (Thailand)

**Key difference vs July: NO national alcohol-sale-ban day falls in August 2026.** The five 2026 dry
days are 3 Mar, 31 May, 29 Jul, 30 Jul, **26 Oct** — none in August. August is a fully open
commercial runway. (Weekly *wan phra* are minor/local — verify if a specific local push lands on one.)

| Date | Peg | Use |
|---|---|---|
| **Mon 12 Aug** | **Thai Mother's Day (HM Queen Sirikit's Birthday)** — national holiday, *not* a dry day | **THE tentpole.** Premium gifting + family-table pairings; gift-set guides; "wine for mum"; Collector gifting. Build the run-up week (≈ 8–12 Aug) around it. |
| Aug (rainy/green season) | Monsoon / low-season, indoor entertaining | "What to drink indoors", warming reds, comfort pairings, at-home cocktails |
| **Drink-day pegs — VERIFY dates before locking** | Candidate light/social hooks (mostly US "national day" calendar) | National Prosecco Day (~13), National Rum Day (~16 → LIQ9), National Pinot Noir Day (~18 → ties to July's Pinot trend signal), National Red Wine Day (~28), Cabernet Day (late Aug) |

**Anchor the month on Mother's Day.** The drink-days are *light/social* pegs only and every date
must be verified — do not assert one as fact in published copy.

---

## 6 · Data-first method — DO THIS BEFORE WRITING TOPICS

Pull from Supabase project `asnarjokyedupsjipzkl` (same tables July used), windowed to the latest
28 days, and let the data choose the topics:

1. `seo_gsc_pages_daily` / GSC queries — find **high-impression / low-CTR leaks** (title-rewrite
   candidates) and **page-2 striking-distance** terms (pos 8–20). *(July leaks to re-check they're
   fixed: EN "most expensive wine" cannibalization; `cava` 9.7k impr @ 0.02% CTR; champagne
   head-terms p5–6.)*
2. `seo_opportunities` — ranked opportunity list; take P1/P2 by brand.
3. `seo_regression_alerts` — **bestseller PDPs losing rank** (July flagged 34 critical: jacob's
   creek cab, catena zapata malbec, cloudy bay, matua, krug…) → recovery pieces + internal links.
4. `content_hub_articles` (BI feed) — emerging trends to pin Trend/Education topics to
   (July surfaced: Japanese-whisky scarcity, tequila premiumisation, aperitivo/low-ABV, Pinot Noir).
5. **Product feed** (`pipeline/data/products.json`, currently 246 in-stock SKUs as of the latest
   refresh) — confirm real SKUs exist for every commercial topic; no stock → 0 cards + LINE.

Output of Step 6 = an **August data-intelligence table** (≈8 signals, July-style §2) that every topic
cites. **No topic ships without a signal in that table.**

---

## 7 · Candidate August topics (DIRECTIONAL — validate in Step 6)

> Starting hypotheses to confirm/replace against fresh data. Each must earn a signal before it's real.

**Wine-Now**
- 🎁 *Hero* — **Mother's Day gift guide**: "ไวน์ของขวัญวันแม่" — premium bottles by budget tier + gift presentation (BOFU, Commercial).
- 🍽️ *Hero* — **Family-table pairing** (worldwide + one Thai dish), framed for the Mother's Day meal.
- 🔻 *Standard* — **Red-wine BOFU** buying guide(s) on the proven `ไวน์แดง` / red-wine cluster.
- 🥂 *Standard* — **Champagne/Cava** trade-up piece(s) recovering the `cava` / `แชมเปญ` leaks.
- 🍇 *Trend* — **Pinot Noir** cultural-moment piece (carry the July BI signal; tie to ~Aug 18).
- 👑 *Collector* — one icon tentpole (Opus One / Continuum / Cristal), concierge CTA.
- ♻️ *Recovery* — title/cannibalization fixes on the leaking guides + regressing bestseller PDPs.

**LIQ9 (whisky-anchored cluster)**
- 🥃 *Hero* — **Whisky 101 hub** (or the next rung up if 101 already shipped) anchoring the cluster.
- 🏴 *Standard* — **Scotch regions** / **single malt vs blend** spokes, internally linked to the hub.
- 🥤 *Standard* — **Highball** (already broadened to the food-friendly Japanese serve) as a spoke.
- 👑 *Collector* — **Macallan 18** icon piece, concierge CTA; pin to Japanese/Scotch scarcity BI.
- 🍸 *Light* — *Bartender's Corner* serve cards (occasional rum/tequila only, not parallel pillars).

---

## 8 · Compliance & verify-list discipline

- Re-confirm every SKU against the **current** product feed at build time (feed was refreshed to 246
  in-stock SKUs — counts/prices may differ from the July 100-SKU set; do not reuse July SKU numbers
  blindly).
- Keep a running **verify-list** per piece for any number you couldn't source; render a visible
  verify-note rather than guessing.
- Prices always approximate `~฿` + LINE route; footer responsibility line on every page.
- Mother's Day copy may reference the occasion but **must not** imply medical/【any unverifiable】
  claims; gifting language stays lifestyle, not health.

---

## 9 · Notion board setup (fresh August board)

- Monthly board pattern: one board per month under parent **"2026 Content Calendar Hub"**
  (`35e9d75a-e4b5-81ed-b331-f6655718c066`). Create / use **"2026 AUG — WNLQ9 — Content Production"**
  with the **same schema** as the July board (so move/rollover preserves all properties).
- Set `Month = "August 2026"` (add the select option on the *new* board at creation — adding options
  to a *pre-existing shared* board is blocked by the Code auto-mode classifier).
- Per piece, populate the Brief Register fields: `KEY` / `TENSION` / `STORY` / `Target Keyword` /
  `Word Target` / `Schema` / `Site` / `Category` / `Type` / `Priority` / `Intent` / `Funnel` /
  `Evergreen` / `Day` / `Publish Date` / `CTA`.
- When HTML is produced: **Status = "Brief Ready"** (not "Done") + paste link into `Drive file URL`.
  Upload CSS-inlined self-contained HTML to Drive folder `1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm`.

---

## 10 · Acceptance checklist (before push)

- [ ] Step 6 data pulled; **August intelligence table** built; every topic cites a signal.
- [ ] Pyramid respected (~6–8 Hero / ~12–16 Standard / rest Light) — not a post-per-slot quota.
- [ ] Mother's Day (12 Aug) tentpole + run-up week in place; no dry-day conflict (confirmed: none).
- [ ] LIQ9 = whisky cluster, internally linked hub→spoke; breadth deferred.
- [ ] Worldwide pairing + one Thai exemplar; Collector tier present with concierge CTA.
- [ ] One **primary keyword per piece**; no cannibalization; Wine-Now BOFU coverage adequate.
- [ ] Every commercial piece has real in-stock SKU(s) from the current feed; else 0 cards + LINE.
- [ ] Per-brand KPI baselines recorded (Wine-Now ranking movement; LIQ9 leading indicators).
- [ ] Native Thai titles (senior-copywriter voice); compliance footer + `~฿`/LINE on every piece.

---

### Source
Thai 2026 alcohol-ban dates (none in August) verified via:
[BKKScene — Bangkok Alcohol Ban Days 2026](https://bkkscene.com/bangkok-alcohol-ban-guide/) ·
[Thairanked — No-alcohol days Thailand 2026](https://thairanked.com/en/blogs/no-alcohol-days-thailand-2026/).
