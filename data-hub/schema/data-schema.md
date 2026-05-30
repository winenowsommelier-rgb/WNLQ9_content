# Content Hub Data Schema

## Overview

This schema defines the structure for all articles collected by the automated content pipeline. Every article indexed by the system must conform to this schema, enabling consistent downstream processing for SEO/AEO analysis, competitive intelligence, trend detection, and content strategy.

The schema is designed to support:
- Wine and spirits publications (primary focus)
- Food/beverage coverage
- Social media trend monitoring
- Thai local sources
- Multi-language content

---

## Core Fields (All Articles)

| Field Name | Type | Required | Length Limit | Description | Example |
|---|---|---|---|---|---|
| `article_id` | UUID | Yes | — | Unique identifier for the article; generated as hash(source_name + article_url) to ensure idempotence | `a7f3d8c1-2b9e-4e5f-9a2d-8f1c6b3a5e7d` |
| `source_name` | String | Yes | 100 | Name of the publication/source; must match exactly one entry in sources.yaml | `Wine Spectator`, `Whisky Advocate` |
| `source_url` | URL | Yes | 2000 | Homepage/base URL of the source | `https://www.winespectator.com` |
| `article_url` | URL | Yes | 2000 | Direct URL to the article; serves as canonical identifier | `https://www.winespectator.com/articles/2024-cabernet-review` |
| `title` | String | Yes | 300 | Article headline/title | `2024 California Cabernets: 15 Wines Under $50` |
| `published_date` | ISO 8601 | Yes | — | Date article was published (or posted online); in UTC | `2024-05-15T09:30:00Z` |
| `author` | String | No | 200 | Author name(s); may be empty for unsigned pieces or social posts | `James Suckling`, `Editorial Team` |
| `content_excerpt` | Text | Yes | 500 | 300–500 character summary of the article's main point; extracted or provided by source | `Parker's latest vintage report shows strong Bordeaux performance with emerging Chilean producers outpacing expectations.` |
| `content_type` | Enum | Yes | — | Article format; must be one of: blog, news, review, spotlight, guide, opinion, research, video | `review` |
| `article_length_words` | Integer | No | — | Approximate word count of full article if available | `1200` |
| `primary_keyword` | String | Yes | 200 | Single main keyword or keyphrase the article targets; used for SEO alignment | `Cabernet Sauvignon 2024` |
| `keywords_secondary` | Array[String] | No | 5 items max | 1–5 additional relevant keywords | `["Napa Valley", "wine reviews", "budget wines"]` |

---

## Wine & Spirits Classification Fields

| Field Name | Type | Required | Constraints | Description | Example |
|---|---|---|---|---|---|
| `topic_region` | Enum | Conditional | Must be from regions_wine or regions_spirits depending on `primary_category` | Geographic region of focus; NULL if content is not region-specific | `France`, `Napa Valley (California)`, `Scotland` |
| `spirits_type` | Enum | Conditional | Required if `primary_category` = "spirits"; otherwise NULL | Category of spirits: whisky, gin, rum, vodka, tequila, mezcal, brandy, cognac, other | `whisky` |
| `wine_variety` | String | Conditional | Required if `primary_category` = "wine"; otherwise NULL | Grape variety or wine blend; pipe-separated if multiple (e.g., "Cabernet Sauvignon\|Merlot") | `Cabernet Sauvignon`, `Pinot Noir\|Chardonnay` |
| `vintage_year` | Year | Conditional | 1900–2024; NULL if vintage-agnostic | Wine or spirits vintage year; NULL if article discusses non-vintage or multiple vintages | `2021`, `2019` |
| `primary_category` | Enum | Yes | wine, spirits, food_beverage, cultural, other | Major classification of the article's subject matter | `wine`, `spirits` |

---

## SEO & Content Strategy Fields

| Field Name | Type | Required | Constraints | Description | Example |
|---|---|---|---|---|---|
| `buyer_persona` | Enum | Yes | casual_drinker, enthusiast, collector | Target audience segment | `enthusiast` |
| `trend_signals` | Array[Enum] | Yes | 1+ from taxonomy.trend_signals | Array of trend indicators present in the article; enables trend aggregation | `["emerging_region", "award_winning", "sustainability_focus"]` |
| `search_volume_estimate` | Enum | No | high, medium, low, unknown | Estimated search volume for primary_keyword; may be unknown if not in SEO tools | `medium` |
| `link_building_potential` | Enum | No | high, medium, low | Likelihood that this article is worth backlinking to or citing | `high` |
| `aeo_citation_opportunity` | Enum | No | high, medium, low | Potential to cite/reference this article in AI-generated content (e.g., ChatGPT, Claude) | `medium` |
| `competitor_mention` | Boolean | No | — | TRUE if article mentions Wine-Now or LIQ9 competitors; else FALSE or NULL | `true` |
| `ai_citation_probability` | Decimal | No | 0.0–1.0 | ML-derived score (0–1) indicating likelihood that LLMs will cite/reference this article | `0.78` |

---

## Metadata & Processing Fields

| Field Name | Type | Required | Constraints | Description | Example |
|---|---|---|---|---|---|
| `collected_date` | ISO 8601 | Yes | — | Date the article was collected by the pipeline; in UTC | `2024-05-16T14:22:00Z` |
| `source_language` | ISO 639-1 | No | en, th, es, fr, de, it, ja, zh, etc. | Language of the article content | `en`, `th` |
| `content_freshness_days` | Integer | No | 0–9999 | Days since publication at time of collection; calculated field | `1` |
| `media_present` | Boolean | No | — | TRUE if article contains images, video, or multimedia | `true` |
| `media_url` | URL | No | 2000 | URL of primary image/video associated with article if available | `https://example.com/image-2024-cabernet.jpg` |
| `notes` | Text | No | 500 | Free-form notes by data curator or pipeline; e.g., paywalled content, quality flags | `Behind paywall; review summary available in excerpt.` |

---

## Field Constraints & Validation Rules

### String Fields
- Trim whitespace before storage
- Replace multiple spaces with single space
- Escape special characters (quotes, newlines) in JSON/CSV export
- Length limits are hard maximums; truncate if necessary

### URL Fields
- Must be valid HTTP(S) URLs
- Canonical form: ensure no trailing slashes or query params unless meaningful
- article_url must be unique within the system (natural key for idempotence)

### Date/Timestamp Fields
- ISO 8601 format required: `YYYY-MM-DDTHH:MM:SSZ`
- All dates in UTC
- published_date must be ≤ collected_date (logical constraint)

### Enum Fields
- Case-sensitive; must match exactly one value from taxonomy.json
- Invalid enum values should trigger validation error during ingest
- NULL/empty is allowed only where specified "Conditional"

### Arrays
- Stored as JSON arrays in databases
- Pipe-separated strings in CSV export (e.g., `"wine_variety"`: `Cabernet|Merlot`)
- Order matters for trend_signals: primary trend first

### Decimal Fields
- Precision: 2 decimal places minimum for scores
- Range constraints: 0.0–1.0 for probabilities
- NULL allowed if not computed

---

## Indexing & Search Strategy

### Primary Indexes
- `article_url` (unique): ensures deduplication
- `source_name + published_date`: enables source-specific trending
- `primary_keyword + topic_region`: SEO analysis
- `primary_category + topic_region + published_date`: cross-category trending

### Secondary Indexes
- `trend_signals` (array): aggregation of trend occurrences
- `buyer_persona + primary_category`: audience segmentation
- `published_date DESC`: chronological feeds
- `ai_citation_probability DESC`: high-value content ranking

### Full-Text Search
- Index: title, content_excerpt, primary_keyword, keywords_secondary
- Enable for trend discovery and competitive monitoring

---

## Wine-Specific Conventions

- Region taxonomy: Use values from `regions_wine` in taxonomy.json
  - US wines: Specify state (e.g., `California`, `Oregon`, `Washington`)
  - Old World: Use country (e.g., `France`, `Italy`, `Spain`)
  - Emerging: `Emerging - [Country]` for non-traditional producers
- Vintage year: May be omitted for articles about wine styles or current-release collections (set to NULL)
- Wine variety: Always singular or pipe-separated; e.g., `Cabernet Sauvignon`, `Pinot Noir|Chardonnay`

---

## Spirits-Specific Conventions

- Region taxonomy: Use values from `regions_spirits` in taxonomy.json
- Spirits type: Required for all spirits articles (whisky, gin, rum, etc.)
- Vintage year: Applies primarily to whiskies and aged spirits; NULL for most gins, vodkas, tequilas
- Age statement: Stored in notes field if relevant (e.g., "12-year-old Highland scotch")

---

## Social Media Fields (Optional Extensions)

For TikTok, Instagram, Reddit monitoring:
- Add optional `original_post_id` (social platform post ID)
- Add optional `engagement_metrics` (views, likes, shares)
- Add optional `social_platform` (tiktok, instagram, reddit)
- Map these into standard fields above; content_excerpt becomes caption

---

## Data Validation Checklist

Before ingesting any article, the pipeline MUST verify:

- [ ] `article_id` is unique (hash check)
- [ ] `article_url` is valid and unique
- [ ] `published_date` ≤ `collected_date`
- [ ] `source_name` exists in sources.yaml
- [ ] `content_type` is a valid enum
- [ ] `primary_category` is a valid enum
- [ ] If `primary_category` = "wine": `wine_variety` is NOT NULL
- [ ] If `primary_category` = "spirits": `spirits_type` is NOT NULL
- [ ] `trend_signals` array is non-empty and all values are valid enums
- [ ] `buyer_persona` is a valid enum
- [ ] `content_excerpt` is 300–500 characters
- [ ] `source_language` is valid ISO 639-1 (if provided)
- [ ] All URL fields are valid HTTP(S)
- [ ] Decimal fields (e.g., `ai_citation_probability`) are 0.0–1.0

---

## Version History

- **v1.0** (2024-05-16): Initial schema definition for Task 1 of Content Trend Data Hub
