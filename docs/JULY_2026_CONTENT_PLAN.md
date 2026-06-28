# July 2026 Content Plan — Wine-Now × LIQ9
**Revised:** 2026-06-28 | **Data window:** GSC May 27–Jun 24 2026 (Supabase `seo_gsc_daily` / `seo_gsc_pages_daily`) + BI trend hub (`content_hub_articles`, May–Jun 2026) | **Supersedes** all prior July planning docs.

---

## PART 1 — DATA AUDIT (inputs, not assumptions)

### 1A. Wine-Now — top pages by impression (28-day, May 27–Jun 24)

| # | Page | Imp | Clicks | CTR | Pos | July call |
|---|---|---|---|---|---|---|
| 1 | `15-most-expensive-wine-in-the-world-en` | 49,897 | 200 | **0.40%** | **8.3** | 🔴 Flagship slipping (was pos 7.7 Mar–Jun) — title fix is urgent |
| 2 | Homepage | 32,019 | 2,326 | 7.44% | 4.8 | ✅ Protect; internal links feed here |
| 3 | `how-to-cheers-around-the-world` | 13,553 | 105 | **0.78%** | 6.0 | 🟠 CTR fix: rebuild title on "ชนแก้ว" |
| 4 | `18-noble-grapes-wine-challenge` | 11,102 | 318 | **2.88%** | 5.1 | ✅ Strong performer — build cluster around it |
| 5 | `cava-champagne-from-spain` | 10,967 | 23 | **0.21%** | 5.1 | 🔴 Biggest single CTR crisis on site |
| 6 | `champagne-or-sparkling-wine` | 9,451 | 69 | **0.74%** | 5.2 | 🟠 Part of แชมเปญ cannibalization cluster |
| 7 | `wine/red-wine.html` (category) | 9,421 | 192 | 2.06% | 4.5 | ✅ Protect; keep fresh links |
| 8 | `penfolds-bin-2` (product) | 6,805 | 358 | 5.26% | 3.4 | ✅ Protect |
| 9 | `top-10-best-selling-red-wine-of-2024` | 6,770 | 219 | **3.28%** | 5.2 | ✅ Better than expected — refresh year only |
| 10 | `3-reasons-to-buy-chateau-clerc-milon-th` | 6,466 | 300 | 4.58% | 4.6 | ✅ Study format; replicate for other labels |
| 11 | `wine/champagne-wine.html` (category) | 3,899 | 156 | 4.25% | 4.6 | ✅ Hub candidate for แชมเปญ cluster |
| 12 | `accessory/wine-accessory/function-stopper` | 5,203 | 3 | **0.06%** | 6.9 | 🔴 Still 0 effective clicks — fix or noindex |
| 13 | `accessory/glassware/wine-glass` | 5,297 | 10 | **0.19%** | 9.7 | 🟠 Both CTR + push needed |
| 14 | `wine_club` | 2,756 | 2 | **0.07%** | 5.6 | 🔴 5.4k imp keyword at 0 clicks — new priority |

### 1B. Wine-Now — top keyword opportunities (28-day)

| Keyword | Imp | Clicks | CTR | Pos | Type |
|---|---|---|---|---|---|
| cava | 14,595 | 3 | **0.01%** | 5.1 | 🔴 CTR fix (term volume GREW from 9.9k) |
| ไวน์ | 10,997 | 141 | 1.26% | 4.8 | 🟠 Head term; title match |
| bottle stopper | 8,957 | 0 | **0%** | 7.4 | 🔴 Zero clicks — commercial re-title or noindex |
| glass wine | 6,253 | 0 | **0%** | 6.0 | 🔴 Zero clicks — intent mismatch |
| แชมเปญ | 5,820 | 45 | 0.79% | 4.8 | 🟠 Cannibalization bleeding CTR |
| most expensive wine | 5,579 | 11 | **0.23%** | **9.5** | 🔴 Dropping (was 7.7) — flagship title fix urgent |
| wine club | 5,397 | 0 | **0%** | 4.9 | 🔴 High imp, zero clicks — CTA/title mismatch |
| most expensive wine in the world | 4,887 | 21 | 0.44% | 8.1 | 🔴 Part of flagship cluster |
| ไวน์แดง | 3,443 | 56 | 1.64% | 5.2 | 🟠 Red wine category; improve |
| 818 tequila | 603 | 6 | 1.31% | 6.3 | 📌 Spirits demand landing on wine site → LIQ9 seed |

### 1C. Critical regressions (product pages — direct revenue impact)

These are live product pages that have dropped significantly. Revenue is leaking now.

| SKU / Page | From pos | To pos | Δ% | Action |
|---|---|---|---|---|
| jacob's creek cabernet sauvignon | 2.1 | 14.2 | **–563%** | 🔴 CRITICAL — was #2, now page 2. Internal link injection from blog |
| i muri puglia primitivo | 2.4 | 15.2 | –541% | 🔴 CRITICAL — refresh product blog + links |
| catena zapata malbec | 1.6 | 8.4 | –424% | 🔴 CRITICAL — internal links from Malbec / Argentina content |
| cloudy bay wine | 2.6 | 11.3 | –341% | 🔴 CRITICAL — refresh + link from NZ/Sauvignon Blanc content |
| prosecco wine | 4.5 | 13.1 | –193% | 🔴 Build from prosecco blog (already 5.8k imp / 3.2% CTR) |
| château margaux | 4.6 | 13.0 | –180% | 🟠 Premium label — link from Bordeaux / prestige cluster |
| krug | 3.0 | 8.8 | –191% | 🟠 Link from Champagne hub |
| natural wine | 4.2 | 8.8 | –109% | 🟠 Create Natural Wine explainer (also a trend piece) |
| robert mondavi napa valley | 6.5 | 13.8 | –113% | 🟠 Cross-link blog + brand page (existing split) |

### 1D. LIQ9 GSC state

LIQ9 organic footprint is essentially zero: 99 page-level rows in 28 days, all homepage or branded navigational. Top keywords are brand-direct (`liq9`, `liq9 thailand`, `liq9 asia`). No content URLs are indexed yet. **July for LIQ9 is pure architecture — every piece will be first-indexed.**

### 1E. BI trend signals (content hub May–Jun 2026, enriched articles)

From `content_hub_articles` (5,547 articles; enriched=1 subset):

**Spirits editorial volume by type:** Whisky 330 · Gin 92 · Tequila 65 · Liqueur 55 · Rum 51 · Cognac 20 · Mezcal 14

**Active trend signals (articles tagged in data):**
- `viral_on_social` + `cultural_moment`: **"Boy Martini"** (Manhattan reframe) — cocktail naming trend
- `award_winning`: **Best New Bartenders 2026** (Punch) — bartender recipe format is AEO-high
- `limited_release` + `award_winning`: **Four Roses cask-strength bourbon** (collector tier)
- `health_angle_positive` + `health_angle_negative`: **"No Safe Amount of Alcohol? Not So Fast"** — alcohol health debate is live; brands need a responsible-drinking stance
- `emerging_region` + `investment_opportunity`: California premium Cabernet; Greek wine push
- `sustainability_focus`: Technology in sparkling wine production
- `cultural_moment` + `spirits`: **Mezcal with unusual ingredients** — mezcal is entering cultural moments
- `regulatory_change`: Champagne region suing English wineries — EU wine geography is live news

**AEO format signals (high citation articles):** Cocktail glassware guide, amaro/gimlet/tequila how-to cocktails, bartender recipe collections — **how-to and guide formats score highest for AEO citation**.

---

## PART 2 — BRAND MISSIONS

### Wine-Now: HARVEST + DEFEND
~300 indexed URLs, existing authority. Three parallel tracks in July:
1. **DEFEND** — recover the product page regressions (direct revenue). Internal link fixes first, content refresh where thin.
2. **HARVEST** — convert what already ranks: CTR fixes on cava, flagship, bottle stopper, wine club, cheers page.
3. **BUILD** — one moat asset (Thai Food × Wine Pairing Matrix) that compounds authority for both SEO and AEO.

Refresh:new ratio = **65:35**. No new URL without a brief showing it serves a gap the existing set can't cover.

### LIQ9: FOUNDATION (clean from day one)
Every piece is a first-index event. Non-negotiables:
- One canonical URL per topic per language
- hreflang TH/EN pair from day one on every page
- Commercial-first on proven demand terms (Jack Daniel's before Whisky 101)
- Real in-stock SKU on every commercial page; no SKU match → 0 cards + LINE route

Refresh:new ratio = **10:90** (almost all new — there's nothing to refresh yet).

---

## PART 3 — DUAL ENGINE: SEO + AEO

### SEO: win the blue link
The existing keyword findings are verified. Priority order is now updated by the data audit above:
1. CTR fixes (fastest ROI, no ranking change needed): flagship EN, cava, bottle stopper, wine club, glass wine, cheers
2. Regression recovery (revenue defense): Jacob's Creek, Catena Zapata, Cloudy Bay, Prosecco
3. Page-2 pushes: Robert Mondavi hub, Italian wine, Bordeaux, Mondavi Napa
4. Cannibalization consolidation: แชมเปญ hub, beginners pillar merge

### AEO: win the answer
Answer engines (AI Overviews, ChatGPT, Gemini, Perplexity) lift **passages**, not pages. Every July piece must pass this checklist:

| # | Requirement | Standard |
|---|---|---|
| 1 | **Answer-first block** | Every H2 opens with a 40–60 word self-contained answer before context or product |
| 2 | **Definitional anchor** | Within first 100 words: "<X> คือ…" — one clean Thai sentence defining the entity |
| 3 | **Question-shaped Thai headings** | Match real Thai queries: "…คืออะไร", "…ยี่ห้อไหนดี", "…กับ…ต่างกัน", "วิธีทำ…" |
| 4 | **Comparison tables** | Every "X vs Y" or "types of X" lives in a real `<table>` (not bullet prose) |
| 5 | **Entity specificity** | Name real producers, regions, grapes, price bands — vague prose won't be cited |
| 6 | **Verifiable facts only** | No fabricated ABV/tax/price/scores. Dated claims ("อัปเดต 2026") + source note |
| 7 | **Schema triple** | Article (headline=H1) + FAQPage (mirrors on-page FAQ, self-contained answers) + HowTo where stepwise |
| 8 | **E-E-A-T byline** | "Sommelier Desk, Wine-Now" / "Bartender Desk, LIQ9" on every piece |
| 9 | **Bilingual targeting** | TH answer block on TH canonical; EN answer block on EN hreflang page |

**AEO acceptance test:** *Could ChatGPT answer the headline question verbatim from one block of this page — and be correct?* If no → rewrite that block before publishing.

**Format insight from BI data:** How-to guides and recipe formats score highest AEO citation. Every "practical" piece (Highball how-to, Pairing Matrix, Home-Bar Kit) gets HowTo schema.

---

## PART 4 — PERSONA × TIER MATRIX

Every board row must tag exactly **one primary persona** (secondary optional). These drive voice, SKU tier, CTA, and the repurpose angle.

### Wine-Now

| Persona | Tier | Reads for | Intent | SKU tier | Voice |
|---|---|---|---|---|---|
| **นักสำรวจ** (Discoverer) | Discovery | "อะไรก็ได้ที่ไม่ฝาด" / first bottle | Info → TOFU | ฿350–750 | Warm, anti-jargon, zero snobbery |
| **คนรักไวน์** (Enthusiast) | Enthusiast | Comparisons, grapes, regions, reviews | Commercial → MOFU | ฿750–2,500 | Knowledgeable peer |
| **นักสะสม** (Collector) | Connoisseur | Prestige labels, vintages, cellaring | Transactional → BOFU | ฿2,500+ | Authoritative, discreet |
| **ซื้อเป็นของขวัญ** (Gifter) | Cross-tier | Occasion, wedding, business gift | Commercial | Gift sets | Concierge, reassuring |
| **มืออาชีพ F&B** (Trade Pro) | Cross-tier | Deep technical, by-the-case | Info + Commercial | Range/bulk | Technical, peer-to-trade |

### LIQ9

| Persona | Tier | Reads for | Intent | SKU tier | Voice |
|---|---|---|---|---|---|
| **สายไฮบอล** (Highball Newcomer) | Discovery | Whisky soda / easy serves | Info → TOFU | Entry ฿ | Fun, approachable |
| **สายวิสกี้** (Whisky Explorer) | Enthusiast | Single malt, "ยี่ห้อไหนดี", tasting | Commercial → MOFU | Mid–premium | Guide, credible |
| **สายเตกีล่า** (Agave Adventurer) | Enthusiast | Tequila/mezcal, sipping vs shots | Info → Commercial | Mid | Trend-aware, curious |
| **นักสะสมสุรา** (Spirit Collector) | Connoisseur | Rare/limited, cognac, gifting | Transactional → BOFU | Premium/luxury | Authoritative |
| **เจ้าภาพ** (The Host) | Cross-tier | Entertaining, cocktail recipes + bottles | Commercial | Recipe→SKU bundle | Generous, inspiring |

---

## PART 5 — TREND LAYER (July 2026)

Ranked by BI signal volume + Thai-market fit.

| Trend | BI signal | Thai-market fit | Applies to |
|---|---|---|---|
| **Highball / เหล้าผสมโซดา culture** | Strong (whisky vol 330) | Very high — monsoon = home-drinking season | LIQ9 L4 |
| **Agave moment (tequila + mezcal)** | Tequila 65 + mezcal 14 = 79 articles | Growing; National Tequila Day Jul 24 | LIQ9 L5 |
| **Bartender recipe / how-to cocktail** | AEO-high per data | Home-bar, Instagram-native | LIQ9 L3, L7 |
| **Alcohol & health narrative** | Dual-signal: health_positive + health_negative | Responsible drinking as brand-trust signal | WN W8, WN footer discipline |
| **Natural / orange wine** | Emerging region signals | Enthusiast tier curiosity; AEO "คืออะไร" demand | WN W7 |
| **Premium/collectible spirits** | Limited release + award_winning | Collector + Gifter personas; gifting season approaching | LIQ9 L6, L8 |
| **Sparkling & Champagne geography** | Champagne suing English wineries | Educates both Discoverer and Enthusiast | WN W2 hub |
| **Home-entertaining** | Cocktail glassware viral + host persona | Monsoon season = indoor hosting | WN W6 (pairing), LIQ9 L3 |

### ⚠️ Thai calendar compliance

- **Asalha Puja (วันอาสาฬหบูชา)** and **Wan Khao Phansa (วันเข้าพรรษา, start of Buddhist Lent)** — *verify exact July 2026 dates against the official Royal Thai Government calendar before scheduling.* **Estimated: ~July 25–26, 2026 (Saturday–Sunday).** On these days Thai law restricts alcohol sales.
  - **Rule:** zero "สั่งซื้อ" / "ราคา" / promotional CTAs on those dates
  - **Publish instead:** educational or cultural content ("ดื่มอย่างมีความรับผิดชอบ", sober-curious, or history/craft)
- **Bastille Day: July 14** (French wine peg — Champagne / Bordeaux editorial)
- **National Tequila Day: July 24** (LIQ9 agave piece should publish by July 23)

---

## PART 6 — MOAT ASSETS (≥1 per brand)

Original-value assets that are linkable, saveable, and extractable by answer engines. These are the "staple" pieces that compound brand authority.

**WN-M1 — Thai Food × Wine Pairing Matrix** (`อาหารไทย × ไวน์`)
- A browsable matrix: dish rows (ส้มตำ, ลาบ, ต้มยำ, มัสมั่น, ปลาทอด, ผัดกะเพรา…) × wine style columns
- Real cells, no invented pairings — sourced from established pairing principles
- Table format = AEO gold (engines extract tables as answers)
- Schema: Article + FAQPage + HowTo (for "how to pair X")
- Funnel: TOFU → MOFU; links to category pages for each style
- Word target: 2,000–2,500 words

**LIQ9-M1 — Home-Bar Starter Kit** (`สร้างโฮมบาร์`)
- 5–7 bottles covering the widest cocktail range, with real LIQ9 SKUs
- 3–5 foundational recipes per bottle
- Rationale for each pick (why this bottle, not another)
- Schema: Article + FAQPage + HowTo (for "วิธีสร้างโฮมบาร์")
- Funnel: TOFU → BOFU; links to each product page
- Word target: 2,000–2,500 words

---

## PART 7 — JULY EXECUTION CALENDAR

### Calendar overview (publish targets)

```
WEEK 1 (Jul 1–6):   WN-W1 flagship fix · LIQ9-L1 Jack Daniel's · WN DEFEND links
WEEK 2 (Jul 7–13):  WN-W2 Cava rewrite · WN-W3 แชมเปญ hub · LIQ9-L2 Whisky 101 cluster
WEEK 3 (Jul 14–20): WN-W4 Noble Grapes cluster · LIQ9-L3 Home-Bar Kit · WN-W5 Bottle Stopper fix
                     Jul 14: Bastille Day → French wine editorial
WEEK 4 (Jul 21–27): WN-W6 Thai Food Pairing Matrix · LIQ9-L4 Highball how-to
                     Jul 24: National Tequila Day → LIQ9-L5 (publish Jul 23)
                     Jul 25–26: ⚠️ NO commercial pushes (Asalha Puja / Khao Phansa)
WEEK 5 (Jul 28–31): WN-W7 Natural Wine · LIQ9-L6 Macallan · WN-W8 month-end refreshes
```

---

## PART 8 — FULL CONTENT SLATE

### Wine-Now

| ID | Title / angle | Type | Persona | Tier | Intent | Funnel | Priority | Word target | Schema | AEO answer to own | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **WN-W1** | Most Expensive Wine in the World — flagship refresh | Refresh | คนรักไวน์ | Enthusiast | Info | TOFU | **Hero** | 3,000+ | Article + FAQ | "most expensive wine in the world" / "ไวน์ที่แพงที่สุดในโลก" | Title must lead with exact EN head term; hreflang base(TH)↔`-en`; pos slipping 7.7→9.5 — urgent |
| **WN-W2** | Cava คืออะไร — ไวน์สปาร์กลิงจากสเปน | Refresh | คนรักไวน์ | Enthusiast | Info→Comm | MOFU | **Hero** | 2,000 | Article + FAQ | "cava คืออะไร / cava vs champagne" | Biggest CTR crisis: 14.6k imp / 3 clicks. Definitional anchor within 100 words. |
| **WN-W3** | แชมเปญ hub rewrite + blog differentiation | Consolidate | Gifter · Enthusiast | Enthusiast | Commercial | MOFU | **Hero** | 2,500 | Article + FAQ | "แชมเปญ ยี่ห้อไหนดี / แชมเปญ ราคา" | Category page = hub. 4 blogs each own a long-tail (styles / vs-sparkling / luxury / history). Bastille Day (Jul 14) peg works for luxury angle. |
| **WN-W4** | 18 Noble Grapes — cluster expansion (linking + internal) | Refresh | คนรักไวน์ | Enthusiast | Info | TOFU | Standard | 500 (brief only) | — | — | Don't rewrite — it performs. Add 4–6 internal links from related grape/region posts pointing here. Study its format for future pieces. |
| **WN-W5** | Wine Bottle Stopper — commercial fix / noindex decision | Refresh | นักสำรวจ · Host | Discovery | Commercial | BOFU | Standard | 800 | Article | "wine bottle stopper ซื้อที่ไหน" | 8.9k imp / 0 clicks. If product is sold: full commercial rewrite, add SKU + LINE CTA. If not sold: noindex this page. |
| **WN-W6** | Thai Food × Wine Pairing Matrix (moat asset) | New | นักสำรวจ · คนรักไวน์ | Enthusiast | Info→Comm | TOFU→MOFU | **Hero** | 2,500 | Article + FAQ + HowTo | "ไวน์คู่กับอาหารไทย / อาหารเผ็ดกินไวน์อะไร" | Table-format matrix. AEO gold. No invented pairings. |
| **WN-W7** | Natural Wine / Orange Wine คืออะไร | New | คนรักไวน์ | Enthusiast | Info | TOFU | Standard | 1,800 | Article + FAQ | "natural wine คืออะไร / orange wine" | Regression alert shows natural wine dropped pos 4.2→8.8. New explainer reclaims it + satisfies Enthusiast trend curiosity. |
| **WN-W8** | Best-Selling Red Wine 2026 — year refresh | Refresh | คนรักไวน์ | Enthusiast | Commercial | MOFU | Standard | 1,500 | Article + FAQ | "ไวน์แดง ขายดี 2026" | Currently 3.28% CTR at pos 5.2 — performing. Change "2024"→"2026" in title/URL and update list. Don't break what works. |
| **WN-W9** | Wine Club — landing page CTR fix | Refresh | Gifter · Collector | Connoisseur | Commercial | BOFU | Standard | 600 | — | "wine club thailand / wine subscription" | 5.4k imp / 0 clicks. Page content and title must match commercial intent of searcher. |
| **WN-W10** | Wine Glass / Glassware guide | Refresh | นักสำรวจ | Discovery | Info→Comm | TOFU | Standard | 1,500 | Article + FAQ + HowTo | "แก้วไวน์ ประเภท / ใช้แก้วอะไรดื่มไวน์" | 5.3k imp / 10 clicks at pos 9.7. Redesign around "แก้วไวน์คืออะไร / เลือกอย่างไร" angle. Internal links to glassware accessories. |

#### WN regression recovery (not content rows — brief devs / internal link work)

| SKU/Page | Drop | Recovery action | Who |
|---|---|---|---|
| Jacob's Creek Cab Sauv | pos 2→14 | Add 3–5 internal links from: beginners pillar, best-selling-red, white-wine-beginners | Dev + Author |
| Catena Zapata Malbec | pos 1.6→8.4 | Link from: Malbec/Argentina content, premium cluster | Dev + Author |
| Cloudy Bay | pos 2.6→11.3 | Link from: Sauvignon Blanc guide, New Zealand section | Dev + Author |
| Prosecco (category/term) | pos 4.5→13.1 | Link from: prosecco blog (already 5.8k imp), champagne hub | Dev + Author |
| Château Margaux | pos 4.6→13.0 | Link from: Bordeaux/prestige cluster | Dev + Author |
| Krug | pos 3.0→8.8 | Link from: แชมเปญ hub W3 | Dev + Author |

> ⚠️ Internal link fixes don't need new HTML — they need edits to existing posts. Brief these as 15-min tasks, not full drafts. Impact is high.

### LIQ9

| ID | Title / angle | Type | Persona | Tier | Intent | Funnel | Priority | Word target | Schema | Seed / AEO target |
|---|---|---|---|---|---|---|---|---|---|---|
| **LIQ9-L1** | Jack Daniel's Tennessee Whiskey — ราคา, รุ่น, สั่งซื้อ | New commercial | สายวิสกี้ | Enthusiast | **Commercial** | BOFU | **Hero** | 1,800 | Article + FAQ | Proven demand from WN (54k imp; "jack daniel ราคา" / "เหล้าแจ็คแดเนียล"). First commercial page. Real SKU + price band + LINE. |
| **LIQ9-L2** | Whisky 101 pillar — extend cluster + hreflang | Anchor/extend | สายวิสกี้ | Enthusiast | Info | TOFU | **Hero** | 3,500 | Article + FAQ | "วิสกี้ คืออะไร / วิสกี้ ยี่ห้อไหนดี". Already authored (exemplar). Add cluster links to L1, L4, L6. |
| **LIQ9-L3** | Home-Bar Starter Kit (moat asset) | New pillar | เจ้าภาพ · สายไฮบอล | Discovery | Info→Comm | TOFU→BOFU | **Hero** | 2,500 | Article + FAQ + HowTo | "สร้างโฮมบาร์ / โฮมบาร์มือใหม่". Real SKUs. Highest AEO citation format per BI data. |
| **LIQ9-L4** | ไฮบอล วิธีทำ / Japanese Highball how-to | New | สายไฮบอล | Discovery | Info→Comm | TOFU | Standard | 1,500 | Article + FAQ + HowTo | "ไฮบอล คืออะไร / ไฮบอล วิธีทำ / Japanese highball". Discovery on-ramp. Ship by Jul 14. |
| **LIQ9-L5** | เตกีล่า กับ เมซคาล ต่างกันอย่างไร | New | สายเตกีล่า | Enthusiast | Info | TOFU | Standard | 1,800 | Article + FAQ | "เตกีล่า vs เมซคาล / tequila mezcal". National Tequila Day Jul 24 peg. Ship by Jul 23. |
| **LIQ9-L6** | Macallan — รุ่นไหนดี, ราคา, คู่มือซื้อ | New/extend | นักสะสมสุรา | Connoisseur | Commercial | BOFU | Standard | 1,800 | Article + FAQ | "macallan รุ่นไหนดี / macallan ราคา". Real SKU. Collector + Gifter personas. |
| **LIQ9-L7** | คอกเทลไทย — series franchise (ep. 1) | New | เจ้าภาพ | Discovery | Info | TOFU | Filler | 1,200 | Article + HowTo | Recipe terms + brand entity. One Thai ingredient + LIQ9 spirits base. |
| **LIQ9-L8** | Cognac / Hennessy คู่มือ — ราคา, รุ่น, สั่งซื้อ | New | นักสะสมสุรา · Gifter | Connoisseur | Commercial | BOFU | Standard | 1,800 | Article + FAQ | "คอนยัค คืออะไร / hennessy ราคา". BI confirms cognac = 20 articles in trend hub. Real SKUs only. |

> **LIQ9 rule on every piece:** hreflang TH canonical + EN regional from day one. One canonical URL per topic. Real in-stock SKU only — if no match, 0 cards + LINE route.

---

## PART 9 — OPERATING LOOP

```
MON — Mine Supabase (seo_gsc_daily + regression alerts). Flag new drops.
TUE — Decide: refresh vs new vs recover (regression link fix).
       Cannibalization check: does a live URL already own this topic?
WED–THU — Brief gate: KEY / TENSION / STORY / Target Keyword /
           AEO answer block / Persona / Tier / Schema plan.
           Draft v2 Thai-first HTML only after brief is complete.
FRI — Ship: Drive upload (new subfolder `2026-07 July`) → Notion "Brief Ready" + Drive URL.
      Human publishes Magento → set Final URL + status = Published.
MONTH-END — Read back: GA Views + GSC clicks/pos per row → keep / kill / scale.
             Run regression alert query again — new drops to queue for next month.
```

**New brief fields added this month:**
- `Persona` (primary + optional secondary from §4 matrix)
- `Tier` (Discovery / Enthusiast / Connoisseur / Cross-tier)
- `AEO answer target` (the exact question + the 40–60 word block that answers it)
- `Snippet/Overview check` (did we win it — checked at month-end read-back)

**Drive folder convention:** `2026-07 July` subfolder inside "WNLQ9 Blog Html center" (`1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm`). CSS-inlined, self-contained HTML. One file per slug, no duplicates. Create the subfolder first; upload once.

---

## PART 10 — JULY GOALS & KPIs

| Dimension | July target | How measured |
|---|---|---|
| **Flagship CTR** | `15-most-expensive-wine-en` CTR lifts above 0.50% (from 0.40%) after title fix | GSC post-publish comparison |
| **Cava CTR** | Cava page CTR lifts from 0.21% → ≥1.0% after rewrite | GSC 28-day post-publish |
| **Regression recovery** | ≥3 of 6 critical drops show improvement by Jul 31 | Regression alert query re-run |
| **Flagship position** | Stop the slip (9.5 → stabilise ≤9.0) | Weekly GSC check |
| **LIQ9 indexing** | ≥4 LIQ9 URLs indexed (beyond homepage) | GSC Coverage report |
| **AEO compliance** | 100% of July pieces pass the AEO acceptance test before publish | Author + editor check |
| **Moat assets live** | WN Thai Pairing Matrix + LIQ9 Home-Bar Kit published | Drive URL + Final URL |
| **Persona coverage** | All 10 personas (5 WN + 5 LIQ9) touched ≥1 time | Board audit |
| **Calendar compliance** | Zero commercial pushes on Asalha Puja / Khao Phansa | Editorial calendar |
| **Cadence** | ≥12 pieces shipped (WN 8 + LIQ9 4 minimum) by Jul 31 | Notion Published count |

---

## PART 11 — GUARDRAILS (non-negotiable)

1. **No fabricated facts** — no invented ABV, prices, tax rates, scores, rankings, dates, vineyard details. Use verify-notes; add a verify-list for any figure that needs source confirmation. This rule **is** an AEO trust signal.
2. **Real in-stock SKUs only** — `data-sku` attribute + visible `SKU: <b>…</b>` chip. Check `pipeline/data/products.json` (verified Jun 2026). No SKU match → 0 product cards + route to LINE.
3. **Compliance** — approx price `~฿` + "สอบถามราคา/สั่งซื้อทาง LINE"; footer `ดื่มอย่างมีความรับผิดชอบ · 20+`; E-E-A-T byline on every piece.
4. **Thai-first, v2 depth** — the Whisky 101 exemplar is the standard. No stub drafts. Full, ready-to-publish, standalone HTML.
5. **Bilingual** — one canonical per language per topic; EN/TH = hreflang pair, never merged into one URL.
6. **No PR unless asked** — develop on `claude/festive-dirac-QcgOV`, commit + push; human reviews before merge to `main`.
7. **Supabase writes** — any migration or INSERT to Supabase requires explicit user authorisation. Read-only in content sessions.
