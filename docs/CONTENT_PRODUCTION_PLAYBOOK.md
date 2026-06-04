# WNLQ9 Content-Production Playbook

The repeatable process for producing blog content for the two Thai beverage
e-commerce brands **Wine-Now** (wine) and **LIQ9** (spirits). Follow this on
**every** content session so output stays consistent. This is the source of
truth for *how we make content*; the **Notion board** is the source of truth for
*what to make and its status*; the **product feed** (`pipeline/data/products.json`,
from the BI/Supabase DB) is the source of truth for *real SKUs/prices*.

> TL;DR for a new session: pull updated topics+briefs from the **Notion board**
> and SKUs from the **product feed** → write **full, ready-to-use Thai articles**
> (not briefs) at "Whisky 101 v2" depth → real in-stock SKUs on every card with a
> visible SKU chip; no fabricated numbers (verify-list instead) → pass the **QA
> gate** (`validate-articles.mjs`) → generate **Magento-safe fragments**
> (`magento-export.mjs --mode scoped`) → upload them to the Drive folder
> **`WNLQ9 2026-JUN`** → set Notion **Status = "Brief Ready"** + **Drive file URL**
> → commit/push the standalone HTML.

---

## 0. The production pipeline (intake → publish)

This is the orchestration that turns updated DB/Notion briefs into delivered
content. Each phase has a committed tool; the whole thing is reproducible.

**Phase 1 — Intake.** Pull the rows to make from the Notion board
**`2026 JUN — WNLQ9 — Content Production`** (db `786d080f-8da2-4a1e-b84e-161f4e19d56d`,
data source `collection://6be4a7bb-d42c-4286-be1b-fa73e3635b45`). Each row gives:
Title, Site, Day, Funnel, Intent, Category, Type, Priority, Word Target, Target
Keyword, Evergreen, Author, **STORY / TENSION / CTA / Content Brief**. Load the
**product feed** `pipeline/data/products.json` for real in-stock SKUs/prices.

**Phase 2 — Plan SKUs & stock gaps (do this BEFORE authoring).** For each row,
pick the real in-stock SKUs it will feature. Flag categories the feed does **not**
stock → those articles ship **0 product cards + route to LINE** (never invent a
product). Known empty categories: **Cava, Japanese whisky, mezcal, sake,
Thai-craft/Iron Balls, barware, vermouth**.

**Phase 3 — Author in parallel (sub-agents).** Dispatch `general-purpose`
sub-agents (waves of ≤6) each producing ONE article. Hand each agent: its row's
brief, the exact SKUs (or "0 cards → LINE"), and point it at
`pipeline/scripts/author-kit.md` (the authoring spec) + the brand exemplar. Each
agent writes a standalone `.html` to `pipeline/public/content/` and self-runs the
QA gate until it PASSES. (Sub-agents can self-publish to Drive/Notion only if those
MCP tools are in `.claude/settings.json` → `permissions.allow` — see §9 ops.)

**Phase 4 — QA gate (mechanical, must pass).**
`node pipeline/scripts/validate-articles.mjs` — enforces every golden rule
(headline==H1, FAQ mirror, real in-stock SKU + visible chip, soft badges, ~฿+LINE,
footer 20+, 3 JSON-LD, Sarabun/canonical/og). Nothing ships unless it PASSES.

**Phase 5 — Magento export.** `node pipeline/scripts/magento-export.mjs --mode scoped`
→ embeddable fragments in `pipeline/public/magento/scoped/` (see §6).

**Phase 6 — Deliver to Drive.** Upload the **fragments** to **`WNLQ9 2026-JUN`**
(see §7). **Use ONE sequential agent** — parallel upload agents trip the model-API
rate limiter.

**Phase 7 — Notion.** Per row: **Status = "Brief Ready"** + **Drive file URL** →
the new fragment.

**Phase 8 — Commit/push** the standalone HTML + any tooling to the session branch.

**Phase 9 — Plan/refresh loop (data-driven).** Pull GA4+GSC, score, and improve —
see §8.

### Toolchain (all committed under `pipeline/scripts/` + `docs/`)
| Tool | Does |
|---|---|
| `author-kit.md` | authoring spec handed to each sub-agent (chrome, head, rules, steps) |
| `validate-articles.mjs` | **QA gate** — golden-rule checks per article |
| `inline-css.mjs` | self-contained copies (CSS inlined) — for archive/preview |
| `magento-export.mjs` | standalone → **Magento fragment** (`--mode scoped` faithful; `--mode blog` re-skin) |
| `build-articles-manifest.mjs` | → `pipeline/data/content-index.json` (planning/join index) |
| `ga-gsc-pull.mjs` | direct GA4+GSC APIs → `pipeline/data/{ga4,gsc}.csv` |
| `plan-from-csv.mjs` | join GA/GSC onto content + score (win/scale · striking-distance · new-topics) |
| `docs/INTERNAL_LINK_PLAN.md` | cluster/orphan plan (22 orphans, pillars) |
| `docs/GA_GSC_PLANNING.md`, `docs/ENV_SETUP.md`, `pipeline/data/README.md` | planning runbook + env/CSV contracts |

---

## 1. Brands & chrome

| | Wine-Now | LIQ9 |
|---|---|---|
| Topic | Wine | Spirits / cocktails |
| Brand mark | `Wine·Now` (dot = `--wine`) | `LIQ9` (teal) |
| Accent var | `--wine` `#7b1230` | `--liq` `#143a4a` |
| Byline avatar | `.av` (wine) "WN" | `.av.liq` (teal) "L9" |
| Byline persona | ทีมซอมเมอลิเย่ Wine-Now | LIQ9 Bartender Desk |
| CTA button | `.cta` | `.cta.liq` |
| Kicker (LIQ9) | — | `style="color:#143a4a;background:#e7f0f4"` |
| Domain (canonical) | `https://th.wine-now.com/blog/<slug>.html` | `https://th.liq9.com/blog/<slug>.html` |

Shared chrome on every article: top bar, hero (kicker + h1 + dek + meta +
byline), `<article>` body, CTA, FAQ accordion, "related" links, site footer.

---

## 2. Content standards (non-negotiable)

1. **Thai-first / Thai-only.** Write the whole article in natural Thai. Do NOT
   ship parallel English sections. (English keywords inline like "tannin",
   "Bourbon", "acidity" are fine and good for SEO.)
2. **Full, ready-to-use posts — never briefs.** Match the depth of the approved
   **"Whisky 101 v2"** exemplar (`liq9-day1-whisky-101.html`): a real intro, a
   `สรุปสั้นๆ` summary callout, multiple `<h2>` sections with genuine teaching,
   at least one comparison `<table>` where it helps, a product section, a how-to
   / how-to-buy section, and a 4–6 item FAQ. Hit each Notion row's **Word
   Target**.
3. **No fabricated facts.** Never invent tax rates, auction prices, critic
   scores, vineyard names/hours, PPM, ABV specifics, or "#NN bestseller" ranks.
   Where a hard number would be needed, **write around it** and add a visible
   `หมายเหตุ`/editor's note telling the team to verify against the real source.
   Keep a **verify-list** of every such spot in the session summary.
4. **Compliance, every article:**
   - Price framing = **approximate + price-on-request**: show `~฿x,xxx` (real
     from the feed) AND a footnote "ราคาเป็นค่าประมาณ … สอบถามราคา/สั่งซื้อทาง LINE".
   - Footer always carries `ดื่มอย่างมีความรับผิดชอบ · 20+`.
   - Order/enquire via LINE; never imply unrestricted online alcohol checkout.
5. **E-E-A-T byline** on every article (branded team persona).

---

## 3. Product cards — the SKU rule

Every product card must carry the real SKU, machine- and human-readable:

```html
<div class="product-card" data-sku="WRW0282AD">
  <div class="nm">ชื่อสินค้า</div>
  <div class="mt">คำอธิบายสั้นๆ · ประเทศ/ภูมิภาค</div>
  <div class="badges"><span class="badge gold">ขายดี</span><span class="badge">หมวด</span></div>
  <div class="sku">SKU: <b>WRW0282AD</b></div>
  <div class="pr">~฿411</div>
  <a class="shop" href="https://th.wine-now.com/catalogsearch/result/?q=<name>">ดูขวดนี้ →</a>
</div>
```

- Use **only real, in-stock SKUs** from `pipeline/data/products.json`. No matching
  stock → **0 cards + route to LINE** (see Phase 2 empty-category list).
- Badges stay **soft** (`ขายดี`, category). **No** ranked claims like `ขายดี #15`.
- Cards deep-link via `catalogsearch?q=<name>`. **Open item:** switch to real PDP
  links by SKU once the PDP URL pattern is confirmed.

---

## 4. The HTML template (standalone = repo source of truth)

Source of truth lives in the repo at **`pipeline/public/content/`**. Each article
is a standalone `.html` that links the shared stylesheet:

```html
<link rel="stylesheet" href="assets/article.css">
```

`assets/article.css` is the single shared stylesheet. Required `<head>`:

- `<meta charset>`, `<meta viewport>`
- **Google Fonts Sarabun**:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap">
  ```
- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Open Graph + Twitter: `og:type/title/description`, `og:image`
  (placeholder `…/blog/og/<slug>.jpg`), `twitter:card=summary_large_image`,
  `twitter:image`, `og:locale=th_TH`
- **Three JSON-LD blocks**: `Article` (headline MUST match the H1 exactly),
  `BreadcrumbList`, `FAQPage` (mirrors the on-page FAQ).
- Images use `.figph` placeholders holding **16/9 aspect-ratio** (zero CLS).

> Filename vs live URL: new articles use canonical `…/blog/<fileSlug>.html`.
> Some legacy posts strip the `dayN-` prefix in their canonical (file
> `day1-most-expensive-wines-2026.html` → live `most-expensive-wines-2026`). The
> manifest/GA-join key off `<link rel="canonical">`, so keep canonical accurate.

---

## 5. Notion workflow

Board: **`2026 JUN — WNLQ9 — Content Production`** (db `786d080f…`, data source
`collection://6be4a7bb-d42c-4286-be1b-fa73e3635b45`).

- Read each row for: Title, Site, Day, Funnel/Intent, Schema, **Word Target**,
  Target Keyword, Evergreen, Author, Priority, STORY/TENSION/CTA/Content Brief.
- When HTML is done → **Status = "Brief Ready"** (explicitly NOT "Done").
- Set **`Drive file URL`** to the delivered fragment:
  `notion-update-page` → `update_properties`,
  `properties={"Status":"Brief Ready","Drive file URL":"<url>"}`. (Property is
  exactly "Drive file URL" — no `userDefined:` prefix. Only columns named exactly
  `id`/`url` need that prefix.)

---

## 6. Magento export (what actually goes live)

The live blog is **Magento**, which needs an **embeddable fragment** (body-only,
scoped CSS) — NOT a standalone page. Generate with:

```
node pipeline/scripts/magento-export.mjs --mode scoped        # all articles
node pipeline/scripts/magento-export.mjs --mode scoped --only <slug>.html
```

`--mode scoped` (default, faithful to our design): strips `<!DOCTYPE>/<html>/<head>`
+ the site topbar, scopes all of `article.css` under a `.wnlq9-article` wrapper
(no global CSS leakage), keeps the compliance footer + all three JSON-LD blocks.
Output → `pipeline/public/magento/scoped/<slug>.html` (gitignored — regenerable).
`--mode blog` re-skins onto the legacy `.blog-wrap`/Kanit system (keep for uniform
look with older posts; needs visual sign-off before bulk).

The exporter self-validates each fragment (0 full-doc markers, scoped CSS, JSON-LD
present, compliance footer present).

---

## 7. Google Drive delivery (current structure)

Parent: **"WNLQ9 Blog Html center"** (`1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm`). Inside:

| Folder | id | Holds |
|---|---|---|
| **WNLQ9 2026-JUN** | `1JBuRFDzO2UFZdQRO5LRzSzueNwgKZS4O` | **active** — the 52 Magento fragments (paste-into-Magento) |
| **Archive Html** | `1xci1D7mGqdclMuv-gxVGvRcgNVCvjaPV` | old standalone self-contained copies |

Upload (Drive MCP `create_file`): `parentId` = the month folder, `title` =
`<slug>.html`, `contentMimeType="text/html"`, `disableConversionToGoogleType=true`,
`textContent` = the fragment contents. Then write the returned id into the Notion
row's `Drive file URL` as `https://drive.google.com/file/d/<id>/view`.

> ⚠️ **Two hard-won rules:**
> 1. **Upload with ONE sequential agent**, not many in parallel — 5 concurrent
>    upload agents trip the model-API rate limiter and die mid-run. One agent
>    (or batches handed off sequentially) is reliable.
> 2. **Drive MCP cannot overwrite or delete.** Re-uploading a changed file makes a
>    same-name duplicate. To refresh: upload once into a **fresh month folder**,
>    archive the old, and never re-upload same-name. The owner deletes dupes
>    manually (MCP can't).

---

## 8. Plan / refresh loop (data-driven, GA4 + GSC)

Free GA4 + GSC, two ways in, both feed `plan-from-csv.mjs` (full runbook:
`docs/GA_GSC_PLANNING.md`):
- **Automated:** set env per `docs/ENV_SETUP.md`, then
  `node pipeline/scripts/ga-gsc-pull.mjs --plan` (service account → writes
  `pipeline/data/{ga4,gsc}.csv` → scores).
- **Manual:** drop `pipeline/data/ga4.csv` + `gsc.csv`, then
  `node pipeline/scripts/build-articles-manifest.mjs && node pipeline/scripts/plan-from-csv.mjs`.

Output `/tmp/ga-gsc/plan.json`: per-article buckets (win/scale · thin · …) +
opportunities (striking-distance · low-CTR · new-topics). Act on it: fix internal
links (`docs/INTERNAL_LINK_PLAN.md` — 22 orphans incl. the Day-12 Champagne
pillar), tune striking-distance pages, draft new-topic briefs, then re-deliver
**once** and write `GA Views`/`Target Keyword`/`Funnel`/`Day` back to Notion.

---

## 9. Ops & lessons (carry forward)

- **Sub-agent self-publish:** add the Drive `create_file` + Notion
  `notion-update-page` MCP tools to `.claude/settings.json` →
  `permissions.allow` so sub-agents don't hit permission denials. **Never commit
  `.claude/settings.json`** — it contains a real API key; the auto-mode classifier
  blocks committing it anyway. The on-disk edit is enough for the session.
- **Rate limits:** Drive uploads = one sequential agent (see §7). Author waves =
  ≤6 agents at once.
- **Gitignored** (regenerable / inputs, not committed): `pipeline/public/magento/`
  (fragments), `pipeline/data/ga4.csv`, `pipeline/data/gsc.csv`.
- **QA gate is the bar:** the whole library (52 articles) passes
  `validate-articles.mjs`; keep it that way for anything new or edited.

---

## 10. Performance & SEO baseline (keep it)

Static, zero-JS, inline CSS → excellent CWV. Protect it: reserve image dimensions
(aspect-ratio), no render-blocking scripts, one shared stylesheet, heading order
h1→h2(→h3), unique body per article.

---

## 11. Per-article pre-ship checklist

- [ ] Thai-only, full long-form, hits Word Target
- [ ] `สรุปสั้นๆ` summary callout near top
- [ ] No fabricated numbers; verify-notes added; verify-list updated
- [ ] Product cards: real in-stock SKUs, `data-sku` + visible `.sku` chip, soft badges (or 0 cards → LINE)
- [ ] Price `~฿` + "สอบถามราคา/สั่งซื้อทาง LINE" footnote
- [ ] Byline + footer (`ดื่มอย่างมีความรับผิดชอบ · 20+`)
- [ ] `<head>`: Sarabun, canonical, OG+Twitter (incl. og:image placeholder)
- [ ] JSON-LD Article/Breadcrumb/FAQ — **headline matches H1**, FAQ mirrors page
- [ ] `.figph`/`img` hold 16/9 aspect-ratio (CLS guard)
- [ ] Related-links anchor text matches the real target titles
- [ ] **`validate-articles.mjs` PASSES**
- [ ] **`magento-export.mjs --mode scoped` fragment generated**
- [ ] Fragment uploaded to **WNLQ9 2026-JUN**; Notion `Drive file URL` set; Status = "Brief Ready"
- [ ] Standalone HTML committed + pushed to the session branch

---

## 12. Infra notes

- Vercel project **`seodashboard`** (Root `pipeline/`, prod branch `main`).
  `seo-dashboard`, `wnlq-9-content-seo` are dead duplicates — ignore.
- `main` has unrelated git history to `claude/*` content branches; ship to prod by
  branching from `main`, copying deliverables in additively, PR + merge.
- Supabase `dsyplzckfezcxiuikkfm` ("WNLQ9 PI DB"): `content_plan`, `pick_products()`,
  `v_content_products`, `plan_with_picks()`. Production writes need explicit auth.
- Dashboard ingests GA/GSC as **CSV** (`dashboard/lib/csv.ts`, sample CSVs in
  `dashboard/data/`) — the same files `plan-from-csv.mjs` reads.

---

## 13. Open items (carry forward)
- Finish/confirm all 52 Magento fragments delivered to **WNLQ9 2026-JUN** (done as
  of last session) and decide whether to **repoint Notion `Drive file URL`** from
  the archived standalones to the new fragments.
- SKU → real PDP deep-links (needs confirmed PDP URL pattern).
- Real OG/hero images to replace `.figph` placeholders + og:image URLs.
- Execute `docs/INTERNAL_LINK_PLAN.md` during the next GA/GSC refresh (one clean re-delivery).
- Publish fragments to the live Magento blog → flip Notion to **Published** + set `Final URL`.
