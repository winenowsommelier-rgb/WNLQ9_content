# WNLQ9 Content-Production Playbook

The repeatable process for producing blog content for the two Thai beverage
e-commerce brands **Wine-Now** (wine) and **LIQ9** (spirits). Follow this on
**every** content session so output stays consistent. This is the source of
truth for *how we make content*; the Notion board is the source of truth for
*what to make and its status*.

> TL;DR for a new session: read the Notion content-plan rows → write
> **full, ready-to-use Thai articles** (not briefs) at "Whisky 101 v2" depth →
> real in-stock SKUs on every product card with a visible SKU chip → no
> fabricated numbers (verify-list instead) → inline the CSS → upload the
> self-contained HTML to the Google Drive folder → set Notion **Status = "Brief
> Ready"** and paste the link into **Drive file URL**.

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
   `หมายเหตุ`/editor's note telling the team to verify against the real source
   (กรมสรรพสามิต, Wine-Searcher, auction houses, Whisky Advocate, etc.). Keep a
   **verify-list** of every such spot in the session summary.
4. **Compliance, every article:**
   - Price framing = **approximate + price-on-request**: show `~฿x,xxx` (real
     from the feed) AND a footnote "ราคาเป็นค่าประมาณ … สอบถามราคา/สั่งซื้อทาง
     LINE".
   - Footer always carries `ดื่มอย่างมีความรับผิดชอบ · 20+`.
   - Order/enquire via LINE; never imply unrestricted online alcohol checkout.
5. **E-E-A-T byline** on every article (branded team persona, "คัดสรรและตรวจทาน
   โดยทีมผู้เชี่ยวชาญ…").

---

## 3. Product cards — the SKU rule

The team builds product widgets from our output, so **every product card must
carry the real SKU**, both machine- and human-readable:

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

- Use **only real, in-stock SKUs** from the BI product feed (`products.json`).
  If the feed has no matching stock (e.g. Thai wine), ship **0 cards** and route
  to LINE honestly — do not invent a product.
- Badges: keep them soft (`ขายดี`, category). **Do not** put ranked claims like
  `ขายดี #15` — they drift and become wrong.
- Cards currently deep-link via `catalogsearch?q=<name>`. **Open item:** switch
  to real PDP links by SKU once the PDP URL pattern is confirmed.

### SKU registry used so far (real, in-stock — reuse, don't invent)
- **Wine-Now:** WRW4683AD, WRW6217FS, WRW4559CB, WSP9005BN, WRW5408BN,
  WWW1106AD, WWW5371AB, WWW6233FJ, WSP1140AE, WWW2244BN, WWW0106AH, WRW0282AD,
  WRW3122CH, WRW3305DD, WRW4693AD, WRW5853CB, WRW0211AH, WRW5836AA
- **LIQ9:** LWH0001AA, LWH0305BU, LWH0161BU, LWH0318CN, LWH0364CN, LWH0668CN,
  LTQ0034CN, LGN0106AA, LRM0116DR, LLQ0426CN

---

## 4. The HTML template

Source of truth lives in the repo at **`pipeline/public/content/`**. Each
article is a standalone `.html` that links the shared stylesheet:

```html
<link rel="stylesheet" href="assets/article.css">
```

`assets/article.css` is the single shared stylesheet — edit it once, every
article inherits. Required `<head>` for every new article:

- `<meta charset>`, `<meta viewport>`
- **Google Fonts Sarabun** (brand type):
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap">
  ```
- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Open Graph + Twitter: `og:type`, `og:title`, `og:description`,
  `og:image` (placeholder `…/blog/og/<slug>.jpg`), `twitter:card=summary_large_image`,
  `twitter:image`, `og:locale=th_TH`
- **Three JSON-LD blocks**: `Article` (headline MUST match the H1/title — no
  overpromising), `BreadcrumbList`, `FAQPage` (questions/answers mirror the
  on-page FAQ).
- Images use `.figph` placeholders that hold a **16/9 aspect-ratio** so real
  images drop in later with zero CLS. Real `<img>` must keep
  `aspect-ratio:16/9;object-fit:cover`.

---

## 5. Notion workflow

The board: **`2026 JUN — WNLQ9 — Content Production`**.

- Read each row for: title, brand, day, funnel/intent, schema type, **Word
  Target**, keywords, evergreen flag, author, priority.
- When a draft is written and turned into HTML → set **Status = "Brief Ready"**
  (explicitly NOT "Done").
- Paste the Drive link into the **`Drive file URL`** property (this property was
  renamed from "URL"; because the name is no longer exactly "url" it does **not**
  need the `userDefined:` prefix — pass it as `{"Drive file URL": "<url>"}` to
  `notion-update-page` → `update_properties`).
- Property names that are *exactly* `id` or `url` (case-insensitive) DO need the
  `userDefined:` prefix — relevant if a column is ever renamed back.

---

## 6. Google Drive delivery

Target folder: **"WNLQ9 Blog Html center"**, id
`1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm` (owner winenowsommelier@gmail.com).

Upload **self-contained** HTML (CSS inlined into a `<style>` block) so the file
renders standalone in Drive preview:

1. Generate inlined copies (replace the `<link rel="stylesheet" …article.css">`
   line with `<style>…contents of article.css…</style>`). The helper pattern:
   a small Node script reads each repo `.html`, swaps the link for inline CSS,
   writes to `/tmp/drive2/<file>.html`. Validate: 0 external css links, exactly
   one `<style>`, SKU chips present.
2. `create_file` (Drive MCP) per file:
   `parentId` = folder id, `title` = `<slug>.html`,
   `contentMimeType="text/html"`, `disableConversionToGoogleType=true`,
   `textContent` = the full inlined HTML.
3. Capture each returned file id and write it into the matching Notion row's
   `Drive file URL` as `https://drive.google.com/file/d/<id>/view`.

> ⚠️ **Drive MCP cannot overwrite or delete.** Re-uploading a changed file
> creates a **same-name duplicate**. To refresh cleanly: ask the owner to clear
> the folder, then do one upload pass and re-point Notion. If you must
> "add alongside", re-point Notion to the new ids and tell the owner the older
> same-name copies are superseded (identify keepers by file id / newest
> modified — names collide).

---

## 7. Performance & SEO baseline (already true; keep it)

Static, self-contained, **zero JS**, inline CSS (~5KB) → excellent Core Web
Vitals ceiling. Protect it: keep image dimensions reserved (aspect-ratio),
don't add render-blocking scripts, keep one shared stylesheet. Heading order
h1→h2(→h3). Unique body per article; shared chrome/CSS is fine (not dup
content).

---

## 8. Per-article pre-ship checklist

- [ ] Thai-only, full long-form, hits Word Target
- [ ] `สรุปสั้นๆ` summary callout near top
- [ ] No fabricated numbers; verify-notes added; verify-list updated
- [ ] Product cards: real in-stock SKUs, `data-sku` + visible `.sku` chip, soft badges
- [ ] Price `~฿` + "สอบถามราคา/สั่งซื้อทาง LINE" footnote
- [ ] Byline + footer (`ดื่มอย่างมีความรับผิดชอบ · 20+`)
- [ ] `<head>`: Sarabun webfont, canonical, OG+Twitter (incl. og:image placeholder)
- [ ] JSON-LD Article/Breadcrumb/FAQ — **headline matches H1**, FAQ mirrors page
- [ ] `.figph`/`img` hold 16/9 aspect-ratio (CLS guard)
- [ ] Related-links anchor text matches the real target titles
- [ ] Commit to the working branch, push
- [ ] Inlined copy uploaded to Drive; Notion `Drive file URL` set; Status = "Brief Ready"

---

## 9. Pipeline / infra notes

- Repo deploy: Vercel project **`seodashboard`**, Root Directory `pipeline/`,
  output `public`. (Two other Vercel projects — `seo-dashboard`,
  `wnlq-9-content-seo` — are dead duplicates whose builds Error; ignore or clean
  up. Only `seodashboard` reacts to pushes.)
- **Monthly auto-render → Drive (July 2026+):** `src/july-cli.mjs` renders each
  `Status=Review` row into a full Magento-safe Thai article and runs it through
  the same Drive-handoff path. Per-month DB/column differences are handled by a
  **schema profile** (`config.schemaProfileFor` — e.g. July has no `Week Theme`
  and adds `Author/Priority/Intent/Funnel/Evergreen`). Real SKUs come from the
  BI feed (`products.pickProducts`); body depth from `llm.expandArticle` (needs
  `ANTHROPIC_API_KEY`, else an offline seed render). **Thai-only by default;**
  set `PUBLISH_LANGS=th,en` to also publish English. Always `--dry-run` first
  (writes to `out/july-dry`, no Notion/Drive writes). See `pipeline/README.md`.
- Node-native pipeline (no deps, `type:module`, Node ≥22): `src/notion.mjs`,
  `src/mapping.mjs`, `src/pipeline.mjs` (`approveToDrive` sets status "Brief
  Ready" + writes `Drive file URL`), plus the Notion→Supabase sync
  (`src/plan-sync.mjs`, `api/sync-plan.mjs`, `api/plan.mjs`).
- Supabase project `dsyplzckfezcxiuikkfm` ("WNLQ9 PI DB"): `content_plan` table,
  `pick_products()`, `v_content_products`, `plan_with_picks()` RPC. Direct
  production writes (migrations, INSERT) require explicit user authorization
  before running.

---

## 10. Week-1 (June 2026) page-id ↔ file map (reference)

12 articles (Days 1–7; Days 2 & 6 have no LIQ9 row).

| Notion page id | File |
|---|---|
| 3729d75a-e4b5-8157-80c7-c200e03292d7 | day1-most-expensive-wines-2026.html |
| 36e9d75a-e4b5-816e-87be-ce9c206e770c | day2-wine-acidity.html |
| 36f9d75a-e4b5-8168-a44d-cbac08ff6b51 | day3-white-wines-summer.html |
| 3739d75a-e4b5-81ef-aa99-fe45f589b5e9 | day4-wine-excise-tax-2026.html |
| 3739d75a-e4b5-81bd-b527-c35237d34766 | day5-pinot-noir-101.html |
| 36e9d75a-e4b5-81f7-998e-c03ff25db360 | day6-wine-tourism-khao-yai.html |
| 3729d75a-e4b5-8131-ab7b-f070b1401cbb | day7-cabernet-sauvignon-101.html |
| 3729d75a-e4b5-8185-a837-c8e50133117b | liq9-day1-whisky-101.html (exemplar) |
| 3729d75a-e4b5-818a-8748-f595089711e1 | liq9-day3-macallan-guide.html |
| 36e9d75a-e4b5-8162-9c6d-c6139d4b7a2f | liq9-day4-spicy-thai-cocktails.html |
| 3729d75a-e4b5-811b-925b-d320fa814821 | liq9-day5-buy-gin-online.html |
| 3729d75a-e4b5-8185-9f46-e0194c1ea413 | liq9-day7-bourbon-recommend.html |

---

## 11. Open items (carry forward)
- SKU → real PDP deep-links (needs confirmed PDP URL pattern).
- Bring the other 5 repo articles (tannin, storage, label, natural/organic,
  proof-vs-abv) up to the same head/CSS standard if they get shipped.
- Real OG/hero images to replace `.figph` placeholders + og:image URLs.
- Optional: activate Notion→Supabase sync via env vars + production deploy.
