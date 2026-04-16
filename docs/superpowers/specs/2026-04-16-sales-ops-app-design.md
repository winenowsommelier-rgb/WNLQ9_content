# Sales Ops App — Design Specification

**Project:** WNLQ9 Sales Operations & Win-Back Campaign Tool
**Date:** 2026-04-16
**Status:** Reviewed — pending user approval
**Owner:** Sales Director / Management
**Team:** YUI (Closer), BOO (Big Ticket Seller), MIE (Lead Generator)
**Review:** Spec review passed — 5 critical, 8 major, 8 minor issues resolved (see appendix)

---

## 1. Problem Statement

Wine-Now & LIQ9 has a 3-person sales team that currently:

- Performs **zero outbound activity** (purely reactive, responding to inbound tickets via Zoho Desk)
- Has **no upsell/cross-sell process** (upsell rate near 0%)
- Has **no system** to track sales performance beyond a weekly Google Sheet
- Has **1,340 lapsed high-value customers** (At Risk / Hibernating) with no recovery campaign
- Operates at approximately **50-60% of revenue potential** (team KPI grade: D Critical)

The team has the talent — YUI is a strong closer (score 70), BOO is a big-ticket seller (score 69), MIE is underperforming (score 30) — but lacks the operational tooling and process to scale.

## 2. Solution Overview

A web application ("Sales Ops App") deployed on Vercel that provides:

1. **Sales KPI Dashboard** — track each salesperson's performance daily and weekly
2. **Win-Back Campaign Tracker** — manage outbound contact with 1,340+ lapsed customers
3. **Customer 360 View** — purchase history, taste profile, and AI-powered product recommendations
4. **Operational Tools** — scripts, promotions, daily goals, and structured feedback logging

The app implements **"Progressive Transparency"**: Phase 1 (weeks 1-4) shows each salesperson only their own data with a team-level aggregate; Phase 2 (week 5+) unlocks a named leaderboard for healthy competition.

## 3. Architecture

### 3.1 High-Level System Diagram

```
┌─────────────────────────────────┐    ┌──────────────────────────────┐
│  GOOGLE SHEETS (manual updates) │    │  WNLQ9 BI API               │
│  ──────────────────────────────  │    │  wnlq9-bi-api.vercel.app    │
│  • Weekly Sales KPI per agent   │    │  ──────────────────────────  │
│    (orders, conversion, AOV,    │    │  • RFM snapshot (winback)    │
│    tickets, response times)     │    │  • Customer spend history    │
│  • Daily activity log           │    │  • Product catalog (PIM)     │
│    (order-level per agent)      │    │  • Cross-sell affinities     │
│                                 │    │  • Sales forecast            │
│  Tabs:                          │    │  • Inventory                 │
│  - gid=145752556 (KPI summary)  │    │  • pivot_base (SKU-level)    │
│  - gid=0 (activity log)        │    │  • 22 mart tables total      │
└──────────────┬──────────────────┘    └──────────────┬───────────────┘
               │                                      │
               │ weekly sync                          │ live REST API
               │ (manual button → auto cron later)    │ (server-side, cached 1hr)
               ▼                                      ▼
         ┌────────────────────────────────────────────────┐
         │           SALES OPS APP (Next.js 15)           │
         │           Deployed on Vercel                   │
         │           sales.wnlq9.com                      │
         └────────────────┬───────────────────────────────┘
                          │
                          ▼
                   ┌──────────────────┐
                   │  Supabase        │
                   │  (Postgres)      │
                   │  • Auth (4 users)│
                   │  • Assignments   │
                   │  • Contact logs  │
                   │  • Scripts       │
                   │  • Promotions    │
                   │  • Daily goals   │
                   │  • KPI snapshots │
                   │  • App settings  │
                   └──────────────────┘
```

### 3.2 Data Source Responsibilities

| Purpose | Data Source | Endpoint | Rationale |
|---------|------------|----------|-----------|
| Sales Performance KPI (revenue, conversion, AOV, tickets, response time) | Google Sheet | Published CSV via gid | Contains Zoho Desk attribution data not available in BI API |
| Win-Back Customer List | BI API | `/marts/rfm_snapshot` | Always current, no manual export |
| Customer 360 — spend history | BI API | `/marts/customer_spend_monthly?email=X` | Monthly spend chart |
| Customer 360 — SKU-level orders | BI API | `/marts/pivot_base?email=X` | Full order line items with SKU, brand, country, category (confirmed available) |
| Customer 360 — yearly rank | BI API | `/marts/top_customers_yearly?email=X` | Where they rank among all customers |
| Product catalog (PIM) | BI API | `/products/{sku}` | Name, brand, classification, country, grape, price, flavor tags |
| Product recommendations (cross-sell) | BI API | `/products/{sku}/affinities?type=both` | Co-purchase intelligence |
| Product search (upsell/new arrivals) | BI API | `/products?brand=X&classification=Y&limit=N` | Find similar/premium alternatives |
| Stock availability | BI API | `/products/{sku}/inventory` | Prevent pitching out-of-stock items |
| Recent orders (attribution) | BI API | `/marts/sales_daily` | Check if win-back customers ordered recently |
| Forecasts and trends | BI API | `/marts/forecast_weekly` | Market intelligence for manager |
| Operational data (assignments, contact logs, outcomes) | Supabase | Direct DB | App-specific data not in other systems |

### 3.3 BI API Integration Details

- **Base URL:** `https://wnlq9-bi-api.vercel.app`
- **Auth:** Header `X-API-Key` stored in Vercel environment variable `WNLQ9_BI_API_KEY`
- **Security:** All BI API calls made server-side via Next.js API routes — key never exposed to browser
- **API proxy allowlist:** Only the following BI paths are proxied to the frontend (all others return 403):
  - `/marts/rfm_snapshot`
  - `/marts/customer_spend_monthly`
  - `/marts/pivot_base`
  - `/marts/top_customers_yearly`
  - `/marts/sales_daily`
  - `/marts/sales_weekly`
  - `/marts/forecast_weekly`
  - `/marts/product_performance_monthly`
  - `/products/*`
- **Caching:** Customer 360 data cached 1 hour per customer; mart data cached 15 minutes
- **Fallback:** If BI API is unreachable, app shows cached data with a "data may be stale" banner; contact logging always works
- **Error responses:** All proxy errors return `{ error: string, bi_status?: number }` with appropriate HTTP status codes

### 3.4 Google Sheets Sync

- **Source spreadsheet:** `1TDiyNDwC4ZF2kIPbRKIzEnmkotMvwTOP3Qc6H3ZAHbY`
- **KPI tab:** gid=145752556 (agent-level weekly performance)
- **Activity log tab:** gid=0 (4,241+ order-level actions per agent)
- **Authentication method:** The Google Sheet must be published to web as CSV (read-only, no auth needed). URL pattern: `https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid={GID}`. No service account required since the sheet is already publicly accessible for export.
- **Phase 1:** Manual "Sync KPI" button in manager dashboard
- **Phase 2:** Auto-sync via Vercel Cron (`vercel.json` cron config — Vercel Hobby plan supports 1 cron/day, Pro supports more). Schedule: daily at 23:00 ICT.
- **Agent mapping:** Stored in `app_settings` table as JSON: `{"M": "<mie_user_id>", "Y": "<yui_user_id>", "B": "<boo_user_id>"}`. If an unknown initial is encountered during sync, a warning is logged and the row is skipped (not silently dropped).
- **Upsert strategy:** Sync uses `ON CONFLICT (sales_id, sort_month, week) DO UPDATE` to prevent duplicate rows on re-sync.

### 3.5 LINE Integration (Phase 2 — TBD)

LINE integration is a Phase 2 deliverable. Architecture will be specified separately before Phase 2 development begins. Placeholder considerations:

- LINE Messaging API via LINE OA (Official Account)
- LIFF (LINE Front-end Framework) for in-app mini experience
- Webhook endpoint receives message delivery/read status
- Customer LINE user ID stored in `customers.line_id` (nullable)
- One-tap outbound: opens LINE deep link with pre-filled message; webhook confirms delivery and auto-logs the contact_attempt

The `api/webhook/line/route.ts` is excluded from Phase 1 code structure.

### 3.6 Security & Infrastructure

- **CORS:** API routes rely on Vercel's default same-origin behavior. No cross-origin access needed.
- **CSP:** Configured in `next.config.js` — allow self, Supabase, and BI API origins only.
- **Backups:** Supabase free tier has no automatic backups. A weekly `pg_dump` export to a Vercel Blob or Google Cloud Storage bucket is implemented as a Vercel Cron job. Contact logs and assignment history are business-critical data.

## 4. Data Model (Supabase)

### 4.1 Conventions

All mutable tables include:
- `created_at timestamptz DEFAULT now()` — row creation time
- `updated_at timestamptz DEFAULT now()` — auto-updated via Postgres trigger

```sql
-- Applied to all mutable tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Enum columns use `text` with `CHECK` constraints (not Postgres `CREATE TYPE ... AS ENUM`) for flexibility when adding new values.

### 4.2 Tables

#### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid (PK) | | Supabase auth user ID |
| email | text | NOT NULL, UNIQUE | Login email |
| name | text | NOT NULL | Display name (Yui, Boo, Mie, Manager) |
| role | text | CHECK (role IN ('manager', 'sales')) | User role |
| created_at | timestamptz | DEFAULT now() | Account creation |
| updated_at | timestamptz | DEFAULT now() | Last update |

#### `customers`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial (PK) | | Internal ID |
| email | text | NOT NULL, UNIQUE | Customer email (key link to BI API) |
| name | text | nullable | Customer display name (from Magento if available) |
| phone | text | nullable | Phone number for call channel |
| line_id | text | nullable | LINE user ID (Phase 2) |
| customer_group | text | | Restaurant, Private Customer, Hotel, Company, Retailer, etc. |
| rfm_segment | text | | At Risk, Hibernating, Lost, etc. |
| total_spend_thb | numeric | | Lifetime spend in THB |
| order_count | integer | | Total orders |
| aov | numeric | | Average order value |
| last_order_month | date | | Most recent purchase date |
| recency_days | integer | | Days since last order |
| winback_score | numeric | | Priority score for re-engagement |
| last_synced_at | timestamptz | | When RFM data was last refreshed from BI API |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**Note:** `name` and `phone` may not be available from the BI API `rfm_snapshot`. Initial import populates email + RFM fields. Name/phone are filled via: (a) manager manual entry, (b) Magento customer export if available, or (c) salesperson adds during first contact. Scripts fall back to generic greeting if `name` is null.

#### `assignments`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial (PK) | | Assignment ID |
| customer_id | FK → customers | UNIQUE, NOT NULL | Which customer (one owner only) |
| sales_id | FK → users | NOT NULL | Which salesperson owns this |
| status | text | CHECK (status IN ('pending', 'active', 'done', 'dnc')) | Assignment status |
| assigned_at | timestamptz | DEFAULT now() | When assigned |
| cooldown_until | timestamptz | nullable | Earliest next-contact date |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**Cooldown enforcement:** Implemented at both application level (query filters) AND database level via a `BEFORE INSERT` trigger on `contact_attempts` that rejects inserts when the parent assignment's `cooldown_until > now()`. This prevents bypass via direct Supabase client calls.

```sql
CREATE OR REPLACE FUNCTION check_cooldown()
RETURNS TRIGGER AS $$
DECLARE
  _cooldown timestamptz;
BEGIN
  SELECT cooldown_until INTO _cooldown
  FROM assignments WHERE id = NEW.assignment_id;

  IF _cooldown IS NOT NULL AND _cooldown > now() THEN
    RAISE EXCEPTION 'Customer is in cooldown until %', _cooldown;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_cooldown
BEFORE INSERT ON contact_attempts
FOR EACH ROW EXECUTE FUNCTION check_cooldown();
```

#### `contact_attempts`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial (PK) | | Log entry ID |
| assignment_id | FK → assignments | NOT NULL | Which assignment |
| sales_id | FK → users | NOT NULL | Who made the contact |
| contacted_at | timestamptz | DEFAULT now() | When contact was made |
| channel | text | CHECK (channel IN ('line', 'phone', 'email')) | Contact channel |
| script_used_id | FK → scripts | nullable | Which script was used |
| promotion_id | FK → promotions | nullable | Which promotion was offered |
| outcome | text | CHECK (outcome IN ('no_answer', 'seen_no_reply', 'replied_needs_followup', 'not_interested', 'ordered', 'do_not_contact')) | Structured outcome |
| not_interested_reason | text | CHECK (not_interested_reason IN ('price_too_high', 'switched_supplier', 'no_longer_drinking', 'bad_previous_experience', 'business_closed', 'moved_away', 'other') OR not_interested_reason IS NULL) | Required when outcome = 'not_interested' |
| notes | text | nullable | Optional freeform notes |
| follow_up_date | date | nullable | Scheduled follow-up |
| resulted_in_order_id | text | nullable | Magento order # if win-back succeeded |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

#### `scripts`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial (PK) | | Script ID |
| title | text | NOT NULL | Display name |
| segment_tag | text | | Which customer segment (restaurant, private, corporate) |
| body_template_th | text | | Thai version with {customer_name}, {last_order_date}, {top_brand}, {recommended_product} placeholders |
| body_template_en | text | | English version |
| tone | text | CHECK (tone IN ('luxury', 'casual', 'formal')) | Script tone |
| is_active | boolean | DEFAULT true | Can be used by sales |
| created_by | FK → users | | Manager who created it |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

#### `promotions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial (PK) | | Promotion ID |
| title | text | NOT NULL | Display name |
| discount_desc | text | | e.g. "12% off + free delivery" |
| promo_code | text | nullable | Coupon code if applicable |
| eligibility_rules | jsonb | | See schema below |
| valid_from | date | | Start date |
| valid_until | date | | Expiry |
| is_active | boolean | DEFAULT true | Currently available |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**`eligibility_rules` JSON schema:**
```json
{
  "min_spend_thb": 5000,           // number, optional — minimum LTV to qualify
  "customer_group": ["Restaurant"], // string[], optional — allowed groups
  "rfm_segment": ["At Risk"],      // string[], optional — allowed segments
  "min_aov_thb": 3000,             // number, optional — minimum AOV
  "max_recency_days": 365          // number, optional — must have ordered within N days
}
```
All fields are optional. Empty object `{}` means no restrictions (available to all).

#### `kpi_snapshots`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial (PK) | | Snapshot ID |
| sort_month | text | NOT NULL | e.g. "Mar 2026" |
| week | text | NOT NULL | e.g. "10" |
| sales_id | FK → users | NOT NULL | Which agent |
| orders_count | integer | | Sales orders |
| sales_amt_thb | numeric | | Revenue |
| conversion_pct | numeric | | Conversion rate |
| aov_thb | numeric | | Average order value |
| all_ticket_sum | integer | | Total tickets handled |
| outgoing | integer | | Outgoing contacts |
| first_response_time_secs | integer | nullable | Average first response time in seconds |
| response_time_secs | integer | nullable | Average response time in seconds |
| resolution_time_secs | integer | nullable | Average resolution time in seconds |
| good_ratings | integer | | Positive ratings |
| bad_ratings | integer | | Negative ratings |
| synced_at | timestamptz | DEFAULT now() | When data was synced |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**Constraint:** `UNIQUE (sales_id, sort_month, week)` — prevents duplicate rows on re-sync.

**Duration parsing:** Google Sheet stores durations as strings like "0:48:07" or "2d 14h". The sync function parses these into total seconds before inserting. Display layer formats seconds back to human-readable.

#### `daily_goals`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial (PK) | | Goal ID |
| sales_id | FK → users | NOT NULL | Which agent |
| date | date | NOT NULL | Which day |
| outbound_target | integer | DEFAULT 15 | Configurable by manager |
| orders_target | integer | nullable | Optional |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**Constraint:** `UNIQUE (sales_id, date)` — one goal row per person per day.

**Note:** `outbound_done` is NOT stored — it is computed at query time via `COUNT(*) FROM contact_attempts WHERE sales_id = X AND contacted_at::date = Y`. This eliminates sync drift. Similarly, `orders_done` is computed from `kpi_snapshots` where available.

#### `app_settings`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | text (PK) | | Setting name |
| value | jsonb | NOT NULL | Setting value |
| updated_at | timestamptz | DEFAULT now() | |

**Initial seed values:**
```sql
INSERT INTO app_settings (key, value) VALUES
  ('leaderboard_enabled', 'false'),
  ('agent_mapping', '{"M": "<mie_user_id>", "Y": "<yui_user_id>", "B": "<boo_user_id>"}'),
  ('default_outbound_target', '15'),
  ('cooldown_days', '{"no_answer": 3, "seen_no_reply": 5, "not_interested": 60, "recent_order": 7}');
```

### 4.3 Indexes

```sql
-- Assignments
CREATE INDEX idx_assignments_sales_id_status ON assignments(sales_id, status);
CREATE INDEX idx_assignments_customer_id ON assignments(customer_id);

-- Contact attempts
CREATE INDEX idx_contact_attempts_assignment_id ON contact_attempts(assignment_id);
CREATE INDEX idx_contact_attempts_sales_id_date ON contact_attempts(sales_id, contacted_at);
CREATE INDEX idx_contact_attempts_outcome ON contact_attempts(outcome);

-- Customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_rfm_segment ON customers(rfm_segment);
CREATE INDEX idx_customers_winback_score ON customers(winback_score DESC);

-- KPI snapshots
CREATE INDEX idx_kpi_snapshots_sales_month ON kpi_snapshots(sales_id, sort_month);

-- Daily goals
CREATE INDEX idx_daily_goals_sales_date ON daily_goals(sales_id, date);
```

### 4.4 Row Level Security (RLS)

| Table | Manager | Sales |
|-------|---------|-------|
| users | Read all | Read own |
| customers | Read/Write all | Read assigned only |
| assignments | Read/Write all | Read own only |
| contact_attempts | Read all | Read/Write own only |
| scripts | Read/Write all | Read active only |
| promotions | Read/Write all | Read active only |
| kpi_snapshots | Read all | Read own (Phase 1); Read all when `app_settings.leaderboard_enabled = true` (Phase 2) |
| daily_goals | Read/Write all | Read/Write own only |
| app_settings | Read/Write | Read only |

**Phase transition for `kpi_snapshots`:** The RLS policy queries `app_settings` to determine visibility:

```sql
CREATE POLICY sales_kpi_read ON kpi_snapshots FOR SELECT TO authenticated
USING (
  -- Manager sees all
  (SELECT role FROM users WHERE id = auth.uid()) = 'manager'
  OR
  -- Sales sees own always
  sales_id = auth.uid()
  OR
  -- Sales sees all when leaderboard enabled
  (SELECT (value)::boolean FROM app_settings WHERE key = 'leaderboard_enabled')
);
```

## 5. User Interface Design

### 5.1 Screen Map

```
Login
 │
 ├── Sales Role ──────────────────────────┐
 │    │                                   │
 │    ├── Cockpit (Home)                  │
 │    │   • Today's goals (3 progress bars)│
 │    │   • Hot list (top 5 customers)    │
 │    │   • Follow-ups due today          │
 │    │   • Coaching tip of the day       │
 │    │                                   │
 │    ├── Customer 360° (click from list) │
 │    │   • Identity card                 │
 │    │   • Value score + RFM             │
 │    │   • Purchase timeline chart       │
 │    │   • Taste profile                 │
 │    │   • AI recommendations            │
 │    │   •   Upsell / Cross-sell / Bundle│
 │    │   • Suggested promotion           │
 │    │   • Script (pre-filled Thai/EN)   │
 │    │   • Action buttons (LINE/Call/Log)│
 │    │   • Deep link to BI for more      │
 │    │                                   │
 │    ├── My Performance                  │
 │    │   • Weekly KPI card               │
 │    │   • Trend chart (4 weeks)         │
 │    │   • Team scoreboard (Phase 1: anon│
 │    │     Phase 2: named leaderboard)   │
 │    │                                   │
 │    └── Log Contact (modal overlay)     │
 │        • Channel select                │
 │        • Outcome taxonomy (6 buttons)  │
 │        • Script/promo auto-filled      │
 │        • Notes (optional)              │
 │        • Follow-up date picker         │
 │                                        │
 └── Manager Role ────────────────────────┐
      │                                   │
      ├── Dashboard (Home)                │
      │   • Team pulse (3-column compare) │
      │   • Outbound heatmap (14 days)    │
      │   • Win-back funnel               │
      │   • Promo performance             │
      │   • Alerts panel                  │
      │                                   │
      ├── Assignments                     │
      │   • Full customer list            │
      │   • Reassign, bulk-assign         │
      │   • Filter by segment/status      │
      │                                   │
      ├── Scripts Manager                 │
      │   • Create/edit/archive scripts   │
      │   • Tag by segment                │
      │                                   │
      ├── Promotions Manager              │
      │   • Create/edit promotions        │
      │   • Usage + conversion tracking   │
      │                                   │
      └── Settings                        │
          • Sync KPI from Google Sheet    │
          • Agent mapping config          │
          • Toggle leaderboard            │
          • Set default outbound targets  │
```

### 5.2 Customer 360 — Data Sources per Section

| Section | BI API Endpoint | Purpose |
|---------|----------------|---------|
| Identity + Value | `/marts/rfm_snapshot?email=X` | RFM scores, segment, total spend, recency |
| Purchase Timeline | `/marts/customer_spend_monthly?email=X` | Monthly spend chart |
| Yearly Rank | `/marts/top_customers_yearly?email=X` | Where they rank among all customers |
| SKU-level Order History | `/marts/pivot_base?email=X` | Every SKU they purchased with brand, country, category, price, margin |
| Taste Profile | Derived from `pivot_base` results | Aggregate classification, country, brand, flavor tags |
| Upsell | `/products?brand=X&classification=Y` sorted by price desc | Higher-tier versions of what they love |
| Cross-sell | `/products/{sku}/affinities?type=both` for top SKUs | Co-purchase recommendations |
| New Arrivals | `/products?country=X&classification=Y` filtered exclude past purchases | Products matching taste they haven't tried |
| Stock Check | `/products/{sku}/inventory` | Only recommend in-stock items |

### 5.3 Taste Profile Algorithm

```
INPUT:  customer email
OUTPUT: taste signature JSON

Step 1: Fetch /marts/pivot_base?email=X
        → returns SKU-level order history with fields:
          sku, brand, country, region, category_name, product_type,
          grape_variety, price_range, qty_ordered, item_revenue_thb

Step 2: For top 10 most-purchased SKUs, batch fetch /products/{sku}
        → enrich with: pim_classification, pim_wine_body,
          pim_food_matching, pim_flavor_tags, pim_price_thb

Step 3: Aggregate into taste signature:
        {
          top_classifications: [{name: "Red Wine", pct: 68}, ...],
          top_countries: [{name: "France", pct: 74}, ...],
          top_brands: ["Chateau Margaux", "Dom Perignon"],
          top_grapes: ["Cabernet Sauvignon", "Chardonnay"],
          price_band_thb: {min: 3000, max: 12000},
          avg_order_value: 184339,
          volume_pattern: "bulk" | "single" | "mixed",
          flavor_preferences: ["bold", "oaked", "full-bodied"],
          food_matching: ["red meat", "cheese"],
          never_tried: ["Italian", "Super Tuscan"]
        }

Step 4: Generate 3 recommendations:
        → UPSELL: /products?brand={top_brand}&classification={top_class}
                  sorted by price desc, filtered > customer's avg price
        → CROSS-SELL: /products/{top_sku}/affinities?type=both
        → NEW ARRIVAL: /products?country={top_country}&classification={top_class}
                       filtered by price_band + excluding already-bought SKUs

Step 5: For each recommendation, check /products/{sku}/inventory
        → exclude out-of-stock items

Step 6: Cache full result for 1 hour per customer email
```

### 5.4 Progressive Transparency Phases

**Phase 1 (Weeks 1-4):**
- Sales sees: own KPI, own assignments, own contact log
- Sales sees: team-level aggregate (total contacts, total win-backs — no names)
- Manager sees: everything

**Phase 2 (Week 5+):**
- Manager sets `leaderboard_enabled = true` in Settings page
- RLS policy on `kpi_snapshots` automatically expands to allow all sales users to read all rows
- Sales sees: named leaderboard (outbound count, win-backs, revenue)
- Weekly rotating awards appear

### 5.5 UX Principles

- **Mobile-first**: All screens optimized for iPhone (sales work on-the-go)
- **Thai + English toggle**: next-intl for all UI text and scripts
- **One-screen workflows**: Customer 360 shows everything — no page hopping mid-call
- **Green/Yellow/Red status dots**: consistent color language across all screens
- **Empty states coach**: instead of blank pages, show "You have 5 hot customers — start here"
- **Celebration moments**: confetti animation when a win-back converts
- **Dark mode optional**: sales often work evenings

## 6. Expert Additions

### 6.1 Talk Tracks / Script Library

Pre-seeded with luxury advisor scripts from the March 2026 KPI coaching report:

- **Restaurant win-back**: "business reopening" angle, bulk Bordeaux case
- **Private Customer high-AOV**: "new arrival exclusive" framing
- **Corporate**: "Q2 planning" seasonal pitch
- **Hibernating 300+ days**: "we miss you" with strong privilege offer

Scripts use template variables: `{customer_name}`, `{last_order_date}`, `{top_brand}`, `{recommended_product}`

When `customers.name` is null, scripts fall back to a generic greeting (e.g., "Dear valued customer" / "สวัสดีค่ะ คุณลูกค้าคนพิเศษ").

Good / Better / Best framework embedded:
- Good: single bottle recommendation
- Better: 3-bottle tasting set
- Best: 6-bottle case with VIP pricing

### 6.2 Promotion & Privilege Catalog

Stored in `promotions` table. Manager creates offers tagged by:
- Customer group eligibility
- Minimum spend threshold
- Valid date range

App tracks: times used, conversion rate, average order value when used.

### 6.3 Outcome Taxonomy

Six structured outcomes (not freeform):

| Outcome | Icon | Triggers | Cooldown |
|---------|------|----------|----------|
| No answer / Unreachable | Phone-off | Auto-schedule follow-up reminder in 3 days | 3 days |
| Seen but no reply | Eye | Auto-schedule follow-up reminder in 5 days | 5 days |
| Replied — needs follow-up | Chat bubble | Require follow-up date entry | None (custom date) |
| Not interested | Hand-stop | Require reason from dropdown | 60 days |
| Ordered | Money bag | Link to order #; mark assignment "done" | N/A |
| Do Not Contact | Stop sign | Mark assignment "dnc"; permanent suppression | Permanent |

**"Not interested" reason dropdown values:**
- `price_too_high` — Price is too expensive
- `switched_supplier` — Using another supplier
- `no_longer_drinking` — No longer consuming
- `bad_previous_experience` — Had a bad experience
- `business_closed` — Business no longer operating
- `moved_away` — Moved / relocated
- `other` — Other reason (notes field encouraged)

**Clarification on cooldown vs. auto-retry:** Cooldown means the customer is suppressed from the contact list for N days. After cooldown expires, the customer reappears in the salesperson's list. The system does NOT auto-contact — it only lifts the suppression so the salesperson can try again manually.

### 6.4 Cooldown & Suppression Rules

| Trigger | Cooldown | Implementation |
|---------|----------|----------------|
| "No answer" outcome | 3 days | `assignments.cooldown_until = now() + 3 days` |
| "Seen no reply" outcome | 5 days | `assignments.cooldown_until = now() + 5 days` |
| "Not interested" outcome | 60 days | `assignments.cooldown_until = now() + 60 days` |
| "Do Not Contact" outcome | Permanent | `assignments.status = 'dnc'` |
| Customer placed any order (from BI API) | 7 days | Checked at query time via BI API |
| Assignment locked to another salesperson | Permanent (until manager reassigns) | UNIQUE constraint on customer_id |

Cooldown values are configurable via `app_settings.cooldown_days` JSON.

### 6.5 Daily Outbound Goal with Nudges

- Default target: 15 contacts/day (configurable per salesperson via manager, stored in `daily_goals` or falls back to `app_settings.default_outbound_target`)
- Progress bar visible on cockpit home
- If below 50% by 3 PM → in-app nudge displayed
- Daily goal resets at midnight Bangkok time (UTC+7)

### 6.6 Revenue Attribution

When a win-back customer places an order:
- **Trigger:** Vercel Cron runs daily at 23:00 ICT (same cron as KPI sync, different function)
- **Process:** Query `/marts/sales_daily` for today's orders. Match customer emails against `assignments` with a `contact_attempt` in the last 30 days.
- **Result:** Auto-populate `resulted_in_order_id` on the most recent contact_attempt for that customer.
- Credit appears on salesperson's "Win-Back Won" counter.
- **Vercel plan note:** Hobby plan supports 1 cron job/day. Since we need 2 (KPI sync + attribution), combine them into a single cron function that runs both tasks sequentially, OR upgrade to Pro plan for multiple crons.

### 6.7 Coaching Nudges Built Into UI

| UI Moment | Nudge |
|-----------|-------|
| Log "Not interested" outcome | "Before closing, did you try 1 bundle suggestion?" |
| Open customer with LTV > 500k | "VIP — use luxury tone, never discount first" |
| Outbound at 50% by 3 PM | "7 customers on your hot list still untouched" |
| 3 win-backs in a week | Celebration: trophy animation |

## 7. Customer Assignment Strategy

### 7.1 Mixed Assignment (Balanced)

All 1,340 customers distributed equally across 3 salespeople (~447 each) with balanced mix of:

- **Customer groups**: each person gets proportional Restaurant, Private, Corporate, etc.
- **Value tiers**: each person gets proportional high/medium/low winback_score
- **RFM segments**: each person gets proportional At Risk vs Hibernating

**Rationale:** Team has never done outbound before. Mixed assignment exposes everyone to all customer types, developing well-rounded skills.

### 7.2 Assignment Algorithm

```
1. Sort customers by winback_score descending
2. Round-robin assign to [Yui, Boo, Mie] in order
   (1→Yui, 2→Boo, 3→Mie, 4→Yui, 5→Boo, 6→Mie, ...)
3. Validate: each person's group mix is within 5% of overall distribution
4. If imbalanced, swap individual customers between pairs to equalize
```

### 7.3 Hot List Ordering

Each salesperson's daily "Hot List" (top 5 to contact first) is ordered by:
1. Overdue follow-ups (promised date passed)
2. Highest winback_score among untouched customers
3. Cooldown just expired (they're "warm" again)

## 8. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Framework | Next.js (App Router) | 15 | Server-side API calls, React, TypeScript |
| Hosting | Vercel | — | Same infra as BI API, free tier |
| Database + Auth | Supabase | — | Postgres + RLS + Auth, free tier (500MB) |
| Styling | Tailwind CSS | 4 | Fast to build, mobile-first |
| Component Library | shadcn/ui | — | Consistent, accessible components |
| Charts | Recharts | 2 | React-native charting |
| i18n | next-intl | — | Thai + English toggle |
| Language | TypeScript | 5 | Type safety with API contracts |

**Monthly cost: ~0 THB** (all free tier for this scale)

## 9. Code Structure

```
sales-ops/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (sales)/
│   │   ├── cockpit/page.tsx
│   │   ├── customer/[id]/page.tsx          # Uses customer PK, not email
│   │   ├── performance/page.tsx
│   │   └── log/[assignmentId]/page.tsx
│   ├── (manager)/
│   │   ├── dashboard/page.tsx
│   │   ├── assignments/page.tsx
│   │   ├── scripts/page.tsx
│   │   ├── promotions/page.tsx
│   │   └── settings/page.tsx               # Sync, agent mapping, leaderboard toggle
│   └── api/
│       ├── bi/[...path]/route.ts           # Server proxy to BI API (allowlisted paths)
│       ├── sheets/sync/route.ts            # Google Sheets pull
│       ├── recommend/[id]/route.ts         # Taste profile + recs (by customer PK)
│       └── cron/nightly/route.ts           # KPI sync + revenue attribution
├── components/
│   ├── ui/                                 # shadcn components
│   ├── customer/                           # 360 view widgets
│   │   ├── identity-card.tsx
│   │   ├── purchase-timeline.tsx
│   │   ├── taste-profile.tsx
│   │   └── ai-recommendations.tsx
│   ├── charts/                             # KPI visualizations
│   │   ├── goal-progress.tsx
│   │   ├── outbound-heatmap.tsx
│   │   └── winback-funnel.tsx
│   ├── forms/
│   │   ├── log-contact.tsx
│   │   ├── script-editor.tsx
│   │   └── promo-editor.tsx
│   └── layout/
│       ├── sales-shell.tsx
│       └── manager-shell.tsx
├── lib/
│   ├── bi-client.ts                        # Typed BI API wrapper with allowlist
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── taste-profile.ts                    # Recommendation engine
│   ├── sheets-parser.ts                    # Google Sheets CSV parser + duration parser
│   ├── assignment-engine.ts                # Mixed balanced assignment
│   └── cooldown.ts                         # Suppression rule engine
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_create_indexes.sql
│       ├── 003_create_rls_policies.sql
│       ├── 004_create_triggers.sql         # updated_at + cooldown enforcement
│       └── 005_seed_scripts_promos.sql
└── data/
    ├── winback-list.csv                    # Archive of initial import
    ├── sales-kpi-data.csv                  # Archive
    └── sales-activity-log.csv              # Archive
```

## 10. Implementation Phases

### Phase 1 — MVP (Week 1-3)

**Goal:** Get the team doing outbound immediately with basic tooling.

**Timeline note:** Original estimate was 2 weeks. Revised to 3 weeks based on scope — Customer 360 with live BI API integration, taste profiling, and AI recommendations is substantial. Week 3 is internal testing with manager before team launch.

Deliverables:
- Auth (4 accounts: Manager, Yui, Boo, Mie)
- Import ~1,340 winback customers from BI API rfm_snapshot
- Mixed assignment split (auto-balanced by value + segment)
- Sales Cockpit (today's list, daily goal tracker)
- Customer 360 (purchase timeline, taste profile, AI recommendations via BI API)
- Log Contact modal (structured outcomes, 6 types)
- Manager Dashboard (team pulse, heatmap, alerts)
- Script library (seeded with luxury templates)
- Cooldown rules + suppression (app + DB trigger)
- KPI sheet manual sync
- Manager Settings page (agent mapping, leaderboard toggle, sync)
- Thai + English support
- Mobile-responsive design
- Weekly pg_dump backup

### Phase 2 — Activation (Week 4-6)

Deliverables:
- LINE OA integration (architecture spec written first, then built)
- Promotion catalog with performance tracking
- Revenue attribution loop (nightly cron via Vercel)
- Auto-sync KPI from Google Sheets (Vercel Cron)
- Email/LINE notifications for overdue follow-ups
- Enhanced mobile touch UX

### Phase 3 — Culture (Week 7+)

Deliverables:
- Named leaderboard (toggle in settings)
- Weekly challenges / contests
- "Win-back of the week" recognition
- Personal trend reports per salesperson
- Slack/LINE notifications for wins

## 11. Acceptance Criteria (MVP)

The MVP is complete when:

1. Manager can log in, see all 3 salespeople's assignments, and reassign a customer
2. A salesperson can log in, see their ~447 customers, click one, and see full 360 view with AI-recommended products from BI API
3. A salesperson can log a contact attempt in under 30 seconds
4. Cooldown prevents re-contact within the defined suppression period (enforced at DB level)
5. Manager dashboard shows week's performance, outbound heatmap, and alerts
6. KPI data from Google Sheet syncs correctly via "Sync" button with upsert behavior
7. All screens work on mobile (iPhone Safari)
8. Thai/English toggle works on all screens

## 12. Success Metrics

### Leading Indicators (Daily, Weeks 1-4)

| Metric | Target |
|--------|--------|
| Outbound contacts per day per person | 15 by week 3 |
| Contact logs with structured outcome | >90% |
| Mie's daily outbound | From 0 to 10+ |
| Follow-up adherence | >80% on scheduled date |

### Lagging Indicators (Weekly/Monthly)

| Metric | Baseline (Mar 2026) | Target (Month 3) |
|--------|---------------------|-------------------|
| Team revenue | ~2.6M THB/month | +50% → 3.9M THB |
| Win-backs closed | 0 | 30+ per month |
| Average team KPI score | 56 (Grade D) | 75+ (Grade B) |
| AOV | 8,500 THB | 11,000 THB |
| Upsell rate | ~0% | 20% of orders |

### Red Flags

- Week 2 outbound still < 7/day → revisit script friction or training
- Win-back conversion < 3% → promotion strategy needs revision
- Mie still at zero Week 2 → performance conversation needed

## 13. Rollout Plan

### Timeline

| Period | Activity |
|--------|----------|
| Week 1-2 | Build MVP core |
| Week 3 | Internal test (manager only, fix bugs, tune recommendations) |
| Week 4 | Team training + soft launch |
| Week 5-6 | Production + Phase 2 features |
| Week 7+ | Phase 3 (leaderboard unlocks) |

### Training Plan — Day 1 (90 min)

1. **Group kickoff (30 min)** — present the app, frame "this is your coach, not your monitor"
2. **Hands-on walkthrough (30 min)** — each person logs in, explores cockpit, clicks 3 customers
3. **Mock outbound (30 min)** — each person does 2 real contacts, logs them together

### Weekly Rituals

**Monday 9 AM — Sales Operations Review (45 min)**
1. Last week's numbers (manager dashboard) — 5 min
2. Win-back wins — celebrate recoveries — 5 min
3. Script/promo performance — what converted? — 10 min
4. Each person's trend line — 15 min
5. This week's priorities — hot list, goals — 10 min

## 14. Risks & Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Team sees tool as surveillance | Medium | Phase 1 is private per person; frame as coaching tool |
| BI API downtime | Low | 1-hour cache; contact logging always works offline |
| Google Sheet format changes break sync | Medium | Manual sync button as fallback; format validation; unknown agent initials logged as warnings |
| Thai character encoding issues | Medium | Test UTF-8 on all inputs before launch |
| Customer complains about contact | Medium | DNC outcome + cooldown enforced at DB level |
| Salesperson contacts wrong person | Low | Assignment locking — one customer, one owner |
| Supabase data loss (free tier, no backups) | Medium | Weekly pg_dump to cloud storage via cron |
| Customer name/phone not available | High | Graceful fallbacks in scripts; sales can add during first contact |

---

## Appendix A: Spec Review Issues Resolved

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| C1 | Critical | No `updated_at` on mutable tables | Added to all tables + auto-update trigger (section 4.1) |
| C2 | Critical | Email in URL path breaks routing | Changed to customer PK `[id]` (section 9) |
| C3 | Critical | Google Sheets auth method unspecified | Specified: published CSV export, no auth needed (section 3.4) |
| C4 | Critical | No customer name/phone in data model | Added `name`, `phone`, `line_id` to customers table (section 4.2) |
| C5 | Critical | Revenue attribution cron has no implementation path | Specified Vercel Cron + combined nightly job (section 6.6) |
| M1 | Major | `kpi_snapshots` missing unique constraint | Added UNIQUE (sales_id, sort_month, week) + upsert (section 4.2) |
| M2 | Major | `daily_goals` missing unique constraint | Added UNIQUE (sales_id, date) (section 4.2) |
| M3 | Major | Feature flag storage undefined | Created `app_settings` table with key-value pairs (section 4.2) |
| M4 | Major | Cooldown bypass via direct DB access | Added BEFORE INSERT trigger on contact_attempts (section 4.2) |
| M5 | Major | `not_interested_reason` options not listed | Defined 7 dropdown values with CHECK constraint (section 4.2, 6.3) |
| M6 | Major | No index strategy | Added section 4.3 with all required indexes |
| M7 | Major | LINE integration unspecified | Added section 3.5 marking Phase 2 TBD with architecture notes |
| M8 | Major | Taste profile depends on unconfirmed BI endpoint | Confirmed `/marts/pivot_base` has SKU-level data; updated algorithm (section 5.3) |
| m1 | Minor | Time durations stored as text | Changed to integer (seconds) with parser (section 4.2) |
| m2 | Minor | `outbound_done` sync mechanism unclear | Removed stored field; computed at query time (section 4.2) |
| m3 | Minor | BI API proxy lacks allowlist | Added allowlist of permitted paths (section 3.3) |
| m4 | Minor | JSONB eligibility_rules has no schema | Defined JSON schema with all supported keys (section 4.2) |
| m5 | Minor | No backup strategy | Added weekly pg_dump via Vercel Cron (section 3.6) |
| m6 | Minor | Agent mapping is fragile | Stored in app_settings with validation + warning on unknown initials (section 3.4) |
| m7 | Minor | No CORS/CSP mention | Added section 3.6 with security headers |
| m8 | Minor | Enum implementation strategy unspecified | Specified text + CHECK constraints (section 4.1) |
| X1 | Consistency | "Auto-retry" vs "cooldown" ambiguity | Clarified: cooldown lifts suppression, no auto-contact (section 6.3) |
| X2 | Consistency | MVP scope exceeds 2-week timeline | Extended Phase 1 to 3 weeks (section 10) |
| X3 | Consistency | Customer count mismatch | Aligned to "~447 each" in acceptance criteria (section 11) |

---

*Generated 2026-04-16. Reviewed and revised. Ready for user approval before implementation begins.*
