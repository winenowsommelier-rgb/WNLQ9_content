# WNLQ9 Article Author Kit (for sub-agents)

You are writing ONE finished, ready-to-use **Thai-only** blog article for a Thai
beverage e-commerce brand (Wine-Now = wine, LIQ9 = spirits). Match the depth of
the approved exemplars and pass the QA gate. Do **not** ship a brief or an outline.

## Read these first
- Exemplar (LIQ9): `pipeline/public/content/liq9-day1-whisky-101.html`
- Exemplar (Wine-Now): `pipeline/public/content/day3-white-wines-summer.html`
- Product feed (the ONLY source of SKUs): `pipeline/data/products.json`
Copy the exemplar's `<head>`, chrome, and section rhythm exactly; change only the content.

## Non-negotiable rules
1. **Thai-only** body (English keywords inline like "tannin", "Bourbon", "Brut"
   are fine). No parallel English section.
2. **Full long-form** to the row's Word Target: real intro → `<p class="note">`
   with `สรุปสั้นๆ` → several `<h2>` teaching sections → at least one comparison
   `<table>` where it helps → product section → a how-to / how-to-choose section →
   FAQ accordion of **4–6** items.
3. **No fabricated facts.** Never invent prices, tax rates, critic scores,
   ABV/PPM specifics, vineyard/bar names, awards, or bestseller ranks. Where a
   hard number/name would be needed, write around it and add a visible Thai
   `หมายเหตุ` note; list every such spot in your verify report. Real prices come
   ONLY from `products.json`.
4. **Product cards — real in-stock SKUs only.** Use the exact SKUs handed to you.
   Each card: `data-sku="..."` + visible `<div class="sku">SKU: <b>...</b></div>`
   + `~฿<price>` (price from the feed) + soft badges (NO `#NN` ranks). If you were
   told a category has **no matching stock**, ship **0 cards** and route to LINE
   honestly — never invent a product. Always include the price footnote:
   `*ราคาเป็นค่าประมาณ … สอบถามราคา/สั่งซื้อทาง LINE`.
5. **Compliance:** order/enquire via LINE; footer must contain
   `ดื่มอย่างมีความรับผิดชอบ · 20+`; branded E-E-A-T byline.

## Brand chrome
| | Wine-Now | LIQ9 |
|---|---|---|
| topbar brand | `<span class="brand">Wine<span class="dot">·</span>Now</span>` | `<span class="brand" style="color:#143a4a">LIQ<span class="dot" style="color:#143a4a">9</span></span>` |
| kicker | `<span class="kicker">…</span>` | `<span class="kicker" style="color:#143a4a;background:#e7f0f4">…</span>` |
| byline avatar | `<span class="av">WN</span>` … `ทีมซอมเมอลิเย่ Wine-Now` | `<span class="av liq">L9</span>` … `ทีมบาร์เทนเดอร์ LIQ9` |
| CTA block | `<div class="cta">` | `<div class="cta liq">` |
| canonical/og | `https://th.wine-now.com/blog/<slug>.html` | `https://th.liq9.com/blog/<slug>.html` |
| catalog link | `https://th.wine-now.com/catalogsearch/result/?q=<name>` | `https://th.liq9.com/catalogsearch/result/?q=<name>` |
| author org (JSON-LD) | `ทีมซอมเมอลิเย่ Wine-Now (Wine-Now Cellar Team)` | `LIQ9 Bartender Desk` |
| footer | `© 2026 Wine-Now` + th.wine-now.com | `© 2026 LIQ9` + th.liq9.com |

## Required `<head>` (mirror the exemplar)
- charset, viewport, **Sarabun** webfont (3 lines), `<title>`, `<meta name="description">`
- `<link rel="canonical">`, OG (`og:type/title/image/description/locale=th_TH`),
  Twitter (`twitter:card=summary_large_image`, `twitter:image`)
- og:image placeholder: `…/blog/og/<slug>.jpg`
- `<link rel="stylesheet" href="assets/article.css">` (shared CSS — do NOT inline here)
- **Three JSON-LD blocks**: `Article` (its `headline` MUST be character-for-character
  the on-page `<h1>` text), `BreadcrumbList`, `FAQPage` (questions/answers mirror the
  on-page FAQ — same count, same wording).
- `datePublished` = `dateModified` = the row's publish date `2026-06-DD`.
- First figure uses `<div class="figph">…</div>` (holds 16/9 for CLS).

## Deliver steps (run these yourself, in order)
1. Write `pipeline/public/content/<slug>.html`.
2. QA gate (must PASS — fix and re-run until it does):
   `node pipeline/scripts/validate-articles.mjs pipeline/public/content/<slug>.html`
3. Build the self-contained Drive copy:
   `node pipeline/scripts/inline-css.mjs pipeline/public/content/<slug>.html`
   (writes `/tmp/drive2/<slug>.html`; must print `OK`).
4. Upload to Google Drive via the Drive MCP `create_file`:
   `parentId="1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm"`, `title="<slug>.html"`,
   `contentMimeType="text/html"`, `disableConversionToGoogleType=true`,
   `textContent=` the full contents of `/tmp/drive2/<slug>.html`. Upload exactly ONCE.
5. Update the Notion row via Notion MCP `notion-update-page` `update_properties`:
   `page_id=<pageId>`, properties `{"Status":"Brief Ready","Drive file URL":"https://drive.google.com/file/d/<returned id>/view"}`.
   (Property is "Drive file URL" — no `userDefined:` prefix.) Do not touch other props.
6. Do NOT commit, push, or edit `data/articles.json` — the orchestrator does that.

## Report back (final message, exactly this shape)
```
SLUG: <slug>
PAGEID: <pageId>
DRIVEID: <returned drive file id>
QA: PASS
CARDS: <n>
VERIFY:
- <each fabricated/missing-stock/needs-real-number spot, or "none">
```
