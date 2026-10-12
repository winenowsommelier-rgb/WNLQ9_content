# WNLQ9 — August 2026 Content Plan (BUILT)

**Brands:** Wine-Now (th.wine-now.com · wine · established) · LIQ9 (th.liq9.com · spirits · greenfield)
**Period:** 1–31 August 2026 · **Branch:** `claude/festive-dirac-QcgOV`
**Spec:** [`CONTENT_PLAN_AUGUST_2026_BRIEF.md`](CONTENT_PLAN_AUGUST_2026_BRIEF.md) — this is the data-validated build of it.
**Data window:** last 28 days = **2026-05-30 → 2026-06-26** (latest GSC date in Supabase `asnarjokyedupsjipzkl`).
**Feed:** `pipeline/data/products.json` — 246 in-stock SKUs (142 wine / 104 spirits), as of 2026-06-28.

> Theme of the month: **"The Family Table"** — Mother's Day gifting + green-season home entertaining.
> Recurring franchises: *Sommelier's Pick of the Week · Bartender's Corner · Collector's Notebook.*

---

## 1 · August intelligence table (Step 6 — every topic cites a signal)

All figures are real, pulled 28-day (2026-05-30→06-26) from `seo_gsc_daily`, `seo_opportunities`,
`seo_regression_alerts`, `content_hub_articles`, cross-checked against the live product feed.

| # | Signal (28d) | Source | Reading | Licenses |
|---|---|---|---|---|
| **S1** | `ไวน์แดง` 3,476 impr @ **1.55%** CTR, pos 4.9 · `red wine` 779 @0.77% pos 5.2 · `ไวน์ แดง ราคา` pos 11 striking | gsc_daily / opps | Proven Thai red-wine demand, page-1 but CTR-leaking → BOFU money cluster. 50 reds ≤฿1,000 in stock | WN-H3, WN-L3 |
| **S2** | `cava` **15,079 impr @ 0.02% CTR** pos 5 — **but 0 cava SKUs in stock** | gsc_daily + feed | Biggest single leak; no stock ⇒ title/meta recovery only (0 cards + LINE). Pivot the sparkling demand to Prosecco/Champagne (real stock) | WN-S7 (cava title fix), WN-S1/S2 |
| **S3** | `แชมเปญ` 5,630 @0.8% pos 4.5 · `prosecco` 1,606 @ **3.3%** pos 3.5 · `prosecco superiore` pos 11 striking · **`prosecco wine` regression 4.5→13.1** | gsc_daily / opps / regress | Sparkling trade-up demand real & **in stock** (Veuve ฿2,419 / Moët ฿2,229 / Ruinart ฿3,345 / Follador ฿940 / Bottega) | WN-S1, WN-S2 |
| **S4** | EN "most expensive wine" family ≈ **12k combined impr**, pos 8–10 @0.2–0.45% · `top 10 most expensive wine` 900 impr @1.0% | gsc_daily / opps | Known **cannibalization** leak (multiple pages competing) → consolidate to one canonical; Collector halo | WN-S7 |
| **S5** | `cabernet sauvignon` 815 @ **0.49%** pos 4.5 · `19 crimes cabernet sauvignon` pos 12.9 striking · **`jacob's creek cab` regression 2.1→14.2** | gsc_daily / opps / regress | Strong Cab demand page-1 but title-leaking; bestseller PDP slipping → guide + internal link | WN-S3 |
| **S6** | `opus one wine` pos 16.9, 137 impr striking · **wine `investment_opportunity` = 63 BI articles (28d)** · `château margaux` pos 12.5 striking | opps / content_hub | Demand + live editorial trend for icon/collectible wine. Opus One ฿21,300 & Continuum ฿15,409 in stock | WN-H4, WN-L6 |
| **S7** | 14 **critical rank regressions** on bestseller PDPs: cloudy bay 2.6→11.3, matua 2.2→7.9, catena zapata 1.6→8.4, krug 3.0→8.8, château margaux 4.6→13.0, chablis 5.0→12.5 | regression_alerts | Recovery spotlights + internal links to rebuild bestseller authority; all have in-stock SKUs | WN-S5, WN-S6, WN-L5 |
| **S8** | LIQ9: only **branded** queries index (`liq9` 298 impr pos 1.8); generic terms (`buy tequila`, `gin thailand`, `thai liquor`) pos 64–77 = unindexed. BI spirits trend = **whisky dominant: 174 articles, `limited_release` 53, `investment_opportunity` 13** | gsc_daily(liq9) / content_hub | Greenfield ⇒ depth-first whisky cluster to earn first generic impressions; Japanese/Scotch scarcity is the live trend. 30 whisky SKUs in stock | LQ-H1, LQ-H2, LQ-S1–S4 |
| **S9** | `ไวน์ตุ๊กตาคู่` (gift-pair wine) 862 impr @ **5.10%** pos 3.7 · `แชมเปญ ราคา` 793 @ **5.17%** pos 3.8 | gsc_daily | Gift-buying intent already converting at high CTR → Mother's Day (12 Aug) tentpole | WN-H1, WN-L2, WN-S8/S9 |

**Feed cross-check (key clusters, in-stock):** Red ≤฿1,000 = **50 SKUs** · Sparkling = 24 (8 Prosecco,
Champagne incl. Veuve/Moët/Ruinart/Dom Pérignon/Cristal/Krug) · **Cava = 0** · Whisky = **30** (entry
Tenjaku ฿789→ icon Macallan 18 Sherry ฿23,899, Japanese: Hibiki/Yamazaki 12/Toki/Chita/Kakubin) ·
Rosé = 12 (Whispering Angel ฿1,100, Domaines Ott ฿1,100, Granmonte Sakuna ฿1,099 *Thai*) · Icon wine
≥฿8,000 = Opus One ฿21,300, Continuum ฿15,409, Shafer Hillside ฿18,100 · Moscato/sweet = 3.

---

## 2 · Per-brand KPI baselines (judge them differently — §3.5)

- **Wine-Now (established):** baseline brand impressions ≈ **555k / 28d**; flagship leaks recorded
  above (cava 15k @0.02%, EN most-expensive ~12k @<0.5%, cabernet 815 @0.49% pos 4.5). KPI = **CTR +
  average-position movement on these existing queries** over 30–60 days. This is where August revenue is.
- **LIQ9 (greenfield):** baseline = branded only (`liq9` 298 impr); **zero generic indexation**
  (generic spirits queries sit pos 64–77). KPI = **leading indicators** — indexation rate, pages
  crawled, first generic impressions, branded-search growth. **Not** revenue.
- **Collector/Icon pieces** (Opus One ฿21,300, Macallan 18 ฿23,899): KPI = rankings / links / dwell /
  authority. **Never** "ask-on-LINE" conversion.

---

## 3 · Validated slate — pyramid model (§3.3)

**6 Hero · 13 Standard · 9 Light = 28 pieces** (vs July's diluting 62). Every row cites a signal.
Brief IDs: `WN-` Wine-Now, `LQ-` LIQ9.

### HERO (6) — full depth + 3 JSON-LD, the tentpoles
| ID | Title (native Thai) | Primary KW | Signal | Cat / Funnel | Day |
|---|---|---|---|---|---|
| **WN-H3** | ไวน์แดงราคาไม่เกิน 1,000 บาท: คู่มือเลือกซื้อฉบับสมบูรณ์ | `ไวน์แดง ราคา` | S1 | Spotlights / BOFU | 2 |
| **LQ-H1** | วิสกี้ 101: คู่มือฉบับสมบูรณ์สำหรับมือใหม่ (cluster hub) | `วิสกี้` | S8 | Education / TOFU | 1 |
| **WN-H1** | ไวน์ของขวัญวันแม่ 2026: คัดบอตเทิลพรีเมียมตามงบ | `ไวน์ ของขวัญ วันแม่` | S9 | Spotlights / BOFU | 10 |
| **WN-H2** | โต๊ะอาหารวันแม่: จับคู่ไวน์กับเมนูครอบครัวทั่วโลก (+1 เมนูไทย) | `ไวน์ จับคู่ อาหาร` | S1+S9 | Pairing / MOFU | 11 |
| **WN-H4** | Opus One: บันทึกนักสะสม — ตำนานนาปาวัลเลย์ (concierge) | `opus one` | S6 | Spotlights / BOFU | 12 |
| **LQ-H2** | The Macallan 18: ไอคอนซิงเกิลมอลต์สำหรับนักสะสม (concierge) | `macallan 18` | S8 | Spotlights / BOFU | 22 |

### STANDARD (13)
| ID | Title | Primary KW | Signal | Cat / Funnel | Day |
|---|---|---|---|---|---|
| WN-S1 | แชมเปญ vs โปรเซกโก: เลือกสปาร์กลิงให้ถูกโอกาส | `แชมเปญ โปรเซกโก` | S3 | Spotlights / MOFU | 6 |
| WN-S2 | โปรเซกโกยอดนิยม: คู่มือเลือกซื้อ (recovery `prosecco wine`) | `โปรเซกโก` | S3 | Spotlights / BOFU | 14 |
| WN-S3 | คาเบอร์เนต์ ซาวินญง: รู้จัก จับคู่ และเลือกขวดที่ใช่ | `คาเบอร์เนต์ ซาวินญง` | S5 | Education / MOFU | 4 |
| WN-S4 | ไวน์โลกใหม่ vs โลกเก่า: ต่างกันอย่างไร | `ไวน์ โลกใหม่` | S7(new world pos18) | Education / TOFU | 16 |
| WN-S5 | Robert Mondavi & นาปาวัลเลย์: ทำความรู้จักผู้ผลิต (recovery) | `robert mondavi` | S7 | Spotlights / MOFU | 18 |
| WN-S6 | Cloudy Bay & ซาวินญง บลอง มาร์ลโบโรห์ (recovery) | `cloudy bay` | S7 | Spotlights / MOFU | 20 |
| WN-S7 | ไวน์ที่แพงที่สุดในโลก — ฉบับรวมศูนย์ (cannibalization fix) | `most expensive wine` | S4 | Tips / TOFU | 7 |
| WN-S8 | ไวน์หวาน & มอสคาโต: ขวดเริ่มต้นที่ดื่มง่าย (gift angle) | `ไวน์หวาน` | S9 | Education / MOFU | 9 |
| WN-S9 | ไวน์โรเซ่: ของขวัญสีชมพูสำหรับวันแม่ | `ไวน์ โรเซ่` | S9 | Spotlights / BOFU | 8 |
| LQ-S1 | ภูมิภาคสกอตช์วิสกี้: 5 แคว้น 5 สไตล์ (spoke→hub) | `สกอตช์ วิสกี้ ภูมิภาค` | S8 | Education / MOFU | 3 |
| LQ-S2 | ซิงเกิลมอลต์ vs เบลนด์: ต่างกันอย่างไร (spoke→hub) | `ซิงเกิลมอลต์ เบลนด์` | S8 | Education / MOFU | 5 |
| LQ-S3 | ไฮบอล: วิธีชงวิสกี้สไตล์ญี่ปุ่นให้เข้ากับอาหาร (spoke→hub) | `ไฮบอล วิสกี้` | S8 | Pairing / MOFU | 13 |
| LQ-S4 | วิสกี้ญี่ปุ่น: ทำไมหายากและเริ่มต้นตรงไหน | `วิสกี้ ญี่ปุ่น` | S8 | Tips / TOFU | 25 |

### LIGHT (9) — listicles, serve/recipe cards, recurring columns, social repurpose
| ID | Title | Primary KW | Signal | Cat / Funnel | Day |
|---|---|---|---|---|---|
| WN-L2 | ของขวัญวันแม่ใต้ 1,500 บาท: ไวน์ที่ให้แล้วไม่ผิด | `ของขวัญ วันแม่ ไวน์ งบ` | S9 | Spotlights / BOFU | 10 |
| WN-L3 | ไวน์คู่สเต๊ก: จับคู่ให้ลงตัวใน 3 ข้อ (Sommelier's Pick) | `ไวน์ คู่ สเต๊ก` | S7(steak&wine pos18) | Pairing / MOFU | 15 |
| WN-L4 | ชีสบอร์ดกับไวน์: คู่มือฉบับย่อ (worldwide, repurpose) | `ไวน์ ชีส` | S1 | Pairing / TOFU | 19 |
| WN-L5 | Chablis & Chardonnay เย็นๆ รับหน้าฝน (recovery `chablis`) | `chablis` | S7 | Spotlights / MOFU | 21 |
| WN-L6 | Collector's Notebook: Cristal · Dom Pérignon · Krug | `cristal champagne` | S6 | Spotlights / BOFU | 24 |
| WN-L7 | ดื่มอะไรดีหน้าฝน: ไวน์แดงอุ่นใจสำหรับมื้อในบ้าน | `ไวน์ หน้าฝน` | green-season peg | Tips / TOFU | 28 |
| LQ-L1 | Bartender's Corner: ไฮบอลเสิร์ฟสวยใน 4 สเต็ป (serve card) | `ไฮบอล วิธีทำ` | S8 | Tips / TOFU | 17 |
| LQ-L2 | วิสกี้กับอาหาร: จับคู่ชีสและช็อกโกแลตเบื้องต้น | `วิสกี้ จับคู่ อาหาร` | S8 | Pairing / TOFU | 23 |
| LQ-L3 | Old Fashioned: ค็อกเทลวิสกี้คลาสสิก (Bartender's Corner) | `old fashioned สูตร` | S8 | Tips / TOFU | 27 |

> **Light franchise note:** *Sommelier's Pick of the Week* = WN-L3 + weekly social cuts of spotlights;
> *Bartender's Corner* = LQ-L1 + LQ-L3; *Collector's Notebook* = WN-H4, LQ-H2, WN-L6.

---

## 4 · Mother's Day run-up week (8–12 Aug) — the tentpole cluster

No dry day falls in August 2026 (confirmed: 2026 dry days are 3 Mar, 31 May, 29/30 Jul, 26 Oct).
Aug 12 = Thai Mother's Day, national holiday, **not** a dry day. Gifting copy stays **lifestyle, not
health** (compliance §8).

| Day | Piece | Role |
|---|---|---|
| 8 | WN-S9 Rosé pink gifting | Gift spoke |
| 9 | WN-S8 Moscato/sweet "easy gift" | Gift spoke |
| **10** | **WN-H1 premium gift guide (TENTPOLE)** + WN-L2 budget gift listicle (<฿1,500) | BOFU hero — lands 2 days early to index |
| **11** | **WN-H2 family-table pairing (TENTPOLE)** | The Mother's Day meal |
| **12** | **WN-H4 Opus One — Collector gifting** | The ultimate gift, concierge CTA |

All gift pieces internally cross-link to WN-H1; WN-H1 ↔ WN-H2 ↔ WN-H4 form the gifting triangle.

---

## 5 · Cannibalization map (one primary KW per piece — §3.8)

- **"most expensive wine" family** → exactly **one** canonical page (WN-S7). All icon pieces
  (WN-H4 Opus One, WN-L6 Cristal/DP/Krug) link **up** to it; it links **down** to them. No other
  page targets the EN "expensive wine" head terms.
- **Sparkling** split cleanly: WN-S1 = comparison head term (`แชมเปญ โปรเซกโก`), WN-S2 = `โปรเซกโก`
  buyer term, WN-L6 = prestige champagne names (`cristal`). Cava demand is handled as a **title/meta
  fix on the existing cava page** (0 cards + LINE, no stock) — folded into WN-S7's recovery scope; it
  does **not** get a new commercial page.
- **Red wine:** WN-H3 owns `ไวน์แดง ราคา` (BOFU); WN-S3 owns `คาเบอร์เนต์ ซาวินญง` (varietal);
  WN-L3 owns `ไวน์ คู่ สเต๊ก` (pairing). No overlap.
- **LIQ9 whisky cluster:** LQ-H1 hub (`วิสกี้`) ← spokes LQ-S1 (`สกอตช์ ภูมิภาค`), LQ-S2
  (`ซิงเกิลมอลต์ เบลนด์`), LQ-S3 (`ไฮบอล`), LQ-S4 (`วิสกี้ ญี่ปุ่น`), LQ-H2 (`macallan 18`). Each
  spoke targets a distinct term and links back to the hub; hub links out to all.

---

## 6 · Funnel balance (Wine-Now BOFU adequacy — §3.8)

BOFU/commercial Wine-Now pieces: WN-H3, WN-H1, WN-H4, WN-S2, WN-S9, WN-L2, WN-L6 = **7 hard BOFU**
against the proven converting clusters (red ≤฿1,000, gifting, prosecco, collector). That's the
demand-conversion backbone the 555k impressions need.

---

## 7 · SKU / compliance discipline (re-confirm at build time — §8)

- Every commercial card uses a **real in-stock SKU from the current feed** (`data-sku` + visible
  `SKU:` chip), priced `~฿` from the feed (not this doc), routed to LINE.
- **0-stock topics → 0 cards + LINE:** cava (WN-S7 scope). Moscato thin (3 SKUs) — card the 3, no padding.
- **Verify-at-build flags:** Robert Mondavi (WN-S5) — confirm a Mondavi SKU exists in the feed at
  build; if not → education-led piece, 0 cards + LINE. Any critic score / award / vintage number →
  cite source or render a visible verify-note (no fabrication).
- Concierge CTA (private client / allocation / ติดต่อทีมดูแลลูกค้าพิเศษ) on WN-H4, LQ-H2, WN-L6 only.
- Every page: compliance footer `ดื่มอย่างมีความรับผิดชอบ · 20+`, branded E-E-A-T byline, 3 JSON-LD.

---

## 8 · Acceptance checklist → see brief §10 (filled at end of session).
