# WNLQ9 — Content Strategy & Multi-Platform Plan

**Owner:** winenowsommelier · **Drafted:** 2026-06-03 · **Horizon:** Aug 2026 →
**Pairs with:** [`CLAUDE.md`](../CLAUDE.md) (rules), [`docs/RUNBOOK.md`](RUNBOOK.md)
(ops), [`docs/CONTENT_PRODUCTION_PLAYBOOK.md`](CONTENT_PRODUCTION_PLAYBOOK.md) (how
to write). This file = *what to make next, and how to repurpose it across channels.*

> Scope decided 2026-06-03: expand beyond the Magento blog to **Social
> (IG/TikTok/FB) · LINE OA · Email/newsletter · Video/YouTube**, using a
> **repurpose-from-blog** model (blog = source of truth, everything else derives).

---

## 1) Current-state review (May–July 2026)

Pulled from the three Notion month boards + the Supabase `content_plan` mirror.
Row counts are "at least" (Notion read was capped at 25/month).

| Month | Board | Character | Status reality |
|---|---|---|---|
| **May** | `📝 Content Production` | **Quality benchmark.** Distinctive, opinion-led, Thai-context-first; locally timed (Visakha Bucha → sober-curious; Gambero Rosso, Penfolds events). | Most mature/voiced. |
| **June** | `2026 JUN` | Transitional. Good pegs (World Gin Day, Father's Day, alcohol-tax 2026) + heavy **commercial/product-spotlight** push. | Stuck — mostly *Review/Not started*; **nothing Published, no Final URLs**, briefs empty. |
| **July** | `2026 JUL` | SEO foundation: mostly evergreen TOFU "101" + drink-day pegs (Bastille, Rum/Tequila/Scotch Day). | Batch-created Jun 2; **generic** — differentiation dropped vs May. |

**Trend line to reverse:** May (sharp voice) → June (commercial pivot, stalled
execution) → July (generic filler). *Quality is drifting down while volume holds
~25/mo.*

### Process problems found
1. **🔴 Mirror is unreliable.** Supabase `content_plan` holds **only 12 June rows**,
   all `Review`, all with **KEY/TENSION/STORY/CTA/Funnel/Intent = NULL**, synced
   2026-06-02. May & July aren't mirrored at all. → **Notion is the only source of
   truth today;** fix or stop depending on the mirror.
2. **Briefs written too late.** Topics are committed before KEY/TENSION/STORY exist,
   so drafts start cold → June stalled, July went generic.
3. **No ship = no feedback.** No `Published`, no Final URLs → no performance loop.
4. **Demand data unused.** SEO-Automation Supabase has **364k GSC + 111k GA4 rows**;
   topic picks are intuition-led, not demand-led.
5. **"Social" Type defined but unused** — the multi-platform layer is empty.

---

## 2) The forward operating model (Aug →)

### 2.1 Brief-first, demand-led pipeline
```
GSC/GA4 demand  ─▶  cluster into topics  ─▶  write BRIEF (KEY/TENSION/STORY+keyword)
      │                                              │
      └── kill/scale by GA Views (monthly) ◀── SHIP (Final URL + Published) ◀── draft v2 HTML
```
- **Topic selection = data, not guesswork.** Each month, pull GSC queries with high
  impressions + weak position (5–20) / low CTR → those gaps are the topic list.
- **Brief gate.** No row leaves *Not started* until KEY / TENSION / STORY + Target
  Keyword are filled. Drafting only starts at **Brief Ready**.
- **Ship gate.** On publish, set `Final URL` + `Status = Published`; read `GA Views`
  back per row at month-end to kill or scale.

### 2.2 Fixed monthly skeleton (per site, ~24–26 posts) — stops quality drift
| Bucket | Count | Funnel | Notes |
|---|---|---|---|
| **Pillar** | 2 | TOFU/MOFU | Evergreen cornerstone + internal-link hub |
| **Education / Evergreen** | 8–10 | TOFU | The "101" base — but **every piece gets a Thai-context hook** |
| **Commercial / Spotlight** | 6–8 | BOFU | Real in-stock SKUs, buy-intent, "สั่งซื้อทาง LINE" |
| **Timely** | 4–6 | any | Calendar pegs + events |
| **Signature POV** | 2–4 | any | May-style opinion pieces — **protect these; they are the brand** |

### 2.3 Calendar pegs (standing list — fill the "Timely" bucket from here)
- **Thai local (high value):** Mother's Day (Aug 12), Father's Day (Dec 5),
  Songkran (Apr), Visakha/Buddhist holidays (alcohol-restricted → *sober-curious*
  angle, as May did well), New Year gifting (Dec).
- **Global drink-days:** World Gin Day (Jun), World Rum Day (Jul), Tequila Day
  (Jul 24), Scotch Day, Bastille Day (Jul 14), Champagne Day (Oct), Coffee/Negroni
  weeks, etc.
- **Trade/commercial:** vintage releases, tax/price changes, local tastings & expos
  (Gambero Rosso, brand promos).

### 2.4 Pillar → cluster linking
Each pillar gets 4–6 supporting blogs that link up to it (and the pillar links
down). Stop publishing flat, unlinked posts.

---

## 3) Multi-platform repurposing engine (blog = source of truth)

**Principle:** one blog spawns a derivative "pack." Nothing is authored natively
from scratch — every channel asset traces back to a blog's **Hook** (its TENSION
one-liner) and **KEY points**. This stays inside the **Option B, no-paid-API**
model: Claude Code drafts the blog *and* the repurposed copy; a human posts/schedules.

### 3.1 What each blog spawns
| Channel | Asset | Derived from | Cadence |
|---|---|---|---|
| **Blog (Magento, TH, v2)** | The hero article | — (source) | every row |
| **IG/TikTok/FB** | Carousel (5–7 slides) = the KEY points; Reel/TikTok (30–45s) = the single strongest Hook; FB teaser + link | KEY points + TENSION + hero image dir. | Pillars + Commercial + Timely; Education as capacity allows |
| **LINE OA** | Rich message card: hook + 2–3 product chips (carry the blog's SKUs) + "สอบถาม/สั่งซื้อทาง LINE" | Commercial blogs + weekly digest | weekly broadcast |
| **Email / newsletter** | Monthly roundup (new posts + 2–3 product picks); pillars get a standalone feature | month's blogs | monthly (+ pillar sends) |
| **Video / YouTube** | Pillar → 3–5 min explainer; Shorts = same cut as the TikTok (cross-post) | Pillars; reusable Hooks | 1–2 pillars/mo |

### 3.2 Make repurposing mechanical (brief additions)
Every blog brief must now also carry, so derivation is copy-paste not re-think:
- **Hook** — the one-line TENSION (becomes the Reel/Short opener + FB teaser).
- **3–5 KEY points** — become carousel slides + video script beats.
- **Hero image direction + "POP concept"** — already in the May schema; reuse for
  thumbnails/covers.
- **SKU chips** — the blog's product-card SKUs carry straight to LINE/social.

### 3.3 Suggested cadence math (per site / month)
~24 blogs → 2 pillars (full: video + carousel + email feature) · 6–8 commercial
(LINE card + carousel) · 4–6 timely (reel + FB + LINE) · education (1 carousel or
reel each as capacity allows). ≈ **2–3 derived assets per blog.**

### 3.4 Schema / tracking (lightweight)
Extend the month boards (don't build a parallel system):
- Add **`Platforms`** (multi-select: Blog, IG, TikTok, FB, LINE, Email, YouTube).
- Add **`Repurpose Status`** (Not started / Pack Drafted / Scheduled / Posted).
- Use the existing **`Type: Social`** for standalone social-only rows (rare).
- Keep the blog row as parent; track derived assets in its properties, not new rows,
  to avoid board bloat.

---

## 4) Fix-it backlog (do these to unblock the above)

| # | Action | Why |
|---|---|---|
| 1 | **Repair the `content_plan` sync** (or retire it) so DB == Notion for all months | Mirror is 12/≈75 rows; anything reading it is blind |
| 2 | **Backfill briefs** (KEY/TENSION/STORY + Hook + KEY points) for June & July rows | Unblocks drafting + repurposing |
| 3 | **Generate the Aug topic list from GSC** (high-impression / weak-position gaps) | Demand-led, not intuition |
| 4 | **Ship June** — draft → Drive → set Final URL + Published | Restart the feedback loop |
| 5 | **Add `Platforms` + `Repurpose Status`** to the month boards | Track the multi-platform layer |
| 6 | **Codify the monthly skeleton** (§2.2) as the August board template | Stops quality drift |

---

## 5) Governance / definition-of-done
- **Brief Ready** = KEY/TENSION/STORY + Target Keyword + Hook + 3–5 KEY points.
- **Done** = v2 TH HTML in `pipeline/public/content/`, mapped in `articles.json`,
  Drive-uploaded, Notion row `Drive file URL` set.
- **Published** = live on Magento + `Final URL` set + repurpose pack drafted.
- **Reviewed** = `GA Views` read back at month-end; kill/scale logged.

> Golden rules still bind everything (Thai-first, real SKUs only, no fabricated
> numbers, compliance footer, JSON-LD). See `CLAUDE.md`.
