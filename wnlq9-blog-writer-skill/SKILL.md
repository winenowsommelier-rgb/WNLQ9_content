---
name: wnlq9-blog-writer
description: Generate self-contained blog HTML for Wine-Now (th.wine-now.com) or LIQ9 (th.liq9.com) that pastes directly into Magento's blog builder. Use this skill whenever the user asks to write a blog post, create blog content, generate blog HTML, or mentions Wine-Now/LIQ9 blog in any way. Also trigger when the user provides a blog topic about wine, liquor, spirits, cocktails, or beverages and wants it formatted as HTML for either brand.
---

# WNLQ9 Blog Writer

Generate production-ready, self-contained blog HTML for **Wine-Now** (wine) and **LIQ9** (liquor/spirits). The output must work when pasted directly into Magento's CMS blog builder — no external dependencies except Google Fonts.

## How to use this skill

1. Determine the **brand** (Wine-Now or LIQ9) — ask if not specified
2. Determine the **blog type**:
   - **Content Blog** — educational/knowledge articles (e.g., "What is Sulfites?")
   - **Product Blog** — articles featuring product recommendations with Magento widget placeholders (e.g., "Songkran Summer Sips")
3. Read the appropriate brand reference: `references/brand-winenow.md` or `references/brand-liq9.md`
4. Read the component library: `references/components.md`
5. Write the blog using the components and brand styles

## Brand Configuration

| Property | Wine-Now | LIQ9 |
|----------|----------|------|
| Primary color | `#8B0000` (dark red) | `#1B1464` (dark navy) |
| Hover color | `#6d0000` | `#110d42` |
| Shadow color | `rgba(139,0,0,0.3)` | `rgba(27,20,100,0.3)` |
| Alt section bg | `#f9f6f2` (warm cream) | `#f4f5fa` (cool gray-blue) |
| Callout gradient | `#fdf6f0, #fff5f5` | `#f0f1fa, #f5f5ff` |
| Table header | `#8B0000` | `#1B1464` |
| Table row hover | `#f5efe8` | `#eef0fa` |
| Table even row | `#faf8f5` | `#f7f8fc` |
| TOC bg | `#faf8f5` | `#f7f8fc` |
| TOC border | `#ede8e2` | `#e2e4f0` |
| Site URL | `https://th.wine-now.com/` | `https://th.liq9.com/` |
| LINE handle | `@wine-now` | `@liq9` |
| Focus | Wine | Whisky, Liquor, Spirits, Cocktails |

## Output Rules

1. **Self-contained HTML** — all CSS in a single `<style>` block at the top, all JS (if FAQ accordion is used) in a `<script>` block. No external CSS/JS files.
2. **No `<html>`, `<head>`, `<body>` wrappers** — the output is pasted into Magento's CMS editor which already provides those. Start with `<style>` and end with the last closing `</div>`.
3. **Google Fonts** — Kanit is already loaded by the Magento theme. Do not include the Google Fonts `<link>` tag.
4. **Images** — use placeholder paths like `https://th.wine-now.com/media/wysiwyg/blog/YOUR-IMAGE-NAME.jpg` and leave a comment telling the user to replace with their actual uploaded image path.
5. **Magento product widgets** — for Product Blog type, include the actual Magento widget shortcode syntax. Ask the user for SKUs, or leave placeholder SKUs with a clear comment.
6. **All CSS class names** are prefixed with `blog-` to avoid conflicts with Magento's existing styles.
7. **Responsive** — all components must work on mobile (768px breakpoint).
8. **Language** — default to Thai (TH) unless the user specifies otherwise. The user may provide content in Thai or English.

## Blog Structure

### Content Blog structure:
1. Hero image (separated — image then title below)
2. Author byline
3. Intro paragraph (centered, larger text)
4. Table of Contents (optional — use when 4+ sections)
5. Content sections (alternating white / alt-color backgrounds)
6. Components as needed: highlight cards, comparison table, callout/tip boxes, quote blocks, FAQ accordion, image with captions
7. LINE CTA block
8. Closing CTA button
9. Related articles (3 cards)

### Product Blog structure:
1. Hero image (separated)
2. Author byline
3. Intro paragraph
4. Country/region sections with flag emoji headers
5. Image with caption per region
6. Product description paragraph
7. Magento widget shortcode (product grid)
8. Alternating section backgrounds
9. Sommelier tip callout
10. LINE CTA block
11. Closing CTA button

## Available Components

Read `references/components.md` for the full HTML/CSS of every component. Here's the inventory:

| Component | Use case |
|-----------|----------|
| **Hero (separated)** | Every blog — full-width image + title/meta below |
| **Author byline** | Every blog — avatar + name + role + date |
| **Intro paragraph** | Every blog — centered, 20px, lighter color |
| **Table of Contents** | Long content blogs (4+ sections) |
| **Section / Section-alt** | Alternating background sections |
| **Heading (h2/h3)** | Section headers with brand-color underline |
| **Image with caption** | Photos with italic caption below |
| **Highlight cards** | 3-column grid for key points |
| **Comparison table** | Side-by-side data (e.g., wine types, regions) |
| **Callout/Tip box** | Sommelier tips, important notes |
| **Quote block** | Featured quotes with decorative quotation mark |
| **FAQ accordion** | Expandable Q&A (great for SEO) |
| **LINE CTA block** | Green LINE button with description |
| **CTA button** | Brand-colored action button |
| **Related articles** | 3-card grid linking to other posts |
| **Region header** | Country flag + name (for product blogs) |
| **Product widget** | Magento shortcode placeholder |
| **Divider** | Gradient fade divider between sections |

## Writing Guidelines

- Write in a warm, knowledgeable tone — like a sommelier talking to a friend
- For Wine-Now: focus on wine education, grape varieties, regions, food pairings
- For LIQ9: focus on spirits knowledge, cocktail culture, mixing tips, brand stories
- Keep paragraphs digestible — 2-4 sentences max
- Use bullet points for lists of 3+ items
- Include sommelier/bartender tips where relevant
- SEO: use the target keyword naturally in H1, first paragraph, and at least 2 H2/H3 headings
