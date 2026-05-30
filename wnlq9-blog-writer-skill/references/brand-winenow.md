# Wine-Now Brand Reference

## Brand Identity
- **Site**: th.wine-now.com
- **Focus**: Wine (all types — red, white, rosé, sparkling, natural, organic)
- **Audience**: Thai wine enthusiasts, casual drinkers, gift buyers
- **Tone**: Warm, knowledgeable, approachable — like a sommelier talking to a friend
- **Language**: Thai (primary), English terms for wine vocabulary

## Colors
```
--brand-primary: #8B0000;        /* Dark red — headings, accents, borders */
--brand-hover: #6d0000;          /* Darker red — button hover */
--brand-shadow: rgba(139,0,0,0.3); /* Button shadow */
--alt-bg: #f9f6f2;               /* Warm cream — alternating sections */
--callout-from: #fdf6f0;         /* Callout gradient start */
--callout-to: #fff5f5;           /* Callout gradient end */
--table-header: #8B0000;         /* Table header bg */
--table-even: #faf8f5;           /* Table even row */
--table-hover: #f5efe8;          /* Table row hover */
--toc-bg: #faf8f5;               /* Table of contents bg */
--toc-border: #ede8e2;           /* TOC border */
```

## URLs & Links
- Homepage: `https://th.wine-now.com/`
- Wine catalog: `https://th.wine-now.com/wine.html`
- Grape filter example: `https://th.wine-now.com/wine.html?grape_class=79` (Sauvignon Blanc)
- Blog index: `https://th.wine-now.com/blog/`
- Image base path: `https://th.wine-now.com/media/wysiwyg/blog/`
- LINE: `@wine-now`

## Author Byline
- Name: `Wine-Now Sommelier Team`
- Role: `Certified Sommelier`
- Avatar emoji: 🍷

## Magento Widget Syntax
Product widgets use this exact syntax (replace SKUs):
```
{{widget type="Magento\CatalogWidget\Block\Product\ProductsList" show_pager="0" products_count="10" template="product/widget/content/grid.phtml" sort_by="recommended" conditions_encoded="^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``^],`1--1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Product`,`attribute`:`sku`,`operator`:`()`,`value`:`SKU1, SKU2, SKU3, SKU4, SKU5`^]^]"}}
```

SKU format: `WWW` prefix + numbers + letters (e.g., `WWW1197AD`, `WWW5339FP`)

## Content Topics
- Wine education (grape varieties, regions, winemaking)
- Food & wine pairing
- Seasonal recommendations (Songkran, holidays, summer)
- Wine types explained (natural, organic, sulfites, tannins)
- Gift guides
- Country/region spotlights
