# Magento 2 SEO & AEO Developer Implementation Guide
## Wine Now TH & LIQ9 TH

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Target:** Magento 2.4+ Developers  
**Sites:** https://th.wine-now.com | https://th.liq9.com  
**Scope:** Product pages, category pages, schema markup, AI optimization

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Issues & Opportunities](#current-issues--opportunities)
3. [Live Monitoring System Integration](#live-monitoring-system-integration)
4. [SEO Implementation Requirements](#seo-implementation-requirements)
5. [AEO Implementation Requirements](#aeo-implementation-requirements)
6. [Magento 2 Technical Implementation](#magento-2-technical-implementation)
7. [Testing & Verification](#testing--verification)
8. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### Sites Overview
- **Wine Now TH**: 11,436+ products | Property ID: 377750759
- **LIQ9 TH**: Same infrastructure | GSC verified for both
- **Current State**: Basic Magento 2 setup, minimal SEO optimization
- **Opportunity**: 40+ high-impression keywords with <5% CTR (quick win targets)

### What You Need to Do
Implement SEO metadata and schema markup across all product pages to:
- ✅ Improve click-through rates on high-impression keywords
- ✅ Maximize AI visibility (ChatGPT, Perplexity, Bing Copilot)
- ✅ Enable Google Rich Results (Product, Review, Schema)
- ✅ Boost mobile performance (critical for Thai market)

### Success Metrics
Track in real-time dashboard: https://seo-dashboard-abc.vercel.app (URL provided after deployment)
- Position improvement: Track via GSC daily sync
- CTR improvement: Monitor via GA4 daily sync
- Rich result eligibility: Validate via schema testing

---

## Current Issues & Opportunities

### Data Source: Live GSC & GA4 Integration
Your monitoring system now captures:
- **GSC (Daily 6 AM UTC)**: All keywords, positions, impressions, clicks
- **GA4 (Daily 6 AM UTC)**: Organic traffic, bounce rate, session duration
- **Regressions (Automated)**: Keywords with >3 position drop or >20% CTR drop
- **Opportunities (Automated)**: Keywords with 500+ impressions but <2% CTR

### Top 10 Optimization Targets

**Keyword Regressions (Fix First)**
```
These keywords LOST ranking position in past 7 days
- Track in dashboard: Regression Alerts section
- Common cause: Thin product descriptions, missing schema
- Priority: HIGH (prevent further drops)
```

**High Impression / Low CTR (Quick Wins)**
```
These keywords get lots of impressions but few clicks
- Current CTR: 0.5-2.0% (target: 5-8% with optimized titles/descriptions)
- Estimated traffic gain: 5-15 clicks/keyword from title/description improvement
- Priority: MEDIUM (high ROI, moderate effort)
- Example: "wine red Bordeaux" gets 500 impressions, 3 clicks (0.6% CTR)
  → Fix: Write unique product title + compelling description + schema
  → Expected: 25+ clicks (5% CTR) = +22 traffic/day
```

**Missing Schema Markup**
```
Products without Rich Result eligibility
- Zero Google Rich Result snippets (product cards in search)
- Impact: Competitors get better SERP placement with rating stars
- Fix: Add Product + Review + AggregateRating schema
```

### Magento 2 Specific Issues Found

1. **Product Titles**: Generic or truncated (150 char limit used)
   - Issue: Not utilizing full 60-character SERP title space
   - Fix: Craft unique, keyword-rich titles (see below)

2. **Meta Descriptions**: Missing or auto-generated
   - Issue: Non-compelling, low CTR
   - Fix: Write manual descriptions with CTA (see below)

3. **Product Schema**: Minimal or absent
   - Issue: No Google Rich Results, no AI parsing
   - Fix: Add structured data (see implementation section)

4. **Mobile Rendering**: Slow load (Core Web Vitals)
   - Issue: High bounce rate on mobile (60% of Thai traffic)
   - Fix: Optimize images, lazy loading, CSS (see below)

5. **Category Pages**: No unique descriptions
   - Issue: Duplicate content, no keyword targeting
   - Fix: Write category landing pages (see below)

---

## Live Monitoring System Integration

### How to Access Real-Time Data

**1. Daily Reports (Automated)**
- **Time**: 6 AM UTC (1 PM Bangkok) → GSC/GA4 sync
- **Time**: 7 AM UTC (2 PM Bangkok) → Slack alert with:
  - Yesterday's new keywords
  - Position changes
  - Regression alerts
  - Opportunity quick wins

**2. Dashboard (Always-On)**
- **URL**: https://seo-dashboard-abc.vercel.app (live soon)
- **Refresh**: Every 5 minutes
- **Shows**:
  - 📊 GSC metrics: Keywords tracked, avg position, CTR
  - 📈 GA4 metrics: Organic sessions, users, bounce rate
  - 🔴 Regressions: Keywords losing position
  - 💡 Opportunities: High-impression, low-CTR targets

**3. Supabase Database (Raw Data)**
- **GSC Daily**: `seo_gsc_daily` → Import into your own analytics
- **GA4 Daily**: `seo_ga4_daily` → Track conversion rates by keyword
- **Regressions**: `seo_regression_alerts` → Alert developers to fixes needed
- **Access**: Via API or direct SQL query

### Using Data to Prioritize Fixes

```sql
-- Find top 20 keywords to fix (highest opportunity)
SELECT 
  keyword,
  impressions,
  clicks,
  ctr,
  position,
  (impressions * 0.05 - clicks) as potential_clicks
FROM seo_gsc_daily
WHERE metric_date = CURRENT_DATE
  AND impressions > 500
  AND ctr < 0.02
ORDER BY potential_clicks DESC
LIMIT 20;
```

---

## SEO Implementation Requirements

### 1. Product Title Optimization

**Current State**: `[Brand] [Product Type] [SKU]` (generic)

**Required Format**: `[Brand] [Product Type] [Key Attributes] | [Category] [Optional Benefit]`

**Examples**:

```
WINE CATEGORY:
❌ Before: "Wine Red Bordeaux RW001"
✅ After: "CASTEL Bordeaux Wine 2019 | Premium French Red Wine 750ml"

Keyword Target: "bordeaux wine" + "french red wine"
Length: 65 characters (optimal SERP display)
Includes: Brand + Type + Vintage + Subcategory + Size

SPIRITS CATEGORY:
❌ Before: "Whiskey Scotch SK100"
✅ After: "Macallan 18 Year Scotch Whisky | Premium Single Malt 750ml"

Keyword Targets: "scotch whisky", "single malt whiskey", "macallan 18"
```

**Magento 2 Implementation**:

```php
// File: app/code/YourNamespace/SEO/Observer/ProductTitleOptimizer.php

namespace YourNamespace\SEO\Observer;

use Magento\Framework\Event\Observer;

class ProductTitleOptimizer implements \Magento\Framework\Event\ObserverInterface
{
    public function execute(Observer $observer)
    {
        $product = $observer->getEvent()->getProduct();
        
        $brand = $product->getAttributeText('brand') ?? '';
        $type = $product->getAttributeText('product_type') ?? '';
        $subtype = $product->getAttributeText('subcategory') ?? '';
        $attributes = $product->getAttributeText('key_attributes') ?? '';
        $size = $product->getData('size') ?? '750ml';
        
        $optimizedTitle = sprintf(
            "%s %s %s | %s %s",
            $brand,
            $type,
            $attributes,
            $subtype,
            $size
        );
        
        // Trim to 60 characters for SERP display
        $optimizedTitle = substr($optimizedTitle, 0, 60);
        
        $product->setData('meta_title', $optimizedTitle);
        
        return $this;
    }
}
```

---

### 2. Meta Description Optimization

**Current State**: Empty or auto-generated (low CTR)

**Required Format**:
- 150-160 characters
- Include primary keyword once
- Include CTA ("Buy now", "Shop", "Discover")
- Compelling, benefit-focused language

**Examples**:

```
WINE:
❌ Before: "Red wine from France"
✅ After: "Premium Bordeaux wine 2019. Award-winning French red wine with rich flavor. Shop now for authentic wine online."
          [158 chars, includes: keyword x2, CTA, benefit, unique]

SPIRITS:
❌ Before: "Scotch whisky from Scotland"
✅ After: "Macallan 18 Year Single Malt Scotch. Smooth, complex Scottish whisky. Order premium whisky online & get fast delivery."
          [157 chars, includes: brand + keyword, CTA, benefit]
```

**Magento 2 Implementation**:

```php
// File: app/code/YourNamespace/SEO/Observer/MetaDescriptionOptimizer.php

namespace YourNamespace\SEO\Observer;

use Magento\Framework\Event\Observer;

class MetaDescriptionOptimizer implements \Magento\Framework\Event\ObserverInterface
{
    public function execute(Observer $observer)
    {
        $product = $observer->getEvent()->getProduct();
        
        $brand = $product->getAttributeText('brand') ?? 'Wine';
        $category = $product->getCategory()->getName() ?? '';
        $shortDesc = substr($product->getShortDescription(), 0, 80);
        $origin = $product->getAttributeText('country_origin') ?? '';
        
        // Build compelling description
        $description = sprintf(
            "%s %s. %s. %s wine online & get fast delivery Thailand.",
            $brand,
            ucfirst($category),
            $shortDesc,
            $origin
        );
        
        // Trim to 160 characters
        $description = substr($description, 0, 160);
        
        // Add "Shop now" if space available
        if (strlen($description) < 155) {
            $description = substr($description, 0, 145) . " Shop now.";
        }
        
        $product->setData('meta_description', $description);
        
        return $this;
    }
}
```

---

### 3. Category Page Optimization

**Current State**: Empty or auto-generated descriptions

**Required**:
- Unique H1 for each category
- 150-200 word description
- Includes top 3-5 keywords for category
- Internal links to featured products
- Schema markup (BreadcrumbList)

**Example - Wine Category**:

```html
<h1>Premium Wine Shop Thailand | Buy French & Italian Wines Online</h1>

<p>
Welcome to our premium wine collection in Thailand. We curate the finest French, 
Italian, and Spanish wines for wine enthusiasts. Shop award-winning Bordeaux, 
Burgundy, and Chianti wines online with fast delivery across Thailand.
</p>

<p>Our wine selection includes:</p>
<ul>
  <li><a href="/wine/bordeaux">Bordeaux Wines</a> - Premium French reds</li>
  <li><a href="/wine/burgundy">Burgundy Wines</a> - Elegant Pinot Noirs</li>
  <li><a href="/wine/chianti">Italian Wines</a> - Tuscan Chiantis</li>
  <li><a href="/wine/rioja">Spanish Wines</a> - Rioja Tempranillos</li>
</ul>
```

---

## AEO Implementation Requirements

### AI Engine Optimization for ChatGPT, Perplexity, Bing Copilot

**Goal**: Make your product pages citable sources for AI queries

**Examples of AI Queries Your Pages Should Answer**:
```
"What's a good Bordeaux wine under 2000 baht?"
"Best Italian red wines for Thai cuisine"
"Top rated single malt whisky brands"
"Where to buy premium wine in Bangkok"
```

### 1. Schema Markup Implementation

**Required**: Product, Review, AggregateRating, BreadcrumbList, SameAs

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "CASTEL Bordeaux Wine 2019 | Premium French Red Wine 750ml",
  "description": "Award-winning Bordeaux wine 2019 with rich, complex flavors...",
  "image": "https://th.wine-now.com/product-image.jpg",
  "brand": {
    "@type": "Brand",
    "name": "CASTEL"
  },
  "manufacturer": {
    "@type": "Organization",
    "name": "Maison CASTEL",
    "url": "https://castel-wine.com"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://th.wine-now.com/bordeaux-wine-2019",
    "priceCurrency": "THB",
    "price": "1999",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Wine Now Thailand"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "247",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "author": {
        "@type": "Person",
        "name": "สมชาย ค."
      },
      "reviewBody": "Excellent Bordeaux wine. Great quality for the price...",
      "datePublished": "2026-05-15"
    }
  ],
  "isPartOf": {
    "@type": "CollectionPage",
    "name": "Bordeaux Wines",
    "url": "https://th.wine-now.com/wine/bordeaux"
  }
}
```

**Magento 2 Implementation**:

```php
// File: app/code/YourNamespace/SEO/Block/ProductSchema.php

namespace YourNamespace\SEO\Block;

use Magento\Framework\View\Element\Template;

class ProductSchema extends Template
{
    public function getProductSchema($product)
    {
        $schema = [
            '@context' => 'https://schema.org/',
            '@type' => 'Product',
            'name' => $product->getName(),
            'description' => $product->getDescription(),
            'image' => $this->getProductImageUrl($product),
            'brand' => [
                '@type' => 'Brand',
                'name' => $product->getAttributeText('brand') ?? '',
            ],
            'offers' => [
                '@type' => 'Offer',
                'url' => $product->getProductUrl(),
                'priceCurrency' => 'THB',
                'price' => $product->getFinalPrice(),
                'availability' => $product->isAvailable() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            ],
        ];
        
        // Add review rating if available
        if ($product->getRatingSummary()) {
            $schema['aggregateRating'] = [
                '@type' => 'AggregateRating',
                'ratingValue' => round($product->getRatingSummary() / 20, 1),
                'ratingCount' => $product->getReviewsCount(),
            ];
        }
        
        return json_encode($schema, JSON_UNESCAPED_SLASHES);
    }
}
```

---

### 2. Content Optimization for AI Parsing

**Requirements for AI Engines to Citation Your Page**:
- Clear opening paragraph answering the query
- Factual, specific information (avoid vague language)
- Structured lists with details
- Original analysis or insights
- Proper HTML semantic structure (h2, h3, p tags)

**Example Product Description**:

```html
<h1>CASTEL Bordeaux Wine 2019 - Premium French Red Wine</h1>

<!-- AI-Citation Ready: Direct answer paragraph -->
<p>
CASTEL Bordeaux 2019 is a premium French red wine from the Bordeaux region 
offering excellent value at ฿1,999. This wine features a deep ruby color, 
with complex flavors of blackcurrant, plum, and subtle oak. With 13.5% alcohol 
and a 90+ Parker rating, it pairs well with Thai cuisine and works well for 
daily drinking or special occasions.
</p>

<!-- Structured details for AI extraction -->
<h2>Wine Specifications</h2>
<ul>
  <li><strong>Region:</strong> Bordeaux, France</li>
  <li><strong>Vintage:</strong> 2019</li>
  <li><strong>Producer:</strong> Maison CASTEL</li>
  <li><strong>Alcohol:</strong> 13.5%</li>
  <li><strong>Volume:</strong> 750ml</li>
  <li><strong>Type:</strong> Dry Red</li>
  <li><strong>Flavor Profile:</strong> Blackcurrant, Plum, Oak</li>
  <li><strong>Rating:</strong> 90/100 (Parker)</li>
</ul>

<!-- AI-friendly FAQ section -->
<h2>Frequently Asked Questions</h2>

<h3>Is CASTEL Bordeaux good for Thai food?</h3>
<p>Yes, this wine pairs excellently with Thai cuisine. The tannins and acidity 
complement spicy dishes, while the dark fruit flavors balance aromatic herbs.</p>

<h3>How long can I age this wine?</h3>
<p>The 2019 CASTEL Bordeaux can be enjoyed now or aged for 8-10 years in proper 
storage conditions (13-15°C, 70% humidity).</p>

<h3>Where is CASTEL produced?</h3>
<p>CASTEL wines are produced by Maison CASTEL, a family-owned winery in 
Bordeaux, France since 1946. All grapes are sourced from Bordeaux vineyards.</p>
```

---

## Magento 2 Technical Implementation

### Setup & Installation

**Step 1: Create SEO Module**

```bash
mkdir -p app/code/WineNow/SEO/etc
mkdir -p app/code/WineNow/SEO/Observer
mkdir -p app/code/WineNow/SEO/Block
```

**Step 2: Create module.xml**

```xml
<!-- app/code/WineNow/SEO/etc/module.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="WineNow_SEO" setup_version="1.0.0">
        <sequence>
            <module name="Magento_Catalog"/>
        </sequence>
    </module>
</config>
```

**Step 3: Create events.xml**

```xml
<!-- app/code/WineNow/SEO/etc/events.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    
    <!-- Trigger on product save -->
    <event name="catalog_product_save_after">
        <observer name="product_title_optimizer" instance="WineNow\SEO\Observer\ProductTitleOptimizer"/>
        <observer name="meta_description_optimizer" instance="WineNow\SEO\Observer\MetaDescriptionOptimizer"/>
    </event>
    
    <!-- Trigger on category save -->
    <event name="catalog_category_save_after">
        <observer name="category_optimizer" instance="WineNow\SEO\Observer\CategoryOptimizer"/>
    </event>
</config>
```

**Step 4: Register Module**

```php
// app/code/WineNow/SEO/registration.php
<?php
\Magento\Framework\Component\ComponentRegistrar::register(
    \Magento\Framework\Component\ComponentRegistrar::MODULE,
    'WineNow_SEO',
    __DIR__
);
```

**Step 5: Deploy**

```bash
php bin/magento setup:upgrade
php bin/magento setup:di:compile
php bin/magento cache:clean
```

---

### Product Page Template Updates

**Add Schema to product view template**:

```html
<!-- app/design/frontend/YourTheme/Magento_Catalog/templates/product/view/details.phtml -->

<?php if ($block->canShowProductSchema()): ?>
<script type="application/ld+json">
<?php echo $block->getProductSchema($_product); ?>
</script>
<?php endif; ?>

<!-- Your existing product content here -->
<div class="product-details">
    <h1><?php echo $_product->getName(); ?></h1>
    <div class="product-description">
        <?php echo $_product->getDescription(); ?>
    </div>
    <div class="product-specs">
        <h2><?php echo __('Product Specifications'); ?></h2>
        <ul>
            <?php foreach ($this->getProductSpecs($_product) as $spec): ?>
            <li>
                <strong><?php echo $spec['label']; ?>:</strong>
                <?php echo $spec['value']; ?>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
</div>
```

---

## Testing & Verification

### 1. Verify Changes in Browser

```bash
# For each modified product, check:

1. Title appears correctly in browser <title> tag
   → Right-click > View Page Source > Find <title>

2. Meta description visible
   → Right-click > View Page Source > Find <meta name="description"

3. Schema is valid JSON-LD
   → Search for <script type="application/ld+json"> in source
   → Copy & paste into https://validator.schema.org/

4. Mobile rendering
   → Open in mobile device or DevTools
   → Check image load speed, text readability
```

### 2. Test with Google Tools

```
1. Mobile-Friendly Test:
   https://search.google.com/test/mobile-friendly
   → Enter product URL
   → Should show "Page is mobile friendly"

2. Rich Result Test:
   https://search.google.com/test/rich-results
   → Enter product page URL
   → Should detect Product + Review schema

3. PageSpeed Insights:
   https://pagespeed.web.dev
   → Enter product URL
   → Target: >80 on mobile (LCP <2.5s)
```

### 3. Test with AI Engines

```
1. ChatGPT:
   Ask: "What wines do you recommend from wine-now.com?"
   → Should cite your product pages

2. Perplexity:
   Ask: "Best Bordeaux wines available in Thailand"
   → Should cite your pages with product links

3. Check llms.txt compliance:
   https://th.wine-now.com/robots.txt
   → Verify robots.txt allows AI crawlers
```

### 4. Automated Testing

```bash
# Create test script (optional)
# File: tests/SEOValidation.php

public function testProductSchema()
{
    $product = $this->productFactory->create()->load(1); // Load product #1
    $schema = json_decode($this->schemaBlock->getProductSchema($product), true);
    
    $this->assertArrayHasKey('name', $schema);
    $this->assertArrayHasKey('description', $schema);
    $this->assertArrayHasKey('aggregateRating', $schema);
    $this->assertTrue(strlen($product->getMetaTitle()) <= 60);
    $this->assertTrue(strlen($product->getMetaDescription()) <= 160);
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All 11,436 products have optimized titles (60 char max)
- [ ] All 11,436 products have meta descriptions (150-160 char)
- [ ] All category pages have unique descriptions (150+ words)
- [ ] Product schema markup added to template
- [ ] Category schema markup added
- [ ] BreadcrumbList schema for navigation
- [ ] Test on staging: 5 random products validated
- [ ] Mobile rendering tested
- [ ] Google Rich Result test passes
- [ ] PageSpeed >80 on mobile
- [ ] Zero console errors in DevTools

### Deployment

- [ ] Backup database before deploying module
- [ ] Deploy SEO module to production
- [ ] Run `setup:upgrade` and `di:compile`
- [ ] Clear Magento + browser cache
- [ ] Test 10 random product pages live
- [ ] Check Slack alert for any errors
- [ ] Monitor dashboard for 6 AM GSC sync tomorrow

### Post-Deployment Monitoring

- [ ] Check dashboard daily for 7 days
- [ ] Monitor for position drops (regressions)
- [ ] Check CTR improvements on modified keywords
- [ ] Monitor bounce rate on product pages
- [ ] Check AI engines (ChatGPT, Perplexity) citation

### Success Metrics (Track in Dashboard)

**Week 1-2**: Expect no negative changes
- ✅ Positions stable (no new regressions)
- ✅ Schema markup detected in Google Search Console

**Week 2-4**: Expect improvements
- ✅ CTR increases 10-30% on optimized keywords
- ✅ New Rich Result snippets appear in Google
- ✅ AI engines start citing your pages

**Month 1-3**: Expected results
- ✅ Traffic +20-50% from organic search
- ✅ Conversion rate improves 5-15%
- ✅ Brand mentioned in AI summaries

---

## Troubleshooting

### Issue: Titles are still showing generic versions

**Solution**: Check that observer is registered
```bash
php bin/magento module:status | grep WineNow_SEO
# Should show: WineNow_SEO enabled
```

### Issue: Schema not appearing in Google

**Solution**: Submit sitemap to Google Search Console
1. Go to https://search.google.com/search-console/
2. Select property
3. Go to Sitemaps → Submit new sitemap
4. URL: `https://th.wine-now.com/sitemap.xml`
5. Wait 3-7 days for processing

### Issue: CTR still not improving

**Check**:
1. Is meta description compelling? (Add CTA)
2. Are keywords in title/description? (Check GSC)
3. Is page fast loading? (Check PageSpeed)
4. Are rich results showing? (Check Rich Result Test)

---

## Support & Questions

For developers:
- Check dashboard: https://seo-dashboard-abc.vercel.app
- View GSC data: Google Search Console
- View GA4 data: Google Analytics
- Check regressions: Dashboard > Alerts section
- Slack alerts daily: 7 AM UTC (2 PM Bangkok)

For technical issues:
- Magento Docs: https://devdocs.magento.com
- Schema.org Spec: https://schema.org/Product
- Google SEO Starter Guide: https://developers.google.com/search/docs

---

## Appendix: Quick Reference

### Optimal Meta Lengths
- Title: 50-60 characters (SERP display limit)
- Description: 150-160 characters (SERP display limit)
- H1: One per page, includes primary keyword
- H2/H3: Logical hierarchy, includes secondary keywords

### Required Schema Markup (Priority Order)
1. Product (required for all product pages)
2. AggregateRating (if reviews > 0)
3. Review (if individual reviews available)
4. BreadcrumbList (navigation structure)
5. Organization (footer/about pages)

### AI Visibility Checklist
- ✅ Clear opening paragraph with direct answer
- ✅ Structured data (schema markup)
- ✅ Original content (not copyrighted)
- ✅ Proper heading hierarchy (H1, H2, H3)
- ✅ Factual information with specific details
- ✅ Internal links to related content
- ✅ Mobile-friendly rendering
- ✅ Fast page load (<2.5s LCP)

---

**Document prepared for**: Wine Now TH Development Team  
**Approval required from**: Product Manager  
**Estimated Implementation Time**: 2-3 weeks (11,436 products)  
**Expected ROI**: 20-50% organic traffic increase within 90 days  

---
