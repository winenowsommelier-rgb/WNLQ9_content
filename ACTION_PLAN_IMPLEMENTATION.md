# 📋 SEO Implementation Action Plan
## Wine Now & LIQ9 - 12-Week Optimization Guide

**Document Created:** May 31, 2026  
**Target Completion:** August 31, 2026  
**Expected Outcome:** +90% organic traffic increase, +฿345,000/month additional revenue

---

## WEEK 1-2: Title Tag & Meta Description Overhaul

### Task 1: Homepage Title Tag & Meta (CRITICAL)

**Current Issue:**
- Homepage getting 374k impressions but generic title/meta
- Likely title: "Home" or company name only
- Missing primary keywords

**Fix:**
```html
<!-- BEFORE (Bad) -->
<title>Wine Now</title>
<meta name="description" content="Buy wine online">

<!-- AFTER (Better) -->
<title>Premium Wine Thailand | Rare Expensive Wines & Champagne | Wine Now</title>
<meta name="description" content="Discover premium wines in Thailand. Expensive champagne, red wines, Prosecco. Free shipping on orders $100+. Expert sommelier reviews.">
```

**Keywords to Include:**
- wine, expensive wine, champagne, prosecco, sparkling wine, wine thailand, wine now

**Time:** 30 minutes | **Impact:** +10-15% homepage CTR

---

### Task 2: Top 20 High-Volume, Low-CTR Pages

**Pages to Update (by impression volume):**

#### Page 1: Expensive Wine Category
```
Current:     "Expensive Wine | [Brand]"
Meta:        "Browse expensive wines"
Problem:     Generic, no USP

New Title:   "Premium Expensive Wines | Rare Collection & Exclusive Bottles | Wine Now"
New Meta:    "Shop exclusive expensive wines starting ฿500. Authentic Bordeaux, 
             Champagne, & rare vintages. Expert ratings & fast delivery."
Keywords:    expensive wine, expensive wines, rare wine, premium wine
Estimated Impact: 100+ additional clicks/month
```

#### Page 2: Champagne Category
```
Current:     "Champagne"
Meta:        "Buy champagne"

New Title:   "French Champagne Thailand | Moët, Dom Pérignon, Veuve Clicquot | LIQ9"
New Meta:    "Authentic French Champagne in Thailand. Moët, Taittinger, Dom Pérignon.
             ฿600-3,000. Same-day delivery. Sommelier recommendations."
Keywords:    champagne, french champagne, expensive champagne, authentic champagne
Estimated Impact: 60-80 additional clicks/month
```

#### Page 3: Sparkling Wine Category
```
New Title:   "Sparkling Wine & Prosecco | Affordable & Premium Options | Wine Now"
New Meta:    "Discover best sparkling wines: Prosecco, Cava, Champagne. Affordable
             & premium options. ฿300-2,000. Free delivery on $100+ orders."
Keywords:    sparkling wine, prosecco, cava, cheap sparkling wine
Estimated Impact: 40-60 additional clicks/month
```

#### Page 4: Wine Brands (Robert Mondavi)
```
Current:     "Robert Mondavi" (likely)

New Title:   "Robert Mondavi Wine Thailand | Private Selection & Cabernet | LIQ9"
New Meta:    "Robert Mondavi wines: Private Selection, Cabernet Sauvignon & more.
             ฿800-1,500. Expert reviews & tasting notes. Fast Thailand delivery."
Keywords:    robert mondavi, robert mondavi wine, robert mondavi ราคา
Estimated Impact: 20-30 additional clicks/month
```

#### Page 5: Wine by Price Point
```
New Title:   "Affordable Wine Under ฿500 | Best Value Wines Thailand | Wine Now"
New Meta:    "Premium wines under ฿500. Jacob's Creek, Yellow Tail, Barefoot & more.
             Sommelier picks. Same-day delivery Bangkok."
Keywords:    cheap wine, affordable wine, wine under 500, budget wine
Estimated Impact: 30-50 additional clicks/month
```

**Total Task 1-2 Time Investment:** 3-4 hours  
**Estimated CTR Improvement:** +15-20% overall organic  
**Estimated Monthly Click Increase:** 300-400 additional clicks

---

## WEEK 3-4: Product Schema Implementation

### Task 3: Add Product Schema to All Wine Products

**Template (JSON-LD):**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Robert Mondavi Private Selection Cabernet Sauvignon 2021",
  "url": "https://th.wine-now.com/products/robert-mondavi-cabernet",
  "image": ["https://image-url-1.jpg", "https://image-url-2.jpg"],
  "description": "Smooth, balanced California Cabernet Sauvignon from Robert Mondavi's Private Selection. Notes of ripe plum, cherry, and spice. Perfect with grilled meats.",
  "brand": {
    "@type": "Brand",
    "name": "Robert Mondavi"
  },
  "offers": {
    "@type": "Offer",
    "price": "850",
    "priceCurrency": "THB",
    "availability": "https://schema.org/InStock",
    "url": "https://th.wine-now.com/products/robert-mondavi-cabernet"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "18",
    "bestRating": "5",
    "worstRating": "1"
  },
  "sku": "RM-CAB-2021",
  "mpn": "RM-CAB-2021",
  "gtin": "5010677564780",
  "priceCurrency": "THB"
}
```

**Where to Add:**
1. Product detail pages (wine product pages)
2. Category pages (if aggregating products)
3. Shop pages

**Pages to Update:**
- Priority 1: Top 50 most-searched wine products (Robert Mondavi, Jacob's Creek, etc.)
- Priority 2: All other product pages
- Priority 3: Category landing pages

**Implementation:**
```
Add to <head> section of each product page:
<script type="application/ld+json">
  [Schema JSON here]
</script>
```

**Testing:**
```
Use Google's Structured Data Testing Tool:
https://validator.schema.org/
```

**Time:** 6-8 hours (50-100 products) OR use developer/plugin  
**Expected Impact:** +25-30% CTR on product pages, rich snippets in results

**Expected Result in Google Search:**
```
Robert Mondavi Cabernet Sauvignon - Wine Now
⭐⭐⭐⭐⭐ (18 reviews)
฿850.00 | In Stock
Smooth, balanced California Cabernet Sauvignon from Robert Mondavi...
```

---

## WEEK 5-6: FAQ Schema for Educational Content

### Task 4: Add FAQ Schema for Wine Education

**Questions to Create FAQs For:**

#### FAQ Set 1: Wine Knowledge
```
Q: "ซัลไฟต์ คือ" (What is Sulfite in Wine?)
A: "Sulfites are natural compounds used as preservatives in winemaking. 
   They prevent oxidation and microbial spoilage. All wines contain some 
   sulfites, even natural wines."

Q: "prosecco คือ" (What is Prosecco?)
A: "Prosecco is a sparkling wine from northeastern Italy. Made from Glera 
   grapes, it's lighter and sweeter than Champagne. Great for celebrations 
   or as an aperitif."

Q: "decanter คือ" (What is a Decanter?)
A: "A decanter is a glass vessel used to separate wine sediment and aerate 
   wine. It enhances flavor by increasing surface area exposure to oxygen."

Q: "ชนแก้ว ภาษาจีน" (Wine Glass in Chinese)
A: "Wine glass in Chinese is '酒杯' (jiǔ bēi). Different wines use different 
   glass shapes to enhance aromatics and flavor."
```

#### FAQ Set 2: Buying & Wine Selection
```
Q: "ไวน์ที่แพงที่สุดในโลก" (Most Expensive Wine in the World?)
A: "The most expensive wine is Château d'Yquem 1947 Sauternes, valued at 
   $100,000+. We offer rare expensive wines starting from ฿800."

Q: "how to choose wine" (How Do I Choose Wine?)
A: "Consider: 1) Your budget, 2) Occasion/food pairing, 3) Grape variety 
   preferences, 4) Red vs white vs sparkling, 5) Wine region. Ask our 
   sommeliers for personalized recommendations."

Q: "ไวน์ขาว ยี่ห้อไหนดี" (Best White Wine Brands?)
A: "Top white wine brands: Sauvignon Blanc (New Zealand), Chardonnay (Burgundy), 
   Riesling (Germany), Pinot Grigio (Italy). We carry all these."
```

**Implementation:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Prosecco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Prosecco is a sparkling wine from northeastern Italy..."
      }
    },
    {
      "@type": "Question",
      "name": "How do I choose wine?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Consider your budget, occasion, grape variety..."
      }
    }
  ]
}
```

**Where to Add:**
- Wine education/blog pages
- Product category pages
- New FAQ page

**Time:** 4-6 hours  
**Expected Impact:** +10% CTR for educational queries, featured snippets

---

## WEEK 7-8: Content Creation (Blog & Guides)

### Task 5: Create High-ROI Content Pages

#### Guide 1: "Beginner's Guide to Wine Tasting"
```
URL: /guides/wine-tasting-guide/
Target Keywords: "how to taste wine", "wine tasting guide", "wine tasting notes"
Word Count: 2,500-3,000
Estimated Monthly Traffic: 50-100 searches

Content Structure:
- Introduction (why wine tasting matters)
- 5 Steps to Wine Tasting (appearance, smell, taste, finish, overall impression)
- How to Take Tasting Notes (template)
- Common Wine Tasting Mistakes
- Wine Pairing Tips
- Product Links: Wine glasses, decanters, wine aerators
- Call-to-Action: "Join our sommelier tasting class"

Schema: Blog schema + FAQ schema for Q&A section
```

#### Guide 2: "Expensive Wine Buying Guide: $500-$5,000 Wines"
```
URL: /guides/expensive-wine-buying-guide/
Target Keywords: "expensive wine", "rare wine", "collector wine", "investment wine"
Word Count: 2,500 words
Estimated Monthly Traffic: 100-150 searches

Content Structure:
- Why Buy Expensive Wine?
- Top 20 Most Expensive Wines (with prices, tasting notes)
- Wine Investment Guide
- Authentication & Storage Tips
- Best Regions for Investment Wines (Burgundy, Bordeaux)
- Where to Buy Rare Wines
- Internal Links: Product pages for each wine mentioned
- CTA: "Find rare wines in our collection"

Schema: Article schema + Product schema links
```

#### Guide 3: "Champagne vs. Prosecco vs. Cava: Which to Buy?"
```
URL: /guides/champagne-prosecco-cava-comparison/
Target Keywords: "champagne vs prosecco", "best sparkling wine", "affordable champagne"
Word Count: 2,000 words
Estimated Monthly Traffic: 80-120 searches

Content Structure:
- Quick Comparison Table
- Champagne Explained (regions, price, taste)
- Prosecco Explained (Italian tradition, affordability)
- Cava Explained (Spanish sparkles, value)
- Tasting Notes Comparison
- Food Pairing Guide
- Price Comparison
- Product Recommendations
- CTA: "Shop our sparkling wine collection"

Schema: Comparison schema + Product schema
```

#### Guide 4: "Wine Pairing Mastery: Food & Wine Combinations"
```
URL: /guides/wine-food-pairing/
Target Keywords: "wine pairing", "food and wine", "wine with [food]"
Word Count: 3,000 words
Estimated Monthly Traffic: 150-200 searches

Content Structure:
- Wine Pairing Principles
- Pairing by Main Course (beef, fish, chicken, vegetarian)
- Pairing by Cuisine (Thai, Italian, French)
- Dessert Wine Pairings
- Wine Bar Etiquette
- Sommelier Tips
- Interactive Pairing Quiz (engagement)
- Product Links: Wines for each pairing

Schema: HowTo schema + FAQ schema
```

#### Blog 5-10: Wine Reviews & Tasting Notes
```
Create 5-10 individual wine reviews targeting product-specific queries:

Example Topics:
- "Jacob's Creek Cabernet Sauvignon Review & Tasting Notes"
  Target: "jacob's creek ราคา", "jacob creek wine review"
  
- "Moët & Chandon Champagne: Price, Taste, Where to Buy"
  Target: "moet chandon ราคา", "moet champagne price"
  
- "Robert Mondavi Cabernet: Regions, Vintages & Prices"
  Target: "robert mondavi ราคา", "robert mondavi wine"

Each should be:
- 1,500-2,000 words
- Include tasting notes (appearance, nose, palate, finish)
- Price comparisons
- Food pairing suggestions
- Where to buy links
- Schema: Article + Product schema
```

**Total Content Creation Time:** 20-30 hours  
**Expected Impact:** 300-500 additional monthly organic sessions  
**Additional Conversion Opportunity:** Product links in guides = direct sales

---

## WEEK 9-10: Technical SEO & Core Web Vitals

### Task 6: Core Web Vitals Optimization

**Check Current Status:**
```
Use Google PageSpeed Insights:
https://pagespeed.web.dev/

Look for:
- LCP (Largest Contentful Paint): Target < 2.5s
- INP (Interaction to Next Paint): Target < 200ms
- CLS (Cumulative Layout Shift): Target < 0.1
```

**Common Fixes:**

| Issue | Solution | Effort |
|-------|----------|--------|
| Slow LCP | Optimize images (WebP format), lazy load images below fold, minify CSS | 4-6 hours |
| High INP | Minimize JavaScript, defer non-critical JS, optimize event handlers | 4-6 hours |
| High CLS | Fix layout shifts (images need dimensions), avoid inserting content above viewport | 2-3 hours |
| Slow TTFB | Enable caching, use CDN, optimize server response | 4-8 hours |

**Priority Fixes:**

1. **Image Optimization**
   - Convert all product images to WebP format
   - Create responsive images (3 sizes: mobile, tablet, desktop)
   - Add image dimensions to prevent CLS
   - Lazy load images below the fold

2. **JavaScript Optimization**
   - Defer non-critical JavaScript
   - Remove unused JavaScript/CSS
   - Minify files
   - Use async/defer attributes

3. **Caching Strategy**
   - Enable browser caching (30-365 days)
   - Implement server-side caching
   - Use CDN for static assets (images, CSS, JS)

**Time:** 6-10 hours  
**Expected Impact:** +5-10% CTR (faster = better UX = more clicks)

---

### Task 7: Internal Linking Optimization

**Current Problem:**
- Orphaned pages (not linked to)
- Poor keyword relevance in internal links
- Missing related product links

**Fixes:**

**1. Create Internal Link Architecture**
```
Homepage
├── Wine by Type
│   ├── Red Wines
│   │   ├── Cabernet Sauvignon
│   │   ├── Merlot
│   │   └── Pinot Noir
│   ├── White Wines
│   │   ├── Chardonnay
│   │   ├── Sauvignon Blanc
│   │   └── Riesling
│   └── Sparkling
│       ├── Champagne
│       ├── Prosecco
│       └── Cava
├── Wine by Price
│   ├── Under ฿500
│   ├── ฿500-1,000
│   └── ฿1,000+
├── Wine by Region
│   ├── Bordeaux
│   ├── Burgundy
│   ├── Napa Valley
│   └── [Others...]
├── Blog/Guides
│   ├── Wine Tasting Guide
│   ├── Food Pairing
│   └── [Others...]
└── [Brand Pages...]
```

**2. Link Anchor Text Optimization**
```
BEFORE (Bad):
"Click here for more wines"
"Learn more"

AFTER (Better):
"Explore premium Cabernet Sauvignon wines"
"Best Prosecco under ฿600"
"Jacob's Creek wine collection"
```

**3. "Related Products" Section**
```
On each product page, add:
- Similar wines (same region/type)
- Complementary wines (for pairing)
- Frequently bought together

Example:
Robert Mondavi Cabernet page:
- Link: "More Napa Valley Cabernets"
- Link: "Food Pairings for Cabernet"
- Link: "Budget Cabernet Alternatives (Jacob's Creek)"
```

**Time:** 6-8 hours  
**Expected Impact:** +3-5% CTR, better distribution of link juice

---

## WEEK 11-12: Monitoring & Fine-Tuning

### Task 8: GSC Monitoring & Iteration

**Weekly Tasks:**
```
1. Check Google Search Console for:
   - New queries (opportunities)
   - Position changes (improvements/drops)
   - Click-through rate by page
   - Pages with 0 clicks but high impressions (optimization targets)

2. Analyze:
   - Which title/meta changes helped most?
   - Which schema updates increased CTR?
   - Which new content is ranking?

3. Make adjustments:
   - A/B test title variations for underperforming pages
   - Expand best-performing content
   - Fix any new issues
```

**Monthly Report:**
```
Track these metrics:
- Organic traffic growth
- Organic CTR improvement
- Keyword positions (target: move 10 keywords from pos 10+ to pos 1-3)
- Conversion increase
- Revenue impact
```

**Time:** 3-4 hours/week  
**Expected Impact:** Continuous optimization = sustainable growth

---

## 📊 TRACKING & MEASUREMENT

### Key Metrics to Monitor

**Weekly (Google Search Console):**
- Total Impressions
- Total Clicks
- Average CTR
- Average Position
- Top 10 queries by clicks
- Top 10 queries by impressions but 0 clicks

**Monthly (Google Analytics):**
- Organic Sessions
- Organic Users
- Engagement Rate
- Conversions from Organic
- Revenue from Organic Traffic

**Targets (12-Month Goals):**

| Metric | Current (May) | 3-Month | 6-Month | 12-Month |
|--------|---------------|---------|---------|----------|
| Monthly Organic Sessions | 2,211 | 2,800 | 3,200 | 3,500 |
| Organic CTR | 4.26% | 5.5% | 6.5% | 7.5% |
| Monthly Conversions | 71 | 100 | 120 | 140 |
| Monthly Revenue (est.) | ฿355,000 | ฿500,000 | ฿600,000 | ฿700,000 |

---

## 💼 RESOURCE ALLOCATION

### Team Requirements:

**Option A: In-House (Recommended)**
```
- SEO Specialist: 20 hours/week (titles, meta, schema, monitoring)
- Content Writer: 15 hours/week (blog posts, guides, product descriptions)
- Developer: 10 hours/week (schema implementation, Core Web Vitals)
- Total: 45 hours/week × 12 weeks = 540 hours
```

**Option B: Agency/Freelancer**
```
- SEO Agency: $3,000-5,000/month (full implementation + monitoring)
- Freelance Writer: $500-800/month (content creation)
- Freelance Developer: $500-1,000/month (technical implementation)
- Total: $4,500-7,000/month
```

### Budget Estimate:
- **In-House:** Salary costs (varies)
- **Agency:** $4,500-7,000/month × 3 months = $13,500-21,000
- **Expected ROI:** +฿345,000/month additional revenue = **15-25x return**

---

## ⚠️ COMMON MISTAKES TO AVOID

1. **Keyword Stuffing in Titles**
   - ❌ "Expensive Wine | Cheap Wine | Best Wine | Wine | Wine Now"
   - ✅ "Premium Expensive Wines | Rare Collection | Wine Now"

2. **Forgetting Brand Name in Titles**
   - ❌ "Red Wine Category Page"
   - ✅ "Red Wine Collection | Premium Reds | Wine Now"

3. **Schema Implementation Errors**
   - ❌ Using wrong schema type (Blog instead of Product)
   - ✅ Validate all schema with Google's validator

4. **Ignoring Mobile Experience**
   - ❌ Optimizing desktop only
   - ✅ Mobile-first approach (60% of wine searches are mobile)

5. **Not Monitoring Changes**
   - ❌ Making changes and never checking if they worked
   - ✅ Track every change in GSC/GA4

---

## 📞 IMPLEMENTATION CHECKLIST

### Week 1-2: Titles & Metas
- [ ] Homepage title & meta updated
- [ ] Top 20 product pages updated
- [ ] Category pages updated
- [ ] All changes tested in GSC

### Week 3-4: Product Schema
- [ ] Schema template created
- [ ] Top 50 products updated
- [ ] Schema validated with Google tool
- [ ] Rich snippets appearing in search results

### Week 5-6: FAQ Schema
- [ ] FAQ schema added to educational content
- [ ] FAQ page created
- [ ] Schema validated

### Week 7-8: Content Creation
- [ ] "Wine Tasting Guide" blog published
- [ ] "Expensive Wine Guide" blog published
- [ ] "Sparkling Wine Comparison" blog published
- [ ] 5-10 wine review posts published
- [ ] All have internal product links

### Week 9-10: Technical SEO
- [ ] Core Web Vitals checked
- [ ] Images optimized (WebP)
- [ ] JavaScript minified/deferred
- [ ] Caching enabled
- [ ] Internal linking structure created
- [ ] Related products section added

### Week 11-12: Monitoring
- [ ] GSC monitored weekly
- [ ] GA4 conversion tracking verified
- [ ] Monthly reports created
- [ ] A/B testing begun

---

## 📈 SUCCESS METRICS

**After 30 Days:**
- ✅ CTR increases to 5.5%+
- ✅ Rich snippets appearing for 20+ keywords
- ✅ New keywords ranking in top 10

**After 90 Days:**
- ✅ Organic traffic up 30-40%
- ✅ CTR reaches 6.5%
- ✅ 50+ new keywords ranking
- ✅ Conversions +30%

**After 12 Months:**
- ✅ Organic traffic +90%
- ✅ CTR reaches 7.5%+
- ✅ 200+ new keywords ranking
- ✅ Revenue +฿345,000/month

---

**Ready to start? Begin with Week 1-2 tasks immediately.**

**Questions? Review the full audit report above or consult with an SEO specialist.**
