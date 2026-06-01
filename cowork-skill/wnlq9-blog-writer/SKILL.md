---
name: wnlq9-blog-writer
description: Write production-ready, self-contained blog HTML for Wine-Now (th.wine-now.com, wine) or LIQ9 (th.liq9.com, spirits) that pastes directly into Magento's blog builder — plus the SEO/AEO meta, topic planning, and brand styling that go with it. Use whenever the user asks to write a blog post, create blog content, generate blog HTML, plan blog topics, or mentions Wine-Now / LIQ9 / WNLQ9 blog. Also trigger when given a topic about wine, whisky, spirits, cocktails, or beverages to format as HTML for either brand.
---

# WNLQ9 Blog Writer

Generate production-ready, self-contained blog HTML for **Wine-Now** (wine) and
**LIQ9** (liquor/spirits), with matching SEO/AEO meta. Output must work when pasted
directly into **Magento's CMS blog builder** — no external dependencies except the
theme's Kanit font.

## Workflow

1. **Brand** — Wine-Now or LIQ9? Ask if unspecified. Read `references/brand-winenow.md`
   or `references/brand-liq9.md`.
2. **Topic** — take it from the user, or pick from `references/wine-now-topic-library.csv`
   (83 topics), `references/liq9-topic-library.csv` (85 topics), or
   `references/viral-seo-boosters.csv` (33 high-traffic angles).
3. **Blog type:**
   - **Content Blog** — educational/knowledge article (e.g. "What are Sulfites?")
   - **Product Blog** — recommendations with Magento product-grid widgets
4. **Components** — read `references/components.md` and assemble from the 19 components.
5. **Write** in Thai (default), sommelier (Wine-Now) / bartender (LIQ9) voice.
6. **SEO/AEO** — add the meta block + JSON-LD (see `references/seo-and-planning.md`
   and `references/seo-meta-example.txt`).
7. **QA** against the checklist below.

The full reference is `references/playbook.md` — read it for any detail not on this page.

## Brand quick config

| Property | Wine-Now | LIQ9 |
|----------|----------|------|
| Primary / hover | `#8B0000` / `#6d0000` | `#1B1464` / `#110d42` |
| Shadow | `rgba(139,0,0,0.3)` | `rgba(27,20,100,0.3)` |
| Alt section bg | `#f9f6f2` | `#f4f5fa` |
| Callout gradient | `#fdf6f0` → `#fff5f5` | `#f0f1fa` → `#f5f5ff` |
| Table header / even / hover | `#8B0000` / `#faf8f5` / `#f5efe8` | `#1B1464` / `#f7f8fc` / `#eef0fa` |
| TOC bg / border | `#faf8f5` / `#ede8e2` | `#f7f8fc` / `#e2e4f0` |
| Site | `https://th.wine-now.com/` | `https://th.liq9.com/` |
| Image base | `…/media/wysiwyg/blog/` | `…/media/wysiwyg/blog/` |
| LINE | `@wine-now` | `@liq9` |
| Byline | Wine-Now Sommelier Team · Certified Sommelier · 🍷 | LIQ9 Bartender Team · Spirits Specialist · 🥃 |
| SKU format | `WWW` + nums/letters (`WWW1197AD`) | `L` + code + nums (`LGN0061CM`) |

## Output rules (non-negotiable)

1. **Self-contained HTML** — one `<style>` block at top; one `<script>` block only if a
   FAQ accordion is used. No external CSS/JS.
2. **No `<html>/<head>/<body>`** wrappers. Start with `<style>`, end with the last `</div>`.
3. **No Google Fonts link** — the theme already loads Kanit.
4. **Image placeholders** like `https://th.wine-now.com/media/wysiwyg/blog/YOUR-IMAGE.jpg`,
   with a comment to replace with the real uploaded path.
5. **Prefix every class with `blog-`**.
6. **Responsive** at the 768px breakpoint.
7. **Default to Thai**; English terms for wine/spirits vocabulary are expected.
8. **Replace all `{{TOKEN}}` color placeholders** with real brand hex before output —
   never ship a `{{...}}`.

## Blog structures

**Content Blog:** Hero → byline → intro → TOC (4+ sections) → alternating sections →
components (cards, table, callouts, quote, FAQ, captioned images) → LINE CTA →
closing CTA → related articles (3).

**Product Blog:** Hero → byline → intro → region sections (flag headers) →
captioned image → product description → Magento widget → alternating bg →
sommelier/bartender tip → LINE CTA → closing CTA.

## Magento product widget (Product Blogs)

```
{{widget type="Magento\CatalogWidget\Block\Product\ProductsList" show_pager="0" products_count="10" template="product/widget/content/grid.phtml" sort_by="recommended" conditions_encoded="^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``^],`1--1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Product`,`attribute`:`sku`,`operator`:`()`,`value`:`SKU1, SKU2, SKU3, SKU4, SKU5`^]^]"}}
```

## SEO / AEO essentials

- Primary keyword in H1, first paragraph, and 2+ headings; target long-tail clusters.
- Bilingual keywords (English + Thai) — both live in the topic libraries.
- Phrase FAQ questions as real search queries (FAQ doubles as SEO + `FAQPage` schema).
- Ship a meta block: title, description (~155 chars), keywords, URL key, canonical,
  OG, and JSON-LD (`Article` + `FAQPage` for content; `CollectionPage`/`ItemList` for
  product pages). See `references/seo-and-planning.md`.

## Pre-publish checklist

- [ ] Brand hex applied everywhere (no `{{...}}` left)
- [ ] Self-contained; no page wrappers; all classes `blog-` prefixed; mobile-safe
- [ ] Keyword in H1 + intro + 2 headings
- [ ] Meta block + JSON-LD prepared
- [ ] Image placeholders + alt text; user reminded to upload real images
- [ ] (Product) widget with real or clearly-placeholdered SKUs
- [ ] LINE CTA + closing CTA + related articles present

## Reference map

| File | Contents |
|------|----------|
| `references/playbook.md` | Full blog-writing playbook (everything) |
| `references/brand-winenow.md` / `brand-liq9.md` | Per-brand identity, colors, URLs, widget syntax |
| `references/components.md` | Full HTML/CSS for all 19 components |
| `references/seo-and-planning.md` | SEO/AEO, meta, JSON-LD, content types, personas |
| `references/seo-meta-example.txt` | Worked meta + JSON-LD example |
| `references/wine-now-topic-library.csv` / `liq9-topic-library.csv` | Topic plans |
| `references/viral-seo-boosters.csv` | 33 viral SEO topics |
