# WNLQ9 Marketing & Content Plan (v1 — June 2026)

Upgraded marketing + content strategy for **Wine-Now** (wine) and **LIQ9**
(spirits), produced by applying the vendored marketing skills in
[`.claude/skills/`](../.claude/skills/README.md) to our actual setup.

> **This plan obeys the golden rules.** Thai-first articles, **no fabricated
> facts**, real in-stock SKUs only, price-on-request + LINE, `20+` footer. Every
> generic tactic below is filtered through
> [`CLAUDE.md`](../CLAUDE.md) and the
> [Content Production Playbook](CONTENT_PRODUCTION_PLAYBOOK.md). Where a number is
> needed, pull it from GSC / the BI feed / a cited source and add it to the
> verify-list — **never invent it.**

Powered by skills: `marketing-plan` (structure), `content-strategy`,
`ai-seo`, `programmatic-seo`, `seo-audit`, `schema`, `cro`, `analytics`,
`social`, `sms`, `copywriting`, `marketing-ideas`.

---

## 1. Executive summary

We already produce genuinely good, compliant, fast Thai long-form articles. The
three bets that turn that content into measurable demand:

1. **Win AI search (AEO/GEO), not just blue links.** ~45% of Google searches now
   show AI Overviews, and Thai users increasingly ask ChatGPT/Perplexity "ไวน์
   คู่กับ…", "วิสกี้รุ่นไหนดี". Our content is well-structured but has *zero*
   deliberate AI-citation strategy. This is the highest-leverage, lowest-cost
   upgrade — and its #1 lever (cite real sources + statistics) is exactly what
   our no-fabrication rule already forces us toward. → `ai-seo`
2. **Turn the SKU feed into programmatic topic pages.** Our real, in-stock
   product feed is *proprietary data* (the most defensible kind for pSEO). Occasion,
   pairing, grape/region, and "best-value" page templates let us cover the long
   tail at scale without inventing anything. → `programmatic-seo`
3. **Close the loop to LINE and measure it.** Today content ships to Drive and
   the funnel effectively ends at "read." Instrument article → LINE / PDP with
   UTMs, optimize that single conversion path, and track an honest north-star. →
   `cro` + `analytics`

**90-day outcome:** every article AEO-optimized and schema-rich; AI-bot access
verified; first programmatic cluster live off real SKUs; a measurement spine
(GSC + UTM + monthly AI-citation check) so we can see what works.

**12-month outcome:** Wine-Now and LIQ9 are the Thai brands AI assistants cite
for wine/spirits questions, with a self-feeding pillar→cluster→programmatic
content engine.

---

## 2. Strategic frame

| | Wine-Now | LIQ9 |
|---|---|---|
| Category claim | The trusted Thai guide to buying & enjoying wine | The trusted Thai guide to whisky, spirits & cocktails |
| Audience | Thai wine-curious 25–45, gifting, dining occasions | Thai spirits enthusiasts, gifting, home bar, cocktail-curious |
| Primary intent we serve | "what/which to buy + how to enjoy" in Thai | same, for spirits |
| Conversion endpoint | **LINE** (`@wine-now`) + Magento PDP | **LINE** (`@liq9`) + Magento PDP |
| Non-negotiables | Thai-only · real SKU · price-on-request · `20+` · E-E-A-T byline · no fabrication | same |

**Brand & content are cross-cutting** (they serve every funnel stage), not a
single stage — consistent with how `marketing-plan` treats them.

---

## 3. AARRR funnel — adapted to alcohol e-commerce

`marketing-plan` is AARRR-structured for SaaS; here it is re-mapped to our
storefront-plus-blog reality. "Activation" for us is **a reader taking the first
real buying action** (adds LINE, opens a PDP, asks for price), not a SaaS signup.

| Stage | What it means for WNLQ9 | Primary moves | Skill |
|---|---|---|---|
| **Acquisition** | Strangers find us via search / AI / social | SEO + AEO, programmatic pages, social repurposing | `ai-seo`, `seo-audit`, `programmatic-seo`, `content-strategy`, `social` |
| **Activation** | First valued action: add LINE / open PDP / ask price | On-article CTA, product cards w/ real SKU, sticky LINE CTA | `cro`, `copywriting` |
| **Retention** | Reader comes back / stays on LINE | LINE broadcasts, evergreen refresh, seasonal series | `sms` (→ LINE), `content-strategy` |
| **Referral** | Readers share / word-of-mouth | LINE share, UGC, authentic Pantip/YouTube presence | `social`, `ai-seo` (third-party presence) |
| **Revenue** | Basket size & repeat | Occasion bundles, pairing upsell, gifting, price-on-request flow | `cro`, `marketing-ideas` |

Stage-by-stage detail in §5–§9.

---

## 4. Content strategy — pillars & clusters

Apply `content-strategy`: own **3–4 pillars per brand**, each spawning a topic
cluster (hub + spokes), interlinked. Map every piece to a **buyer stage** so the
calendar is balanced, not all top-of-funnel. Our existing articles already slot
into these pillars (shown in *italics*).

### Wine-Now pillars

1. **Wine 101 / education** — *acidity, tannin, Pinot Noir 101, Cabernet 101*,
   sulfites, decanting, serving temp, storage. *(Awareness)*
2. **Food & occasion pairing** — Thai-food pairings, *white wines for summer*,
   Songkran/New-Year/Valentine, wedding & gifting. *(Awareness→Consideration)*
3. **Buying & value** — how to choose, price tiers, regions, *excise tax 2026*,
   *most expensive wines*, "ราคาดี" value picks. *(Consideration→Decision)*
4. **Wine culture & trends** — *Gen-Z wine trends, Khao Yai wine tourism*,
   natural/organic, Thai wine scene. *(Awareness/shareable)*

### LIQ9 pillars

1. **Spirits 101** — *whisky 101*, gin, rum, agave, proof vs ABV, regions. *(Awareness)*
2. **Cocktails & mixing** — *spicy Thai cocktails*, classics, home-bar basics. *(Awareness)*
3. **Brand & region guides** — *Macallan guide, bourbon recommendations*,
   Japanese whisky, Scotch regions. *(Consideration)*
4. **Buying & gifting** — *buy gin online*, gift guides, how to choose a bottle,
   value picks. *(Consideration→Decision)*

### Buyer-stage keyword modifiers (Thai)

Use these to fill each cluster and balance the funnel (`content-strategy`):

- **Awareness:** "…คืออะไร", "วิธี…", "…สำหรับมือใหม่", "รู้จัก…"
- **Consideration:** "ดีที่สุด", "เทียบ / vs", "แนะนำ", "รีวิว", "เลือกยังไง"
- **Decision:** "ราคา" (→ price-on-request), "ซื้อที่ไหน", "สั่งซื้อ", "โปรโมชั่น"
- **Implementation/Enjoyment:** "วิธีดื่ม", "คู่กับอาหาร", "เก็บรักษา", "สูตร…"

### Idea prioritization

Score every candidate topic with `content-strategy`'s rubric — **Customer impact
(40%) · Content-market fit (30%) · Search potential (20%) · Resources (10%)** —
and record the score in the Notion row so the calendar is demand-driven, not
guesswork. Pull idea seeds from `marketing-ideas` and from **Pantip** threads
(the Thai analogue of the skill's Reddit/Quora research) and YouTube comments.

---

## 5. Acquisition — SEO + AI search (the core upgrade)

### 5a. AI search / AEO-GEO — `ai-seo`

This is mostly **retrofit work on the template + existing 12 articles**, then a
default for all new ones. None of it requires inventing facts.

**Verify AI-bot access (do first).** Confirm `th.wine-now.com` and
`th.liq9.com` robots.txt allow the cite-and-search crawlers — blocking them
means those engines *cannot* cite us:

- `GPTBot`, `ChatGPT-User` (OpenAI) · `PerplexityBot` (Perplexity)
- `ClaudeBot`, `anthropic-ai` (Anthropic) · `Google-Extended` (Gemini/AI Overviews)
- `Bingbot` (Copilot)

(Optional: block training-only `CCBot` if desired — that doesn't stop citation.)

**Extractable answer blocks.** Lead each `<h2>` with a **40–60 word direct Thai
answer** before elaborating. Our `สรุปสั้นๆ` callout already does this at the
top; extend the pattern section-by-section. AI engines extract passages, not
pages.

**Authority via real citations (Princeton GEO levers — and they're
fabrication-safe):**
- **Cite sources (+40%)** — when we state excise tax, cite **กรมสรรพสามิต** with
  date; for prices/scores, cite **Wine-Searcher / Whisky Advocate** etc. This is
  the same discipline as our verify-list — now make the citation *visible on the
  page*.
- **Add statistics (+37%)** — only real, dated, sourced numbers.
- **Expert attribution (+25–30%)** — our E-E-A-T byline already names the
  sommelier/bartender desk; add credentials + "ตรวจทานโดย…".
- **Keyword stuffing = −10%** — actively avoid.

**Freshness signals.** Add a visible **"อัปเดตล่าสุด: YYYY-MM-DD"** and set
JSON-LD `dateModified`. Refresh competitive evergreen quarterly.

**Query fan-out.** For each target topic, cover the 5–10 related questions the AI
fans out to (the cluster, §4) so we're retrievable for variants, not one keyword.

**Third-party presence (Thai context).** AI cites where you *appear*, often more
than your own domain:
- **Pantip** — participate authentically in wine/spirits rooms (no spam).
- **YouTube** — short Thai how-to / pairing clips for key queries.
- **Google Business Profile + Merchant Center feed** — Google explicitly favors
  these for ecom/local visibility in AI Search.
- **Thai Wikipedia** — keep any brand/category entries accurate (no fabricated
  ones).

**`llms.txt` (adapted).** Add `/llms.txt` at each blog root describing the brand,
who it's for, and links to key category/pillar pages. **Do _not_ publish a
`/pricing.md`** — price-on-request is a compliance choice; point agents to LINE
for pricing instead.

### 5b. Traditional SEO — `seo-audit`

Run the `seo-audit` checklist against the Magento blog: titles/meta uniqueness,
heading order (we already enforce h1→h2→h3), internal linking between cluster
posts, image alt text in Thai, XML sitemap coverage, canonical correctness
(we set canonical per article), Core Web Vitals (already excellent — static,
inline CSS, zero JS; protect it). Our performance baseline is a real moat for
both classic and AI search — **don't regress it.**

### 5c. Programmatic SEO off the SKU feed — `programmatic-seo`

Our `products.json` BI feed is **proprietary/product-derived data** — the
defensible kind. Build templated, genuinely-useful Thai pages (not thin doorway
pages). Candidate playbooks:

| Playbook | Pattern (Thai) | Data source | Notes |
|---|---|---|---|
| Occasion / persona | "ไวน์สำหรับ[โอกาส]" (สงกรานต์, ปีใหม่, วาเลนไทน์, งานแต่ง) | SKU feed + occasion tags | Real SKUs only; 0 cards → route to LINE |
| Pairing | "ไวน์คู่กับ[อาหารไทย]" / "วิสกี้คู่กับ[…]" | SKU feed + editorial | High-intent, very on-brand |
| Glossary | "[grape/term] คืออะไร" | editorial | Feeds AI definition queries (§5a) |
| Curation | "ไวน์[ประเภท]คุ้มราคา" | SKU feed (in-stock) | **Soft badges only — no `#NN` ranks** |
| Comparison | "[X] vs [Y]" (เบอร์เบิน vs สก็อตช์, Pinot vs Cabernet) | editorial | ~33% of AI citations are comparisons |

**Quality gates (mandatory, per `programmatic-seo` + our rules):** every page has
unique value, a real-SKU product section (or honest 0-cards→LINE), unique
title/meta, schema, internal links to its hub, no fabricated numbers, and a
verify-note where a hard fact is missing. Noindex anything genuinely thin.
Generate via the existing `pipeline/` renderer so output stays Magento-safe and
self-contained.

---

## 6. Activation — article → LINE / PDP — `cro` + `copywriting`

Today the funnel ends at "read." Tighten the path to first buying action:

- **One primary CTA per page = LINE.** Keep it visible (sticky on mobile),
  benefit-led Thai copy ("ทักไลน์ให้ซอมเมอลิเย่ช่วยเลือก"), not a generic button.
- **Product cards do the selling** — real `data-sku` + visible SKU chip + `~฿`
  approximate + "สอบถามราคา/สั่งซื้อทาง LINE" (already in the playbook). CRO
  layer: make "ดูขวดนี้ →" and the LINE ask the two obvious next steps.
- **Real social proof only.** If we have genuine review counts/ratings, surface
  them (and mark up with `Review`/`AggregateRating`, §7). If not, omit — **no
  invented proof.**
- **Copywriting** in Thai: lead with the reader's job-to-be-done, one idea per
  paragraph (also helps AI extraction), concrete > vague.

---

## 7. Schema upgrades — `schema`

We already ship three JSON-LD blocks (Article, BreadcrumbList, FAQPage — with
Article headline matching H1 and FAQPage mirroring the on-page FAQ). Add:

- **`Product`** on each product card — `name`, `sku` (the real SKU), `brand`,
  `category`, and `offers` with `priceCurrency: "THB"`. For price-on-request use
  a defensible `offers` shape (e.g. availability + `url` to LINE) rather than
  inventing an exact price; keep visible `~฿` as approximate. Confirm the value
  with the BI feed.
- **`ItemList`** on curation/comparison/programmatic pages (structured list of
  the SKUs featured).
- **`HowTo`** on genuine how-to content (decanting, serving, simple cocktails).
- **`Organization`** sitewide for entity recognition (brand → AI Knowledge Graph).
- **`Review` / `AggregateRating`** — **only if real reviews exist.** Never
  fabricate ratings (also a Google structured-data policy violation).

Keep `dateModified` current (ties to the freshness signal in §5a).

---

## 8. Retention & Referral — `sms` (→ LINE) + `social`

- **LINE as our lifecycle channel** (apply `sms` best-practices, adapted): value-
  first broadcasts (new guide, seasonal pairing, restock), clear opt-in, sane
  cadence, segment by interest (wine vs spirits; occasion). Compliant, never
  spammy; every message earns the next.
- **Social repurposing (`social`).** Each published article → a small set of Thai
  social posts (FB/IG/TikTok/LINE VOOM): the `สรุปสั้นๆ` as a carousel, one
  pairing tip, one "ดูขวดนี้" with the real SKU. Distribution is where most good
  content dies — make repurposing a step in the production checklist.
- **Referral / WOM:** LINE "share to friend", encourage genuine UGC (tasting
  photos), and the third-party presence work in §5a doubles as referral surface.

---

## 9. Revenue — `cro` + `marketing-ideas`

- **Occasion bundles & pairing upsell** — merchandise real in-stock SKUs around
  occasions (Songkran set, New-Year gifting) and pairings; basket-building
  without discounting claims we can't verify.
- **Gifting** — gift-guide programmatic pages (§5c) into LINE concierge.
- **Price-on-request as a feature, not a gap** — the LINE conversation is a
  consultative upsell moment; brief the team to use it (cross-sell, larger format).
- Pull more tactics from `marketing-ideas` as the calendar needs them — filtered
  through compliance.

---

## 10. Measurement — `analytics`

You can't improve what you don't measure. Minimum spine:

- **North-star:** qualified LINE conversations / orders attributable to blog
  content (proxy until storefront attribution is wired).
- **Leading indicators by stage:** Acquisition = organic sessions + AI-referral
  sessions + indexed programmatic pages; Activation = LINE adds + PDP clicks from
  blog (UTM); Retention = LINE broadcast open/CTR + returning readers; Revenue =
  basket size / orders from LINE.
- **UTM scheme** on every blog→LINE / blog→PDP link
  (`utm_source=blog&utm_medium=article&utm_campaign=<slug>`), so the storefront /
  LINE side can attribute.
- **Search Console** for traditional performance, coverage, CWV. Note
  (`ai-seo`): **there is no AI-specific GSC reporting** — so add a **monthly
  manual AI-citation check**: run our top ~20 Thai queries through ChatGPT,
  Perplexity, and Google AI Overviews; log "are we cited / who is / which page"
  in a sheet and track month-over-month.
- Keep the log next to the Notion board so the content calendar reacts to it.
- **Never fabricate metrics** in reports — same rule as articles.

---

## 11. 90-day roadmap (AARRR-tagged · assign owners in Notion)

**Weeks 1–2 — Unblock (mostly verification, no new content):**
- [ ] Audit robots.txt on both blogs for AI-bot access (§5a). *[Acq]*
- [ ] Add visible "อัปเดตล่าสุด" + JSON-LD `dateModified` to the template. *[Acq]*
- [ ] Baseline: GSC export + first monthly AI-citation check (20 queries). *[Measure]*
- [ ] Add UTM params to all blog→LINE / blog→PDP links. *[Activation]*

**Weeks 3–4 — Foundation:**
- [ ] Lock the pillar→cluster map (§4) into the Notion board for both brands. *[Acq]*
- [ ] Extend `schema`: add `Product` + `ItemList` to the template + `Organization`
      sitewide (§7). *[Acq]*
- [ ] Publish `/llms.txt` on both blog roots (§5a). *[Acq]*
- [ ] AEO answer-block + visible-citation retrofit on the top 5 existing articles. *[Acq]*

**Weeks 5–8 — Velocity:**
- [ ] Ship the first programmatic cluster (occasion **or** pairing) off real SKUs
      via the `pipeline/` renderer (§5c). *[Acq/Rev]*
- [ ] AEO retrofit across the remaining existing 12 articles. *[Acq]*
- [ ] Stand up social-repurposing as a production-checklist step (§8). *[Ret/Ref]*
- [ ] Begin authentic Pantip/YouTube presence on 2–3 priority topics. *[Ref]*

**Weeks 9–12 — Compound:**
- [ ] Re-run the AI-citation check; compare to Week-1 baseline; double down on
      what moved. *[Measure]*
- [ ] Expand programmatic playbooks (comparison + curation pages). *[Acq]*
- [ ] First LINE lifecycle broadcasts to opted-in readers (§8). *[Ret]*
- [ ] Occasion-bundle merchandising for the next Thai festival. *[Rev]*

---

## 12. Open decisions & data to pull (verify-list)

Honest gaps — fill from real sources, never invent (consistent with our culture):

- **GSC + BI baselines** — real organic numbers, top queries, current SKU
  in-stock set. *(needed for §4 prioritization & §10)*
- **PDP URL pattern** — confirm to switch product cards from `catalogsearch?q=`
  to real per-SKU PDP deep links (already an open item in the playbook). *(§6/§7)*
- **Do real reviews exist?** Decides whether `Review`/`AggregateRating` schema is
  allowed (§7). If not → omit.
- **`Product` offers shape under price-on-request** — confirm the compliant
  JSON-LD pattern we're comfortable publishing (§7).
- **Owners, cadence, budget** — assign in Notion; this plan is structured to be
  executed by a small team + these skills, not a big org.
- **Competitor set** — identify the actual Thai wine/spirits sites we're up
  against in AI answers (from the citation check, §10) — don't assume.

---

*Sources & frameworks: the vendored skills in
[`.claude/skills/`](../.claude/skills/README.md) (Corey Haines'
`marketingskills`, MIT). All recommendations are subordinate to
[`CLAUDE.md`](../CLAUDE.md) and the
[Content Production Playbook](CONTENT_PRODUCTION_PLAYBOOK.md).*
