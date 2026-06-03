# SEO Automation System — Full Design & Roadmap

**Status:** Phase 1 ✅ Complete | Phase 2 📅 Ready to build | Phase 3 🔄 Pending Phase 2

**Author:** Claude AI  
**Date:** 2026-05-31  
**Target:** Wine Now Sommelier (Thai Wine E-commerce, 11,436 products)

---

## Executive Summary

**Goal:** Transform SEO from manual effort into an automated, data-driven system that:
- Monitors daily rank/CTR trends (GSC/GA4)
- Detects opportunities (high-impression low-CTR keywords)
- Auto-generates optimized metadata + schema for all products
- Validates quality before Magento deployment
- Measures impact post-deployment

**Business Impact:**
- 💡 Identify quick wins: high-impression keywords with <2% CTR (low-hanging fruit for title/meta optimization)
- 📈 Track regressions: auto-alert when positions drop >3 or CTR drops >20%
- 📊 Measure wins: daily tracking of rank improvements + traffic gains post-optimization
- ⏱️ Save 40 hrs/month: eliminate manual rank checking + meta writing

**Deployment Timeline:** 8-10 days total
- Phase 1: 2-3 hours setup + config (sync GSC/GA4 → Supabase)
- Phase 2: 6-8 hours build (generate SEO assets for 11,436 products)
- Phase 3: 4-5 hours integration (deploy to Magento, track results)

---

## Phase 1: Monitoring Autopilot ✅ COMPLETE

**Status:** Committed to branch, ready to deploy  
**Files:** See branch `claude/lucid-bardeen-F6DjC`

### What It Does

- **Daily GSC Sync (6 AM UTC):** Pulls keyword position, impressions, clicks, CTR from Google Search Console → Supabase `seo_gsc_daily`
- **Daily GA4 Sync (6 AM UTC):** Pulls page views, users, bounce rate, conversions from Google Analytics → Supabase `seo_ga4_daily`
- **Auto-Detect Opportunities:** Flags keywords with >500 impressions but <2% CTR (quick wins)
- **Auto-Detect Regressions:** Alerts if any keyword position drops >3 or CTR drops >20%
- **Daily Slack Report (7 AM UTC):** Sends #seo-dashboard message with:
  - Today's GSC/GA4 summary
  - Critical regressions (if any)
  - Top opportunities (if any)

### Deliverables

| File | Purpose |
|------|---------|
| `supabase/migrations/20260531_seo_monitoring_schema.sql` | 6 new tables + helper functions for monitoring |
| `supabase/functions/sync-gsc-ga4/index.ts` | Edge Function: pull GSC/GA4 data hourly |
| `supabase/functions/seo-slack-alerts/index.ts` | Edge Function: send daily Slack summary |
| `docs/PHASE1_DEPLOYMENT_GUIDE.md` | Step-by-step deployment + troubleshooting |

### Setup Checklist (15 min)

1. **Supabase:** `supabase migration up` or copy-paste SQL to Supabase dashboard
2. **Deploy Functions:** `supabase functions deploy sync-gsc-ga4` & `seo-slack-alerts`
3. **Connect GSC:** Create GCP service account, grant access, set `GSC_*` env vars
4. **Connect GA4:** Enable Analytics API, grant access, set `GA4_*` env vars
5. **Connect Slack:** Create webhook, set `SLACK_WEBHOOK_URL` env var
6. **Schedule Cron:** `supabase functions deploy --schedule "0 6 * * *"` (6 AM) + `"0 7 * * *"` (7 AM)

### Monitoring & Alerts

**Once deployed, you'll see:**
- Daily #seo-dashboard Slack messages (7 AM UTC)
- `seo_gsc_daily` table growing (50-500 keywords per day)
- `seo_regression_alerts` table auto-populating when regressions detected
- `seo_opportunities` table showing quick wins

**Example Slack Message:**
```
🔍 SEO Daily Report
Date: May 31, 2026
GSC Metrics: 287 keywords tracked
GA4 Metrics: 142 pages tracked

⚠️ CRITICAL REGRESSIONS: 2 keywords dropped
• "red wine 2020" (position_drop): 4.2% drop
• "shiraz pairing" (ctr_drop): 25.1% drop

💡 TOP OPPORTUNITIES: 5 quick wins found
• "cabernet sauvignon" (Chateau XYZ): 642 impressions, 1.8% CTR
• "wine gift" (Wine Hamper): 528 impressions, 1.2% CTR
```

---

## Phase 2: SEO Generator (6-8 hours build)

**Status:** 🔄 Ready to build after Phase 1 is stable (3-5 days)

### What It Will Do

Generate optimized SEO metadata for all 11,436 products:

| Asset | Method | Output |
|-------|--------|--------|
| **Meta Title** | Rules-based template using: product title + top keyword + vintage + type | <60 chars, Thai-optimized |
| **Meta Description** | Extract + summarize: tasting notes + pairing + producer | <160 chars, includes vintage |
| **Image Alt Text** | Generate: wine type + vintage + color + style from product attributes | <125 chars, descriptive |
| **Product JSON-LD** | Schema.org structured data: name, price, currency, image, availability | Valid at schema.org validator |

### Key Features

✅ **Bulk Generation:** Generate all 11,436 products in 1 SQL transaction (read-only proof, then staging columns)  
✅ **Validation Gates:** Title length, meta length, currency (THB), no HTML/JS injection  
✅ **Staging Columns:** Write to `seo_meta_title_staging`, etc. (NOT live until approved)  
✅ **Approval Workflow:** Team reviews in Notion → approves → SQL promotes to live  
✅ **Schema Validation:** Auto-validate Product JSON-LD at schema.org before deploy  

### Deliverables (to build)

| File | Purpose |
|------|---------|
| `supabase/functions/generate-seo-assets/index.ts` | Edge Function: generate all metadata in bulk |
| `supabase/migrations/20260601_seo_assets_schema.sql` | Add staging columns to products table |
| `functions/validate_seo_assets.sql` | Stored procedure: quality gates + schema validation |
| `docs/PHASE2_GENERATOR_GUIDE.md` | How to run generator, review, approve, deploy |
| `notion_dashboard_template.md` | Notion dashboard for team review/approval |

### Example Output

**Product:** "Penfolds Grange 2015"

```json
{
  "seo_meta_title": "Penfolds Grange 2015 - Australian Red Wine | Wine Now",
  "seo_meta_description": "Penfolds Grange 2015: Premium Shiraz blend. Dark fruit, spice. Pair with red meat.",
  "seo_alt_text": "Penfolds Grange 2015 bottle, dark red wine from Barossa Valley",
  "seo_jsonld_product": {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Penfolds Grange 2015",
    "image": "https://cdn.wine-now.com/penfolds-grange-2015.jpg",
    "description": "Premium Australian Shiraz blend...",
    "brand": { "@type": "Brand", "name": "Penfolds" },
    "offers": {
      "@type": "Offer",
      "currency": "THB",
      "price": "2500",
      "availability": "https://schema.org/InStock"
    }
  }
}
```

### Rules (Phase 2 Build)

**Meta Title Template:**
```
[Product Title] [Vintage] - [Wine Type] | Wine Now
Max 60 chars. If too long: [Short Name] [Vintage] | Wine Now Thai
```

**Meta Description Template:**
```
[Product Name] [Vintage]: [Tasting notes]. [Pairing]. [Producer/Region].
Max 160 chars.
```

**Image Alt Text Template:**
```
[Wine Type] [Vintage] from [Region], [Color] wine, [Style] taste
Max 125 chars.
```

**JSON-LD Schema:**
```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "[product_title]",
  "description": "[seo_meta_description]",
  "image": "[product_image_url]",
  "brand": { "@type": "Brand", "name": "[producer]" },
  "offers": {
    "@type": "Offer",
    "currency": "THB",
    "price": "[thai_price]",
    "availability": "[InStock|OutOfStock]"
  }
}
```

### Quality Gates (Phase 2)

Before any metadata goes live, validation must pass:

```sql
-- Gate 1: Length checks
Title: 30-60 chars
Meta: 50-160 chars
Alt text: 20-125 chars

-- Gate 2: No injection
NO HTML, JavaScript, or malicious content

-- Gate 3: Currency
All prices in THB (Thai Baht)

-- Gate 4: Schema validity
JSON-LD passes schema.org/Product validation

-- Gate 5: URL integrity
All product URLs exist in catalog
All image URLs are reachable (200 status)
```

### Approval Workflow

1. **Run Generator:** `supabase functions invoke generate-seo-assets`
   - Writes to staging columns: `seo_meta_title_staging`, etc.
   - Validation report: ✅ 11,436/11,436 passed

2. **Review in Notion:** Team checks sample products (10-20 random)
   - ✅ Titles sound good
   - ✅ Descriptions are accurate
   - ✅ Schema is valid
   - ❌ Flag any issues

3. **Approve & Deploy:** SQL promotes staging → live
   ```sql
   UPDATE products SET
     seo_meta_title = seo_meta_title_staging,
     seo_meta_description = seo_meta_description_staging,
     seo_alt_text = seo_alt_text_staging,
     seo_jsonld_product = seo_jsonld_product_staging
   WHERE seo_meta_title_staging IS NOT NULL;
   ```

4. **Export for Magento:** Generate CSV ready for upload
   - Columns: SKU, Meta Title, Meta Description, Alt Text
   - 11,436 rows
   - Ready for manual Magento import (your current workflow)

---

## Phase 3: Deploy + Measure (4-5 hours)

**Status:** 🔄 Pending Phase 2 completion

### What It Will Do

Deploy metadata to Magento, track results, auto-rollback if regressions:

1. **Magento Upload (manual):** You upload Phase 2 CSV → metadata live
2. **Rich Results Check (24 hrs):** Validate JSON-LD appears in Google Search
3. **Daily Measurement (7 days):** Track position/CTR changes in #seo-dashboard
4. **Auto-Rollback (if needed):** If CTR drops >15%, revert to previous version

### Deliverables (to build)

| File | Purpose |
|------|---------|
| `functions/magento-upload-guide.md` | Step-by-step: CSV format → Magento import |
| `functions/validate-rich-results.ts` | Check JSON-LD in Google Search Index |
| `docs/PHASE3_MEASUREMENT_GUIDE.md` | How to monitor + measure impact |

### Measurement Dashboard (Post-Deploy)

**Slack #seo-measurement channel (daily for 7 days):**
```
📊 SEO Impact Report — Day 1 (May 31, 2026)

POSITION CHANGES:
✅ Improved: 142 keywords (+0.5 avg positions)
⚠️ Declined: 23 keywords (-1.2 avg positions)
➡️ Stable: 122 keywords (no change)

CTR CHANGES:
✅ Improved: 156 keywords (+0.3% avg CTR)
⚠️ Declined: 18 keywords (-0.2% avg CTR)

TRAFFIC IMPACT:
📈 Sessions: +2.1% vs baseline (vs last week)
📈 Users: +1.8% vs baseline
📈 Goal Completions: +3.2% vs baseline

Status: ✅ ON TRACK (no regressions detected)
```

---

## Technical Architecture

### Database Schema (Phase 1 + 2)

```
products (existing)
├── id, sku, title_en, producer, vintage
├── thai_price, stock_status
├── seo_meta_title ← Phase 2
├── seo_meta_description ← Phase 2
├── seo_alt_text ← Phase 2
└── seo_jsonld_product ← Phase 2

seo_gsc_daily (Phase 1)
├── product_id, keyword, position, impressions, clicks, ctr
└── date, synced_at

seo_ga4_daily (Phase 1)
├── product_id, page_path, users, sessions, pageviews
└── date, synced_at

seo_opportunities (Phase 1)
├── product_id, keyword, current_position, current_ctr, impressions
└── detected_at, resolved_at

seo_regression_alerts (Phase 1)
├── product_id, keyword, regression_type, change_percent
└── alert_sent, alert_sent_at, resolved_at

seo_sync_log (Phase 1)
├── sync_type (gsc|ga4), status, records_imported, error_message
└── started_at, completed_at
```

### Edge Functions

```
sync-gsc-ga4/
  Purpose: Daily GSC/GA4 import (Phase 1)
  Schedule: 6 AM UTC daily
  Output: seo_gsc_daily, seo_ga4_daily

seo-slack-alerts/
  Purpose: Daily Slack summary + alerts (Phase 1)
  Schedule: 7 AM UTC daily
  Output: Slack #seo-dashboard message

generate-seo-assets/ [Phase 2]
  Purpose: Bulk generate metadata for 11,436 products
  Trigger: Manual (run on-demand) or scheduled weekly
  Output: Staging columns seo_*_staging

validate-seo-assets/ [Phase 2]
  Purpose: Quality gate: length, injection, schema validation
  Trigger: Auto-called after generation
  Output: seo_validation_report

magento-export/ [Phase 3]
  Purpose: Generate CSV for Magento upload
  Trigger: Manual after approval
  Output: seo-assets-[date].csv ready for Magento
```

---

## Timeline & Dependencies

```
Phase 1: Monitor (2-3 hrs setup)
├─ Deploy migration + functions: 15 min
├─ Connect GSC/GA4: 30 min
├─ Connect Slack: 10 min
├─ Schedule cron: 5 min
└─ Test + verify: 10 min
   ↓
   Wait 3-5 days for clean syncs, no errors
   
Phase 2: Generate (6-8 hrs build)
├─ Build generator function: 4 hrs
├─ Add staging columns: 1 hr
├─ Build validator: 1.5 hrs
├─ Set up Notion dashboard: 1 hr
└─ Test + approve workflow: 1.5 hrs
   ↓
   Run generator, team reviews, approves
   
Phase 3: Deploy + Measure (4-5 hrs)
├─ Upload to Magento: manual (your workflow)
├─ Wait 24 hrs for rich results indexing
├─ Monitor #seo-measurement for 7 days
└─ Auto-rollback if major regression
```

**Total Time to Full Automation:** 8-10 days (mostly waiting for syncs, reviews)

---

## Success Metrics

### Phase 1 (Monitoring)
- ✅ Daily Slack alerts for 7 consecutive days (no errors)
- ✅ 50-500 keywords tracked daily in seo_gsc_daily
- ✅ 100-300 pages tracked daily in seo_ga4_daily
- ✅ Regressions detected + alerted within 24 hrs

### Phase 2 (Generation)
- ✅ All 11,436 products have meta title + description + alt text + JSON-LD
- ✅ 100% pass validation gates (length, injection, schema, currency)
- ✅ Notion dashboard shows 100% coverage
- ✅ Team approves in <4 hours

### Phase 3 (Deployment)
- ✅ Rich results appear in Google Search within 48 hrs
- ✅ Position/CTR improve by avg +5% within 14 days
- ✅ No regressions (position drops <3, CTR drops <20%)
- ✅ Traffic increase: +2-5% users, +1-3% goal completions

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| GSC/GA4 API authentication fails | Pre-test credentials before cron scheduled; add retry logic |
| Slack webhook disabled | Fallback to email alerts; monitor webhook health daily |
| Generated metadata is inaccurate | Validation gates + manual team review (Notion) before deploy |
| Magento upload fails | CSV format pre-validated; test on staging first |
| Position regression post-deploy | Auto-rollback if CTR drops >15% + alert team |
| Database grows too large | Archive old seo_gsc_daily/ga4_daily after 90 days |

---

## Cost Estimate

| Component | Cost | Notes |
|-----------|------|-------|
| Supabase | $0/mo | Included in existing plan |
| Google APIs (GSC/GA4) | $0/mo | Free tier, <1M requests/mo |
| Slack webhook | $0/mo | Included in existing Slack workspace |
| Notion dashboard | $0/mo | Included in free Notion plan |
| **Total** | **$0/mo** | **All open-source / free-tier** |

---

## Next Steps

1. **Deploy Phase 1** (today):
   - Follow `docs/PHASE1_DEPLOYMENT_GUIDE.md`
   - Verify GSC/GA4/Slack connections working
   - Monitor logs for 3-5 days (watch for errors)

2. **Build Phase 2** (once Phase 1 is stable):
   - Contact Claude for generator build
   - Estimate 6-8 hrs development
   - Team reviews + approves metadata

3. **Deploy Phase 3** (after Phase 2 approved):
   - Manual Magento upload (your current workflow)
   - Monitor impact for 7-14 days
   - Measure rank/CTR/traffic improvements

---

## Support & Questions

- **Deployment Issues:** See `PHASE1_DEPLOYMENT_GUIDE.md` troubleshooting
- **Phase 2 Build:** Contact Claude → new conversation
- **Phase 3 Measurement:** See `PHASE3_MEASUREMENT_GUIDE.md` (to be written)
- **GSC/GA4 Setup:** Google APIs documentation links in Phase 1 guide
- **Slack Integration:** Slack API documentation links in Phase 1 guide

---

## Appendix: Example Opportunity Report

```sql
-- Find top 10 opportunities (high impressions, low CTR)
SELECT 
  p.id,
  p.title_en,
  g.keyword,
  g.impressions,
  g.ctr,
  ROUND(g.impressions * 0.02 - (g.clicks)::NUMERIC, 0) as estimated_missing_clicks,
  ROUND((0.05 - g.ctr) * 100, 1) as ctr_improvement_potential
FROM seo_gsc_daily g
JOIN products p ON g.product_id = p.id
WHERE 
  g.date = CURRENT_DATE
  AND g.impressions > 500
  AND g.ctr < 0.02
  AND g.position > 5
ORDER BY estimated_missing_clicks DESC
LIMIT 10;
```

**Output (example):**
```
| Product | Keyword | Impressions | CTR | Est. Missing Clicks | Potential |
|---------|---------|-------------|-----|-------------------|-----------|
| Penfolds Grange 2015 | "shiraz 2015" | 642 | 1.2% | 5.7 | 3.8% |
| Chateau Latour | "cabernet 2020" | 528 | 1.5% | 2.9 | 3.5% |
| Krug Clos d'Ambonnay | "champagne luxury" | 487 | 1.8% | 1.6 | 3.2% |
```

**Action:** Improve meta title + description for these 3 products → expect +2-5% CTR boost in 7 days.

---

**End of Design Document**  
Ready to proceed to Phase 2? Contact Claude with "Build Phase 2 SEO Generator".
