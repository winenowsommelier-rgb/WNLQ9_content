# LIQ9 Brand Reference

## Brand Identity
- **Site**: th.liq9.com
- **Also known as**: LIQNINE, LIQ-NINE
- **Focus**: Spirits & Liquor (whisky, gin, rum, vodka, liqueur, Thai spirits, barware)
- **Audience**: Thai spirits enthusiasts, cocktail lovers, home bartenders, gift buyers
- **Tone**: Bold, knowledgeable, modern — like a bartender who knows their craft
- **Language**: Thai (primary), English terms for spirits/cocktail vocabulary

## Colors
```
--brand-primary: #1B1464;           /* Dark navy blue — headings, accents, borders */
--brand-hover: #110d42;             /* Darker navy — button hover */
--brand-shadow: rgba(27,20,100,0.3); /* Button shadow */
--alt-bg: #f4f5fa;                  /* Cool gray-blue — alternating sections */
--callout-from: #f0f1fa;            /* Callout gradient start */
--callout-to: #f5f5ff;              /* Callout gradient end */
--table-header: #1B1464;            /* Table header bg */
--table-even: #f7f8fc;              /* Table even row */
--table-hover: #eef0fa;             /* Table row hover */
--toc-bg: #f7f8fc;                  /* Table of contents bg */
--toc-border: #e2e4f0;              /* TOC border */
```

## URLs & Links
- Homepage: `https://th.liq9.com/`
- Whisky: `https://th.liq9.com/whisky.html`
- Liquor: `https://th.liq9.com/liquor.html`
- Blog index: `https://th.liq9.com/blog/`
- Image base path: `https://th.liq9.com/media/wysiwyg/blog/`
- LINE: `@liq9`

## Author Byline
- Name: `LIQ9 Bartender Team`
- Role: `Spirits Specialist`
- Avatar emoji: 🥃

## Magento Widget Syntax
Same syntax as Wine-Now but with LIQ9 SKU format:
```
{{widget type="Magento\CatalogWidget\Block\Product\ProductsList" show_pager="0" products_count="10" template="product/widget/content/grid.phtml" sort_by="recommended" conditions_encoded="^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``^],`1--1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Product`,`attribute`:`sku`,`operator`:`()`,`value`:`SKU1, SKU2, SKU3, SKU4, SKU5`^]^]"}}
```

SKU format: `L` prefix + category code + numbers (e.g., `LGN0061CM`, `LRM023SES`)

## Content Topics
- Spirits education (whisky types, gin botanicals, rum origins)
- Cocktail recipes & mixing guides
- Thai spirits spotlight (Mekhong, Sangsom, craft distillers)
- Seasonal recommendations (Songkran, New Year celebrations)
- Spirits comparison (bourbon vs scotch, etc.)
- Barware & tools guides
- Brand spotlights
- Gift guides for spirits lovers
