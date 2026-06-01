# WNLQ9 Blog Writing Playbook

**Everything we know about writing blogs for Wine-Now and LIQ9.**

This is the single source of truth for blog content production across our two
Magento storefronts. It consolidates our brand systems, HTML component library,
SEO/AEO strategy, content-planning libraries, and production workflow.

| Brand | Site | Focus |
|-------|------|-------|
| **Wine-Now** | [th.wine-now.com](https://th.wine-now.com/) | Wine (red, white, rosé, sparkling, natural, organic) |
| **LIQ9** (LIQNINE) | [th.liq9.com](https://th.liq9.com/) | Spirits & liquor (whisky, gin, rum, vodka, liqueur, Thai spirits, barware) |

> **Audience:** Thai consumers — enthusiasts, casual drinkers, and gift buyers.
> **Default language:** Thai (TH), with English terms for wine/spirits vocabulary.

---

## 1. The Two Brands

Everything visual and verbal is brand-keyed. Always confirm the brand before writing.

### Brand voice

| | Wine-Now | LIQ9 |
|---|----------|------|
| **Persona** | A certified sommelier talking to a friend | A bartender who knows their craft |
| **Tone** | Warm, knowledgeable, approachable | Bold, knowledgeable, modern |
| **Byline name** | Wine-Now Sommelier Team | LIQ9 Bartender Team |
| **Byline role** | Certified Sommelier | Spirits Specialist |
| **Avatar emoji** | 🍷 | 🥃 |
| **LINE** | `@wine-now` | `@liq9` |

### Brand colors (CSS variables)

| Variable | Wine-Now | LIQ9 |
|----------|----------|------|
| `--brand-primary` | `#8B0000` (dark red) | `#1B1464` (dark navy) |
| `--brand-hover` | `#6d0000` | `#110d42` |
| `--brand-shadow` | `rgba(139,0,0,0.3)` | `rgba(27,20,100,0.3)` |
| `--alt-bg` | `#f9f6f2` (warm cream) | `#f4f5fa` (cool gray-blue) |
| `--callout-from` → `--callout-to` | `#fdf6f0` → `#fff5f5` | `#f0f1fa` → `#f5f5ff` |
| `--table-header` | `#8B0000` | `#1B1464` |
| `--table-even` | `#faf8f5` | `#f7f8fc` |
| `--table-hover` | `#f5efe8` | `#eef0fa` |
| `--toc-bg` | `#faf8f5` | `#f7f8fc` |
| `--toc-border` | `#ede8e2` | `#e2e4f0` |

### Key URLs

| | Wine-Now | LIQ9 |
|---|----------|------|
| Homepage | `https://th.wine-now.com/` | `https://th.liq9.com/` |
| Catalog | `/wine.html` | `/whisky.html`, `/liquor.html` |
| Blog index | `/blog/` | `/blog/` |
| Image base path | `https://th.wine-now.com/media/wysiwyg/blog/` | `https://th.liq9.com/media/wysiwyg/blog/` |

---

## 2. Technical Output Rules (non-negotiable)

Output is pasted **directly into Magento's CMS blog builder**. It must:

1. **Be self-contained** — all CSS in one `<style>` block at the top, all JS (only
   if a FAQ accordion is used) in one `<script>` block. No external CSS/JS files.
2. **Omit page wrappers** — no `<html>`, `<head>`, `<body>`. Start with `<style>`,
   end with the last closing `</div>`.
3. **Skip the Google Fonts link** — the theme already loads **Kanit**.
4. **Use placeholder image paths** like
   `https://th.wine-now.com/media/wysiwyg/blog/YOUR-IMAGE-NAME.jpg`, with a comment
   telling the user to swap in the real uploaded path.
5. **Prefix every CSS class with `blog-`** to avoid collisions with Magento styles.
6. **Be responsive** — every component works at the 768px mobile breakpoint.
7. **Default to Thai** unless the user specifies otherwise.

### Magento product widget syntax (Product Blogs)

```
{{widget type="Magento\CatalogWidget\Block\Product\ProductsList" show_pager="0" products_count="10" template="product/widget/content/grid.phtml" sort_by="recommended" conditions_encoded="^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``^],`1--1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Product`,`attribute`:`sku`,`operator`:`()`,`value`:`SKU1, SKU2, SKU3, SKU4, SKU5`^]^]"}}
```

- **Wine-Now SKU format:** `WWW` + numbers + letters (e.g. `WWW1197AD`, `WWW5339FP`)
- **LIQ9 SKU format:** `L` + category code + numbers (e.g. `LGN0061CM`, `LRM023SES`)
- Ask the user for real SKUs, or leave clearly-commented placeholders.

---

## 3. Blog Types & Structure

We write two kinds of posts. Decide which one before drafting.

### Content Blog — educational / knowledge

Example: *"What are Sulfites?"*, *"Red vs White Wine"*

1. Hero image (separated: image first, then title below)
2. Author byline (avatar + name + role + date)
3. Intro paragraph (centered, ~20px, lighter color)
4. Table of Contents (use when 4+ sections)
5. Content sections — alternate white / alt-color backgrounds
6. Supporting components: highlight cards, comparison table, callout/tip boxes,
   quote blocks, FAQ accordion, captioned images
7. LINE CTA block
8. Closing CTA button
9. Related articles (3 cards)

### Product Blog — recommendations with product grids

Example: *"Songkran Summer Sips"*

1. Hero image (separated)
2. Author byline
3. Intro paragraph
4. Country/region sections (flag-emoji headers)
5. Captioned image per region
6. Product description paragraph
7. **Magento product widget** (product grid shortcode)
8. Alternating section backgrounds
9. Sommelier/bartender tip callout
10. LINE CTA block
11. Closing CTA button

---

## 4. Component Library

We maintain **19 reusable, brand-themed HTML/CSS components**. Full markup lives in
[`components.md`](wnlq9-blog-writer-skill/references/components.md) — assemble the
`<style>` block from only the components a given post uses.

| # | Component | Use case |
|---|-----------|----------|
| 1 | Base styles | Always include (Kanit font, container, divider) |
| 2 | Hero (separated) | Every blog — full-width image + title/meta below |
| 3 | Author byline | Every blog |
| 4 | Intro paragraph | Every blog — centered, 20px |
| 5 | Table of Contents | Long content blogs (4+ sections) |
| 6 | Section / Section-alt | Alternating background sections |
| 7 | Headings (h2/h3) | Section headers with brand-color underline |
| 8 | Image with caption | Photo + italic caption |
| 9 | Highlight cards | 3-column grid for key points |
| 10 | Comparison table | Side-by-side data (wine types, regions) |
| 11 | Callout / Tip box | Sommelier/bartender tips, notes |
| 12 | Quote block | Featured quote with decorative mark |
| 13 | FAQ accordion | Expandable Q&A — great for SEO (requires `<script>`) |
| 14 | LINE CTA block | Green LINE button + description |
| 15 | CTA button | Brand-colored action button |
| 16 | Related articles | 3-card grid to other posts |
| 17 | Region header | Country flag + name (product blogs) |
| 18 | Product widget | Magento shortcode placeholder |
| 19 | Footer note | Closing note |

> **Color tokens:** Components use placeholders like `{{BRAND_PRIMARY}}`,
> `{{ALT_BG}}`, `{{TABLE_HEADER}}`, etc. Replace them with the real hex values from
> Section 1 **before** output. Never ship a `{{...}}` placeholder to the user.

---

## 5. Writing & Voice Guidelines

- Write like a sommelier (Wine-Now) or bartender (LIQ9) talking to a friend.
- **Wine-Now** topics: grape varieties, regions, winemaking, food pairing, gifts.
- **LIQ9** topics: spirits knowledge, cocktail culture, mixing tips, brand stories.
- Keep paragraphs digestible — **2–4 sentences** max.
- Use bullet points for any list of 3+ items.
- Include a sommelier/bartender tip where it adds value.
- Use English wine/spirits vocabulary inside Thai prose (it's expected and aids SEO).

---

## 6. SEO & AEO Strategy

We optimize for both classic search **and** AI answer engines (AEO / "AI citation").

### On-page SEO

- Place the **primary keyword** naturally in the H1, the first paragraph, and at
  least two H2/H3 headings.
- Target **long-tail keyword clusters** (see the topic libraries) — not single words.
- Use **bilingual keywords**: each topic carries an English primary keyword *and* a
  Thai-language keyword (e.g. `wine tannins` / `เทนนิน`).
- The **FAQ accordion** doubles as an SEO asset — phrase questions as real search
  queries.

### Meta & structured data

Every published page should ship with a meta block. Pattern (see
[`featured-selection-meta.txt`](featured-selection-meta.txt) for a worked example):

- **Meta title** — keyword-rich, brand-suffixed (`… | Wine-Now Thailand`)
- **Meta description** — benefit + proof + delivery promise, ~155 chars
- **Meta keywords** — primary + long-tail cluster
- **URL key**, **canonical**, **OG title/description**
- **JSON-LD schema** — `CollectionPage` / `ItemList` for product pages,
  `Article` + `FAQPage` for content blogs

### AEO / AI citation

We deliberately write content that AI answer engines will cite:

- Lead with clear, factual, quotable definitions and comparisons.
- Cite credible sources in production (e.g. Scotch Whisky Association, distillery
  data, auction results) for authority topics.
- Every topic in our libraries is scored for **AI Citation Opportunity / Value**.

### Viral SEO boosters

We keep a library of **33 high-impact "viral" topics**
([`viral-seo-boosters.csv`](viral-seo-boosters.csv)) chosen for traffic + citation
upside. Each row carries a **Viral Hook**, **SEO Power Angle**, **Thai Angle**,
competition/link-potential ratings, and production notes. Recurring winning angles:

- **Consumer protection / trust** — e.g. "How to spot counterfeit wine / fake whisky"
- **Trend analysis** — e.g. "Green wine and Millennials", "Premium tequila"
- **Market / scarcity** — e.g. "Japanese whisky shortage: why prices soar"

---

## 7. Content Planning System

Two topic libraries drive the editorial calendar:

| Library | Rows | File |
|---------|------|------|
| Wine-Now topics | 83 | [`wine-now-topic-library.csv`](wine-now-topic-library.csv) |
| LIQ9 topics | 85 | [`liq9-topic-library.csv`](liq9-topic-library.csv) |
| Viral SEO boosters | 33 | [`viral-seo-boosters.csv`](viral-seo-boosters.csv) |

Each topic row is tagged with:

`Topic Title (Thai | EN)` · `Content Type` · `Primary Keyword` ·
`Long-tail Keywords` · `Search Intent` · `Buyer Persona` · `Category` ·
`Seasonality` · `Est. Search Volume` · `Thai Language Keyword` ·
`AI Citation Opportunity` · `Notes`

### Content types

- **Pillar** — foundational, comprehensive guides (e.g. *"Wine 101"*, *"Whisky 101"*).
  These anchor topic clusters and get internal links from related blogs.
- **Blog** — focused educational or comparison pieces feeding a pillar.
- **Commercial** — buying-intent pages that lead toward catalog/product grids.

### Search intent & personas

- **Search intent:** mostly *Informational*, with *Commercial* buying-intent topics.
- **Personas:** Explorer / Casual Drinker / Enthusiast / Collector (and gift buyers) —
  match tone and depth to the persona on each topic.
- **Seasonality:** most topics are *Evergreen*; seasonal pushes target Songkran,
  New Year, and summer.

---

## 8. Image & Asset Conventions

- **Blog images** go to each brand's `media/wysiwyg/blog/` path; reference by a
  descriptive filename and remind the user to upload the real asset.
- **Canva library** ([`canva-image-assets.md`](canva-image-assets.md)) uses strict
  naming so assets are findable: prefix `WN-` for Wine-Now, `LQ-` for LIQ9, then
  `CH{n}` chapter + index + descriptive slug
  (e.g. `WN-CH1-01-Bordeaux-1855-Classification`).
- Bulk Canva uploads are tracked in `canva-bulk-winenow.csv` / `canva-bulk-liq9.csv`.

---

## 9. Production Workflow & Checklist

1. **Pick the brand** (Wine-Now or LIQ9) and read its color/voice config.
2. **Pick the topic** from the relevant topic library (or a viral booster).
3. **Pick the blog type** (Content vs Product).
4. **Draft** in Thai, sommelier/bartender voice, with the primary keyword placed for SEO.
5. **Assemble HTML** from the component library; replace all `{{TOKENS}}` with brand hex.
6. **Add SEO assets** — meta block + JSON-LD (`Article`/`FAQPage`, or
   `CollectionPage`/`ItemList` for product pages).
7. **Insert image placeholders** and (for Product Blogs) the Magento widget shortcode.
8. **QA:** self-contained? no page wrappers? `blog-` prefixes? mobile-safe? no leftover
   `{{...}}`? keyword in H1 + intro + 2 headings?
9. **Hand off** the HTML to paste into Magento, plus the meta block.

### Pre-publish checklist

- [ ] Brand colors applied everywhere (no placeholders)
- [ ] Self-contained: single `<style>`, single `<script>` (only if FAQ used)
- [ ] No `<html>/<head>/<body>` wrappers
- [ ] All classes prefixed `blog-`
- [ ] Responsive at 768px
- [ ] Primary keyword in H1, first paragraph, 2+ headings
- [ ] Meta title/description/keywords + JSON-LD prepared
- [ ] Image paths + alt text set; user reminded to upload real images
- [ ] (Product) Magento widget with real or clearly-placeholdered SKUs
- [ ] LINE CTA + closing CTA + related articles present

---

## 10. Source File Index

| File | What it holds |
|------|---------------|
| `wnlq9-blog-writer-skill/SKILL.md` | The blog-writer skill router |
| `wnlq9-blog-writer-skill/references/brand-winenow.md` | Wine-Now brand reference |
| `wnlq9-blog-writer-skill/references/brand-liq9.md` | LIQ9 brand reference |
| `wnlq9-blog-writer-skill/references/components.md` | Full HTML/CSS for all 19 components |
| `wine-now-topic-library.csv` | 83 Wine-Now topics |
| `liq9-topic-library.csv` | 85 LIQ9 topics |
| `viral-seo-boosters.csv` | 33 viral SEO topics |
| `featured-selection-meta.txt` | Worked SEO meta + JSON-LD example |
| `canva-image-assets.md` | Canva asset naming + IDs |
| `blog-template-winenow.html` | Reference HTML blog template |
| `18-noble-grapes-*.html`, `featured-selection-*.html`, `gen-z-wine-trends-*.html` | Production blog examples |

---

*Maintained by the WNLQ9 Content team + Claude. Default language: Thai.*
