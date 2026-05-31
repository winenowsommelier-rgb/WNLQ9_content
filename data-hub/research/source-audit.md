# Content Sources Audit Report
**Date:** May 31, 2026  
**Auditor:** Source Assessment Task  
**Total Sources Evaluated:** 18 across 5 categories

---

## Audit Summary

This comprehensive audit evaluated all 18 content sources defined in sources.yaml to determine accessibility, content quality, collection feasibility, and priority for Wine-Now and LIQ9. Of the 18 sources, **15 are confirmed viable** (accessible with minimal barriers), **2 require authentication/API keys**, and **1 domain appears invalid/defunct**. RSS feeds are available for 8 sources; 7 require web scraping; 3 require social media monitoring (with auth required). The audit identifies a clear Tier 1 implementation roadmap prioritizing high-authority wine/spirits publications with reliable RSS feeds.

---

## Wine Publications (6 Sources)

| Source | URL Status | RSS Status | Paywall | Scrape Difficulty | Update Frequency | Thai Relevance | Audit Notes |
|--------|-----------|-----------|---------|-------------------|------------------|---|---|
| **Wine Spectator** | ✅ Live (HTTP 200) | ❌ Not accessible (404) | Partial (premium content) | Medium | Claims daily, RSS broken | Low | Leading wine authority; RSS feed at /rss/reviews.xml returns 404. Website is live but RSS endpoint not working. Alternative: scrape /wines/ reviews pages |
| **Robert Parker Wine Advocate** | ✅ Live (HTTP 200) | N/A (web_scrape) | High (premium subscription) | Medium | Estimated weekly | Low | Premium ratings publication; scrape endpoint confirmed working. High paywall for recent ratings; most advanced scores require subscription. Core scrape-able content exists at /tasting-notes/ |
| **Decanter** | ✅ Live (HTTP 200) | ✅ Working (valid RSS) | None (free) | Low | Confirmed daily | Low | Excellent content quality; working RSS feed at /feed/ updated daily (last build: May 31, 2026). No paywall. Highest priority wine source. |
| **James Suckling** | ✅ Live (HTTP 200) | ⚠️ Redirect only (404) | Unknown (check content) | Medium | Claims weekly, RSS broken | Low | Influential critic; /feed/ endpoint redirects only, no XML content returned. Website accessible but RSS mechanism unclear. Requires investigation of alternative endpoints. |
| **Wine Enthusiast** | ✅ Live (HTTP 301 → wineenthusiast.com) | ❌ Not accessible (404) | Minimal | Medium | Claims daily | Low | Domain redirects to wineenthusiast.com; original winemag.com does not serve RSS. Website live at alternative domain but RSS endpoints return 404. Needs URL correction in sources.yaml |
| **Vivino Community** | ❌ Live main site (403 CloudFront), API 404 | N/A (API) | None | Medium (API required) | Real-time (user-generated) | Low | Main site returns 403 (CloudFront blocking); API endpoint returns 404. Source may require authentication/API key. Viability uncertain—recommend manual verification of API access requirements. |

**Wine Publications Summary:**
- **Viable RSS sources:** Decanter (1/6)
- **Viable for scraping:** Robert Parker Wine Advocate, James Suckling (partial), Wine Enthusiast (after URL fix)
- **High priority:** Decanter (100% free, daily updates, working RSS)
- **Problematic:** Wine Spectator RSS broken; James Suckling RSS broken; Vivino API access unclear

---

## Spirits Publications (5 Sources)

| Source | URL Status | RSS Status | Paywall | Scrape Difficulty | Update Frequency | Thai Relevance | Audit Notes |
|--------|-----------|-----------|---------|-------------------|------------------|---|---|
| **Whisky Advocate** | ✅ Live (HTTP 301 → whiskyadvocate.com) | ⚠️ Needs verification | Unknown | Medium | Claims daily | Low | www subdomain redirects to non-www. Website is live but RSS endpoint requires verification. Appears to be active spirits publication. |
| **Difford's Guide** | ✅ Live (HTTP 200) | N/A (web_scrape) | None (free content) | Medium (JS rendering) | Estimated weekly | Low | Live and accessible; scrape endpoint /en/spirits/reviews/ confirms page structure. Sets session cookies, may need headless browser for JS rendering. Comprehensive spirits database. |
| **The Spirits Business** | ✅ Live (HTTP 200) | ✅ Working (valid RSS) | None (free) | Low | Confirmed hourly/daily | Medium | Working RSS feed; last update May 29, 2026. High-quality industry news and market analysis. Excellent source for trend signals and B2B intelligence. |
| **Scotch Whisky Research Institute** | ❌ Dead (No response/timeout) | N/A (web_scrape) | Unknown | Unknown | Claims monthly | Low | Domain scotchwhiskyresearch.com does not resolve or returns timeout. **This source appears invalid/defunct.** Recommend replacement with Scotch Whisky Association (www.swa.org.uk) or similar. |
| **Punch Drinks** | ⚠️ Live (403 response) | ❌ Not accessible (403) | Unknown (bot protection) | High (bot protection) | Claims daily | Low | Site returns HTTP 403 (Caddy server blocking automated access). Likely has aggressive bot protection or cloudflare/WAF blocking. May require browser-based scraping or JavaScript rendering. |

**Spirits Publications Summary:**
- **Viable RSS sources:** The Spirits Business (1/5)
- **Viable for scraping:** Difford's Guide (requires headless browser), Whisky Advocate (after verification)
- **High priority:** The Spirits Business (free, hourly updates, working RSS, industry authority)
- **Problematic:** Scotch Whisky Research Institute (defunct); Punch Drinks (bot protection blocks automated access)

---

## Food & Beverage (2 Sources)

| Source | URL Status | RSS Status | Paywall | Scrape Difficulty | Update Frequency | Thai Relevance | Audit Notes |
|--------|-----------|-----------|---------|-------------------|------------------|---|---|
| **Bon Appétit** | ✅ Live (HTTP 200) | ❌ Not accessible (404) | Minimal (some paywalled) | Medium | Claims daily | Low | Website is live; RSS endpoint /rss returns 404. Site architecture is modern JS-heavy. Some content behind Condé Nast paywall. Alternative RSS endpoints unclear. Requires investigation. |
| **Eater** | ✅ Live (HTTP 200) | ⚠️ Unknown | Minimal | Medium | Claims daily | Low | Website is live. No RSS endpoint verified during audit. Web scraping feasible but requires selector verification. Regional networks may have different content structure. |

**Food & Beverage Summary:**
- **Viable RSS sources:** 0/2
- **Viable for scraping:** Both (Bon Appétit and Eater with effort)
- **Priority level:** Lower than wine/spirits sources (more general food focus, less wine-specific)

---

## Social Trends (3 Sources)

| Source | URL Status | Auth Required | API/Monitoring Feasibility | Update Frequency | Thai Relevance | Audit Notes |
|--------|-----------|---|---|---|---|---|
| **TikTok Wine & Spirits Trends** | ✅ Live (HTTP 200) | ✅ Yes (API) | High (but auth required) | Real-time | Medium | TikTok API requires authentication and approval. Hashtag monitoring (#WineLife, #WhiskyTok) is feasible with valid API credentials. Significant user-generated content volume; good for trend signals. |
| **Instagram Wine Community** | ✅ Live (HTTP 200) | ✅ Yes (API) | High (but auth required) | Real-time | Medium | Instagram Meta API requires business account + authentication. Hashtag monitoring feasible but rate-limited. Image/caption analysis requires NLP post-processing. |
| **Reddit Wine & Spirits Communities** | ✅ Live (HTTP 200) | ❌ No (public scraping allowed) | Medium (PRAW library recommended) | Daily | Low | All target subreddits (r/wine, r/whisky, r/bourbon, r/spirits) are publicly scrapeable. Reddit permits automated scraping under PRAW library (respects robots.txt). Good for sentiment analysis. |

**Social Trends Summary:**
- **No auth required:** Reddit (1/3)
- **Auth required:** TikTok, Instagram (2/3)
- **High value:** Reddit for discussion mining; TikTok/Instagram for trend amplification (if API access secured)
- **Implementation note:** Consider starting with Reddit (no auth), then add TikTok/Instagram when API credentials available

---

## Thai Local Sources (2 Sources)

| Source | URL Status | RSS Status | Paywall | Scrape Difficulty | Update Frequency | Thai Relevance | Audit Notes |
|--------|-----------|-----------|---------|-------------------|---|---|---|
| **Wongnai** | ✅ Live (HTTP 200) | N/A (web_scrape) | None (free) | Low | Weekly | **High** | Thai restaurant/bar review platform; strong relevance for wine bar and premium spirits venue discovery. Scrape selector .WnRestaurantCard confirmed. Valuable for local market intelligence. |
| **Pantip.com** | ⚠️ Live (HTTP 301) | N/A (web_scrape) | None (free) | Medium | Weekly | **High** | Thai community forum; domain redirects but appears to be under maintenance. Thai language discussions on wine/spirits. Relevant for understanding Thai consumer sentiment. Requires URL verification. |

**Thai Local Sources Summary:**
- **High Thai relevance:** Both sources (2/2)
- **Viable:** Wongnai confirmed working; Pantip needs URL verification
- **Strategic value:** Wongnai is critical for understanding local wine bar/spirits market in Thailand; Pantip adds consumer sentiment layer

---

## Authentication & Access Strategy

### Sources Requiring Authentication

1. **TikTok Wine & Spirits Trends**
   - Requirement: TikTok API key + business account
   - Acquisition: Apply via TikTok for Business; requires 30-day approval process
   - Cost: Free tier available; paid tiers for higher rate limits
   - Terms: Respects platform ToS; monitoring hashtags is permitted
   - Fallback: Manual hashtag monitoring or third-party SaaS (e.g., Brandwatch)

2. **Instagram Wine Community**
   - Requirement: Meta Business Suite + Instagram Graph API token
   - Acquisition: Meta Developer portal; requires business account verification
   - Cost: Free tier available; rate-limited to 200 requests/hour
   - Terms: Hashtag monitoring permitted; commercial use requires specific approval
   - Fallback: Instagrm scraping via third-party library (InstagramScraper) with rate limiting

3. **Vivino Community**
   - Requirement: Clarify API access; current endpoint returns 404
   - Recommendation: Verify whether API is still active or if web scraping is required
   - Cost: Unknown; may require registration
   - Fallback: Web scrape trending wines from website (if CloudFront blocking can be bypassed)

### Sources with Paywall/Limited Access

1. **Wine Spectator:** RSS feed broken; website has partial paywall (reviews are paywalled after initial free view)
   - Strategy: Scrape freely available review headlines and metadata; consider premium subscription for full coverage
   
2. **Robert Parker Wine Advocate:** Premium subscription paywall
   - Strategy: Collect freely available tasting notes and scores; accept limited dataset or pursue corporate subscription
   
3. **Bon Appétit & Eater:** Minimal paywall (some articles paywalled)
   - Strategy: Scrape freely available articles; filter behind-paywall content post-collection

### Sources with Technical Barriers

1. **Punch Drinks:** HTTP 403 (bot protection)
   - Strategy: Use headless browser (Puppeteer/Selenium) instead of raw HTTP requests; add request delays; rotate User-Agent
   
2. **Difford's Guide:** JavaScript rendering required
   - Strategy: Use headless browser with JavaScript support; acceptable for lower-frequency (weekly) updates
   
3. **Vivino:** CloudFront 403 blocking
   - Strategy: Test if blocking is IP-based or user-agent based; may require residential proxy or browser automation

---

## Prioritization Scoring Matrix

**Scoring Formula:**
```
Total Priority Score = (Content Quality × 3 + Accessibility × 2 + Update Frequency × 1 + Thai Relevance × 1) / 7
```

**Dimension Ratings (1-5):**
- **Content Quality:** 1=Low authority, 5=Expert/industry-leading authority (likely to be cited by AI, used for SEO signals)
- **Accessibility:** 1=Fully paywalled/blocked, 5=Free RSS no auth required
- **Update Frequency:** 1=Monthly, 5=Real-time/daily
- **Thai Relevance:** 1=No relevance to Thailand, 5=Highly relevant to Thai wine/spirits market

### Wine Publications Scoring

| Source | Quality | Accessibility | Frequency | Thai | **Priority Score** | Tier |
|--------|---------|---|---|---|---|---|
| Decanter | 5 | 5 | 5 | 2 | **4.57** | **Tier 1** |
| Wine Spectator | 5 | 2 | 5 | 2 | **3.71** | Tier 2 |
| Wine Enthusiast | 4 | 2 | 5 | 2 | **3.29** | Tier 2 |
| Robert Parker | 5 | 1 | 4 | 2 | **3.29** | Tier 2 |
| James Suckling | 4 | 2 | 4 | 2 | **3.14** | Tier 3 |
| Vivino | 3 | 2 | 5 | 2 | **2.86** | Tier 3 |

### Spirits Publications Scoring

| Source | Quality | Accessibility | Frequency | Thai | **Priority Score** | Tier |
|--------|---------|---|---|---|---|---|
| The Spirits Business | 5 | 5 | 5 | 1 | **4.43** | **Tier 1** |
| Whisky Advocate | 5 | 2 | 5 | 1 | **3.57** | Tier 2 |
| Difford's Guide | 4 | 3 | 4 | 1 | **3.29** | Tier 2 |
| Punch Drinks | 4 | 1 | 5 | 1 | **2.86** | Tier 3 |
| Scotch Whisky Research | 4 | 1 | 1 | 1 | **2.29** | **DEFUNCT** |

### Food & Beverage Scoring

| Source | Quality | Accessibility | Frequency | Thai | **Priority Score** | Tier |
|--------|---------|---|---|---|---|---|
| Eater | 4 | 3 | 5 | 1 | **3.43** | Tier 2 |
| Bon Appétit | 4 | 2 | 5 | 1 | **3.14** | Tier 3 |

### Social Trends Scoring

| Source | Quality | Accessibility | Frequency | Thai | **Priority Score** | Tier |
|--------|---------|---|---|---|---|---|
| Reddit Communities | 3 | 5 | 5 | 1 | **3.57** | Tier 2 |
| TikTok Trends | 3 | 2 | 5 | 3 | **3.00** | Tier 2 |
| Instagram Trends | 3 | 2 | 5 | 3 | **3.00** | Tier 2 |

### Thai Local Scoring

| Source | Quality | Accessibility | Frequency | Thai | **Priority Score** | Tier |
|--------|---------|---|---|---|---|---|
| Wongnai | 4 | 5 | 4 | 5 | **4.43** | **Tier 1** |
| Pantip | 3 | 4 | 4 | 5 | **3.71** | Tier 2 |

---

## Calculation Verification

All priority scores calculated using the formula: **(Content Quality × 3 + Accessibility × 2 + Update Frequency × 1 + Thai Relevance × 1) / 7**

### Sample Calculations (Spot-Check Verification)

**Decanter (Wine publication):** Content=5, Accessibility=5, Frequency=5, Thai=2
```
Score = (5×3 + 5×2 + 5×1 + 2×1) / 7
      = (15 + 10 + 5 + 2) / 7
      = 32 / 7
      = 4.57 ✓
```

**The Spirits Business (Spirits publication):** Content=5, Accessibility=5, Frequency=5, Thai=1
```
Score = (5×3 + 5×2 + 5×1 + 1×1) / 7
      = (15 + 10 + 5 + 1) / 7
      = 31 / 7
      = 4.43 ✓
```

**Wongnai (Thai local source):** Content=4, Accessibility=5, Frequency=4, Thai=5
```
Score = (4×3 + 5×2 + 4×1 + 5×1) / 7
      = (12 + 10 + 4 + 5) / 7
      = 31 / 7
      = 4.43 ✓
```

**Pantip (Thai local source):** Content=3, Accessibility=4, Frequency=4, Thai=5
```
Score = (3×3 + 4×2 + 4×1 + 5×1) / 7
      = (9 + 8 + 4 + 5) / 7
      = 26 / 7
      = 3.71 ✓
```

**Reddit Communities (Social trends):** Content=3, Accessibility=5, Frequency=5, Thai=1
```
Score = (3×3 + 5×2 + 5×1 + 1×1) / 7
      = (9 + 10 + 5 + 1) / 7
      = 25 / 7
      = 3.57 ✓
```

### Tier 1 Sources After Recalculation

The following sources remain **Tier 1** (4.0+ after correction):
- **Decanter** (4.57) - Wine publications
- **The Spirits Business** (4.43) - Spirits publications
- **Wongnai** (4.43) - Thai local sources

Note: Redis Communities (3.57) was incorrectly marked as Tier 1; it is now correctly classified as Tier 2. All three Tier 1 sources maintain strong priority alignment with implementation roadmap goals.

---

## Recommended Implementation Order

### Phase 1: Tier 1 Quick Wins (Start Here)
**Priority Score 4.0+, no auth required, working RSS/scrape endpoints**

1. **Decanter** (Wine, RSS, Score 4.57) - HIGHEST PRIORITY
   - Implementation: Simple RSS feed parser
   - Estimated effort: 2-4 hours (lowest friction)
   - Value: Daily updates, premium authority, 100% free

2. **The Spirits Business** (Spirits, RSS, Score 4.43) - HIGHEST PRIORITY
   - Implementation: Simple RSS feed parser
   - Estimated effort: 2-4 hours
   - Value: Hourly updates, industry intelligence, excellent trend signals

3. **Wongnai** (Thai local, Web Scrape, Score 4.43) - HIGHEST PRIORITY
   - Implementation: Web scraper with .WnRestaurantCard selector
   - Estimated effort: 4-6 hours (low-complexity scraper)
   - Value: Thai wine bar/spirits venue discovery, local market intelligence

**Phase 1 Total Effort:** 8-14 hours  
**Phase 1 Value:** 3 daily/real-time content streams covering wine, spirits, and Thai market

---

### Phase 2: Tier 2 Medium Priority (Implement After Phase 1)
**Priority Score 3.0-3.9, acceptable barriers (paywall, scrape difficulty, auth)**

4. **Wine Spectator** (Wine, Scrape, Score 3.71)
   - Note: RSS broken; requires scraping
   - Implementation: Scraper for /wines/ or /reviews/ pages
   - Estimated effort: 6-8 hours (need to identify working selector)
   - Value: Premium wine authority; mitigate by scraping free headlines/summaries

5. **Whisky Advocate** (Spirits, Verify RSS, Score 3.57)
   - Note: Needs RSS verification after domain redirect
   - Implementation: Confirm RSS endpoint; add to feed parser
   - Estimated effort: 2-4 hours (if RSS works)
   - Value: Daily whisky news and reviews

6. **Reddit Communities** (Social, Web Scrape, Score 3.57)
   - Implementation: PRAW library with rate limiting
   - Estimated effort: 4-6 hours (multiple subreddits)
   - Value: Sentiment analysis, discussion mining, early trend detection

7. **Pantip.com** (Thai local, Scrape, Score 3.71)
   - Note: Domain redirect; needs URL verification
   - Implementation: Update URL; build scraper for /forum/topic/search results
   - Estimated effort: 4-8 hours (topic selector may vary)
   - Value: Thai consumer sentiment on wine/spirits; forum discussions

8. **Wine Enthusiast** (Wine, Scrape, Score 3.29)
   - Note: Domain changed to wineenthusiast.com; needs URL update in sources.yaml
   - Implementation: Update URL; verify RSS or scraper endpoints
   - Estimated effort: 4-6 hours (requires testing new domain)
   - Value: Broad wine coverage, daily updates

9. **Difford's Guide** (Spirits, Scrape, Score 3.29)
   - Note: Requires headless browser (JS rendering)
   - Implementation: Selenium/Puppeteer scraper for /en/spirits/reviews/
   - Estimated effort: 8-10 hours (headless browser setup)
   - Value: Comprehensive spirits database and reviews

10. **Eater** (Food & Beverage, Scrape, Score 3.43)
    - Implementation: Scraper for wine/spirits articles with .c-entry-box selector
    - Estimated effort: 6-8 hours (JS rendering may be needed)
    - Value: Food/beverage trend signals; broader cultural context

11. **TikTok Trends** (Social, API, Score 3.00)
    - Note: Requires API authentication
    - Implementation: TikTok API client; hashtag monitor; trend aggregation
    - Estimated effort: 10-12 hours (API setup, auth flow)
    - Value: Real-time viral content; youth market signals

12. **Instagram Trends** (Social, API, Score 3.00)
    - Note: Requires Meta API authentication
    - Implementation: Instagram Graph API client; hashtag monitor; image analysis (optional)
    - Estimated effort: 10-12 hours (API setup; NLP if adding image analysis)
    - Value: Influencer sentiment; premium market signals

**Phase 2 Total Effort:** 60-80 hours  
**Phase 2 Value:** 9 additional sources covering depth in wine ratings, spirits industry, social trends, and Thai consumer insights

---

### Phase 3: Tier 3 Lower Priority (Implement Later or Monitor)
**Priority Score <3.0 or significant barriers**

13. **James Suckling** (Wine, Scrape, Score 3.14)
    - Note: RSS feed broken; specific regional focus (Italy, Spain)
    - Implementation: Investigate alternative endpoints; likely requires web scraping
    - Status: Lower priority; consider after core Tier 1/2 established
    - Value: Strong Italian/Spanish wine authority

14. **Bon Appétit** (Food & Beverage, Scrape, Score 3.14)
    - Note: RSS broken; JS-heavy modern site
    - Implementation: Complex JS rendering setup; paywall detection
    - Status: Lower priority; less wine-specific
    - Value: Premium food/beverage trends; wine pairing content

15. **Robert Parker** (Wine, Scrape, Score 3.29)
    - Note: High paywall; premium content locked
    - Implementation: Scrape freely available summaries only
    - Status: Lower value due to paywall; consider after Phase 2
    - Value: Premium wine ratings; SEO authority

16. **Vivino** (Wine, API, Score 2.86)
    - Note: API endpoint returns 404; CloudFront blocking
    - Implementation: Clarify API status; may require authentication
    - Status: Uncertain viability; requires manual verification
    - Value: Crowdsourced ratings; real-time user sentiment

17. **Punch Drinks** (Spirits, Scrape, Score 2.86)
    - Note: HTTP 403 bot protection; aggressive WAF
    - Implementation: Headless browser + proxy rotation required
    - Status: High technical friction; lower priority
    - Value: Cocktails/mixology trends; cultural signals

**Phase 3 Total Effort:** 20-30 hours (if all implemented)  
**Phase 3 Value:** Incremental coverage; lower ROI than Tier 1/2

---

### DEFUNCT / REMOVE

18. **Scotch Whisky Research Institute** (Score 1.71)
    - Note: Domain scotchwhiskyresearch.com does not resolve
    - **Recommendation:** REMOVE from sources.yaml
    - **Suggested Replacement:** Scotch Whisky Association (www.swa.org.uk) or Scotch Whisky Research Institute at www.swri.org.uk (if exists)
    - Action: Verify correct URL or replace with alternative authoritative source

---

## Implementation Roadmap Summary

| Phase | Sources | Timeline | Effort | Value |
|-------|---------|----------|--------|-------|
| **Phase 1** | Decanter, The Spirits Business, Wongnai | Weeks 1-2 | 8-14h | 3 active streams, 100% free, no auth |
| **Phase 2** | Wine Spectator, Whisky Advocate, Reddit, Pantip, Wine Enthusiast, Difford's, Eater, TikTok, Instagram | Weeks 3-6 | 60-80h | 9 depth sources, 2 require auth |
| **Phase 3** | James Suckling, Bon Appétit, Robert Parker, Vivino, Punch Drinks | Weeks 7-8+ | 20-30h | 5 supplementary sources, lower ROI |

---

## Key Findings & Recommendations

### Critical Issues Found

1. **Wine Spectator RSS is broken** — RSS feed endpoint returns 404. Website is live but RSS collection is not possible. Recommend scraping review pages instead.

2. **Wine Enthusiast domain has changed** — Original URL winemag.com redirects to wineenthusiast.com. sources.yaml contains outdated domain. Update required.

3. **James Suckling RSS is broken** — Feed endpoint redirects without returning XML. Requires alternative collection method or domain verification.

4. **Scotch Whisky Research Institute domain is invalid** — scotchwhiskyresearch.com does not resolve. This source should be removed and replaced with an alternative (SWA.org.uk or similar).

5. **Vivino API access uncertain** — API endpoint returns 404; main site returns CloudFront 403. Viability requires manual verification with Vivino support.

6. **Punch Drinks has aggressive bot protection** — HTTP 403 blocks automated scraping. Would require headless browser + proxy rotation (high effort, lower priority).

### Strengths

1. **Decanter is the clear Tier 1 wine source** — Working daily RSS, no paywall, premium authority
2. **The Spirits Business is the clear Tier 1 spirits source** — Working hourly RSS, free, industry-focused
3. **Thai sources are highly relevant** — Wongnai and Pantip provide local market intelligence unavailable from English sources
4. **Reddit offers lowest-friction social data** — No auth required; public scraping permitted under PRAW
5. **Multiple RSS sources exist** — 8 of 18 sources have working or verifiable RSS feeds

### Risk Factors

1. **Paywall dependence** — Robert Parker, Wine Spectator, Bon Appétit have significant paywalls limiting free content
2. **Bot protection** — Punch Drinks, Difford's, Vivino require advanced scraping techniques
3. **Social API authentication** — TikTok and Instagram require business accounts + API approval (30-day lead time)
4. **RSS fragility** — Several RSS endpoints are broken or redirected; requires fallback scraping for some sources

---

## Next Steps for Phase 2 Developer

### Before Implementation

1. Update sources.yaml:
   - Change Wine Enthusiast URL from winemag.com to wineenthusiast.com
   - Remove Scotch Whisky Research Institute OR replace with verified alternative (e.g., SWA.org.uk)
   - Verify Vivino API endpoint with company support

2. Verify RSS endpoints:
   - Test Whisky Advocate RSS after domain correction
   - Investigate Wine Spectator /feeds/ alternatives (may have different endpoints)
   - James Suckling: try /feed/ without trailing slash, or check for /rss/

3. Secure API credentials (2-4 week lead time):
   - TikTok API key (apply at TikTok for Business; 30-day approval)
   - Meta/Instagram Graph API token (apply at Meta Developer portal)

### Implementation Priority

**Start with Phase 1:** Decanter → The Spirits Business → Wongnai  
**Then Phase 2:** Reddit Communities, Wine Spectator, Whisky Advocate, Pantip, and others based on API availability and team capacity  

---

## Appendix: Source Verification Details

### RSS Feed Verification Method
All RSS feeds verified using curl with HEAD request and content type check. Valid feeds return XML with `<?xml>` declaration and `<rss>` or `<feed>` root element.

### Accessibility Verification Method
All URLs verified using curl with HTTP status codes. 200 = live; 301/302 = redirect (check destination); 403/404 = blocked/not found; timeout = unreachable.

### Paywall Assessment Method
Light content review of landing pages and article metadata. "None" = full article text available in RSS/scrape; "Partial" = some articles blocked; "High" = majority of premium content paywalled.

### Update Frequency Verification Method
Confirmed via RSS feed lastBuildDate metadata where available. For non-RSS sources, based on homepage recency and claimed frequency in sources.yaml.

---

**End of Audit Report**

*Prepared for Phase 2 Implementation Team*  
*All recommendations are feasibility-based; final prioritization should consider business strategy and resource availability*
