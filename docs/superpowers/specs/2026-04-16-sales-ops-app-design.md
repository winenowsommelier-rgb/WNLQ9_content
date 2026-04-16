# Sales Ops App — Design Specification

**Project:** WNLQ9 Sales Operations & Win-Back Campaign Tool
**Date:** 2026-04-16
**Status:** Draft — pending review
**Owner:** Sales Director / Management
**Team:** YUI (Closer), BOO (Big Ticket Seller), MIE (Lead Generator)

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
│  - gid=145752556 (KPI summary)  │    │  • 22 mart tables total      │
│  - gid=0 (activity log)        │    │                              │
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
                   └──────────────────┘
```

### 3.2 Data Source Responsibilities

| Purpose | Data Source | Rationale |
|---------|-------------|-----------|
| Sales Performance KPI (revenue, conversion, AOV, tickets, response time) | Google Sheet | Contains Zoho Desk attribution data not available in BI API |
| Win-Back Customer List | BI API `/marts/rfm_snapshot` | Always current, no manual export |
| Customer 360 intel (purchase history, taste profile) | BI API `/marts/customer_spend_monthly` + `/products/*` | Deep product and behavior data |
| Product recommendations (upsell, cross-sell, bundle) | BI API `/products/{sku}/affinities` + `/products?...` | Co-purchase intelligence |
| Stock availability | BI API `/products/{sku}/inventory` | Prevent pitching out-of-stock items |
| Forecasts and trends | BI API `/marts/forecast_weekly` | Market intelligence for manager |
| Operational data (assignments, contact logs, outcomes) | Supabase | App-specific data not in other systems |

### 3.3 BI API Integration Details

- **Base URL:** `https://wnlq9-bi-api.vercel.app`
- **Auth:** Header `X-API-Key` stored in Vercel environment variable `WNLQ9_BI_API_KEY`
- **Security:** All BI API calls made server-side via Next.js API routes — key never exposed to browser
- **Caching:** Customer 360 data cached 1 hour per customer; mart data cached 15 minutes
- **Fallback:** If BI API is unreachable, app shows cached data with a "data may be stale" banner; contact logging always works

### 3.4 Google Sheets Sync

- **Source spreadsheet:** `1TDiyNDwC4ZF2kIPbRKIzEnmkotMvwTOP3Qc6H3ZAHbY`
- **KPI tab:** gid=145752556 (agent-level weekly performance)
- **Activity log tab:** gid=0 (4,241+ order-level actions per agent)
- **Phase 1:** Manual "Sync KPI" button in manager dashboard
- **Phase 2:** Auto-sync cron (Monday 6 AM + nightly 11 PM)
- **Agent mapping:** M = Mie, Y = Yui, B = Boo (parsed from column "AGENT DATA")

## 4. Data Model (Supabase)

### 4.1 Tables

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Supabase auth user ID |
| email | text | Login email |
| name | text | Display name (Yui, Boo, Mie, Manager) |
| role | enum | `manager` or `sales` |
| created_at | timestamptz | Account creation |

#### `customers`
| Column | Type | Description |
|--------|------|-------------|
| id | serial (PK) | Internal ID |
| email | text (unique) | Customer email (key link to BI API) |
| customer_group | text | Restaurant, Private Customer, Hotel, Company, Retailer, etc. |
| rfm_segment | text | At Risk, Hibernating, Lost, etc. |
| total_spend_thb | numeric | Lifetime spend in THB |
| order_count | integer | Total orders |
| aov | numeric | Average order value |
| last_order_month | date | Most recent purchase date |
| recency_days | integer | Days since last order |
| winback_score | numeric | Priority score for re-engagement |
| last_synced_at | timestamptz | When RFM data was last refreshed from BI API |

#### `assignments`
| Column | Type | Description |
|--------|------|-------------|
| id | serial (PK) | Assignment ID |
| customer_id | FK → customers | Which customer |
| sales_id | FK → users | Which salesperson owns this |
| status | enum | `pending`, `active`, `done`, `dnc` |
| assigned_at | timestamptz | When assigned |
| cooldown_until | timestamptz (nullable) | Earliest next-contact date |

**Constraints:**
- Unique on (customer_id) — one customer, one owner, no overlaps
- Cooldown enforced at application level (query filters)

#### `contact_attempts`
| Column | Type | Description |
|--------|------|-------------|
| id | serial (PK) | Log entry ID |
| assignment_id | FK → assignments | Which assignment |
| sales_id | FK → users | Who made the contact |
| contacted_at | timestamptz | When contact was made |
| channel | enum | `line`, `phone`, `email` |
| script_used_id | FK → scripts (nullable) | Which script was used |
| promotion_id | FK → promotions (nullable) | Which promotion was offered |
| outcome | enum | `no_answer`, `seen_no_reply`, `replied_needs_followup`, `not_interested`, `ordered`, `do_not_contact` |
| not_interested_reason | text (nullable) | Dropdown reason if "not_interested" |
| notes | text (nullable) | Optional freeform notes |
| follow_up_date | date (nullable) | Scheduled follow-up |
| resulted_in_order_id | text (nullable) | Magento order # if win-back succeeded |

#### `scripts`
| Column | Type | Description |
|--------|------|-------------|
| id | serial (PK) | Script ID |
| title | text | Display name |
| segment_tag | text | Which customer segment (restaurant, private, corporate) |
| body_template_th | text | Thai version with {name}, {last_order} placeholders |
| body_template_en | text | English version |
| tone | enum | `luxury`, `casual`, `formal` |
| is_active | boolean | Can be used by sales |
| created_by | FK → users | Manager who created it |

#### `promotions`
| Column | Type | Description |
|--------|------|-------------|
| id | serial (PK) | Promotion ID |
| title | text | Display name |
| discount_desc | text | e.g. "12% off + free delivery" |
| promo_code | text (nullable) | Coupon code if applicable |
| eligibility_rules | jsonb | e.g. {"min_spend": 5000, "customer_group": ["Restaurant"]} |
| valid_from | date | Start date |
| valid_until | date | Expiry |
| is_active | boolean | Currently available |

#### `kpi_snapshots`
| Column | Type | Description |
|--------|------|-------------|
| id | serial (PK) | Snapshot ID |
| sort_month | text | e.g. "Mar 2026" |
| week | text | e.g. "10" |
| sales_id | FK → users | Which agent |
| orders_count | integer | Sales orders |
| sales_amt_thb | numeric | Revenue |
| conversion_pct | numeric | Conversion rate |
| aov_thb | numeric | Average order value |
| all_ticket_sum | integer | Total tickets handled |
| outgoing | integer | Outgoing contacts |
| first_response_time_avg | text | Average first response time |
| response_time_avg | text | Average response time |
| resolution_time_avg | text | Average resolution time |
| good_ratings | integer | Positive ratings |
| bad_ratings | integer | Negative ratings |
| synced_at | timestamptz | When data was synced |

#### `daily_goals`
| Column | Type | Description |
|--------|------|-------------|
| id | serial (PK) | Goal ID |
| sales_id | FK → users | Which agent |
| date | date | Which day |
| outbound_target | integer | Default 15 |
| outbound_done | integer | Computed from contact_attempts |
| orders_target | integer | Optional |
| orders_done | integer | From KPI sync |

### 4.2 Row Level Security (RLS)

| Table | Manager | Sales |
|-------|---------|-------|
| users | Read all | Read own |
| customers | Read/Write all | Read assigned only |
| assignments | Read/Write all | Read own only |
| contact_attempts | Read all | Read/Write own only |
| scripts | Read/Write all | Read active only |
| promotions | Read/Write all | Read active only |
| kpi_snapshots | Read all | Read own (Phase 1), Read all (Phase 2) |
| daily_goals | Read/Write all | Read/Write own only |

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
      └── Sync KPI                        │
          • Manual sync from Google Sheet │
          • Last sync timestamp           │
          • Preview data before confirm   │
```

### 5.2 Customer 360 — Data Sources per Section

| Section | BI API Endpoint | Purpose |
|---------|----------------|---------|
| Identity + Value | `/marts/rfm_snapshot?email=X` | RFM scores, segment, total spend, recency |
| Purchase Timeline | `/marts/customer_spend_monthly?email=X` | Monthly spend chart |
| Yearly Rank | `/marts/top_customers_yearly?email=X` | Where they rank among all customers |
| Taste Profile | Derived: for each past order → `/products/{sku}` | Aggregate classification, country, brand, flavor tags |
| Upsell | `/products?brand=X&classification=Y` sorted by price desc | Higher-tier versions of what they love |
| Cross-sell | `/products/{sku}/affinities?type=both` for top SKUs | Co-purchase recommendations |
| New Arrivals | `/products?country=X&classification=Y` filtered exclude past purchases | Products matching taste they haven't tried |
| Stock Check | `/products/{sku}/inventory` | Only recommend in-stock items |

### 5.3 Taste Profile Algorithm

```
INPUT:  customer email
OUTPUT: taste signature JSON

Step 1: Fetch /marts/customer_spend_monthly?email=X
        → get list of months with spend data

Step 2: Fetch /marts/pivot_base?email=X (if available)
        → or derive from order history via BI

Step 3: For each known SKU purchased, batch fetch /products/{sku}
        → collect: pim_classification, pim_country, pim_brand,
          pim_grape_variety, pim_wine_body, pim_food_matching,
          pim_flavor_tags, pim_price_thb

Step 4: Aggregate into taste signature:
        {
          top_classifications: [{name: "Red Wine", pct: 68}, ...],
          top_countries: [{name: "France", pct: 74}, ...],
          top_brands: ["Chateau Margaux", "Dom Perignon"],
          price_band_thb: {min: 3000, max: 12000},
          avg_order_value: 184339,
          volume_pattern: "bulk" | "single" | "mixed",
          flavor_preferences: ["bold", "oaked", "full-bodied"],
          food_matching: ["red meat", "cheese"],
          never_tried: ["Italian", "Super Tuscan"] // gap analysis
        }

Step 5: Cache result for 1 hour
```

### 5.4 Progressive Transparency Phases

**Phase 1 (Weeks 1-4):**
- Sales sees: own KPI, own assignments, own contact log
- Sales sees: team-level aggregate (total contacts, total win-backs — no names)
- Manager sees: everything

**Phase 2 (Week 5+):**
- Manager toggles feature flag `leaderboard_enabled = true`
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

| Outcome | Icon | Triggers |
|---------|------|----------|
| No answer / Unreachable | Phone-off | Set 3-day auto-retry |
| Seen but no reply | Eye | Set 5-day follow-up |
| Replied — needs follow-up | Chat bubble | Require follow-up date |
| Not interested | Hand-stop | Require reason dropdown; 60-day cooldown |
| Ordered | Money bag | Link to order #; mark assignment "done" |
| Do Not Contact | Stop sign | Permanent suppression |

### 6.4 Cooldown & Suppression Rules

| Trigger | Cooldown |
|---------|----------|
| "No answer" outcome | 3 days |
| "Seen no reply" outcome | 5 days |
| "Not interested" outcome | 60 days |
| "Do Not Contact" outcome | Permanent |
| Customer placed any order (from BI API) | 7 days |
| Assignment locked to another salesperson | Permanent (until manager reassigns) |

### 6.5 Daily Outbound Goal with Nudges

- Default target: 15 contacts/day (configurable by manager per salesperson)
- Progress bar visible on cockpit home
- If below 50% by 3 PM → in-app nudge displayed
- Daily goal resets at midnight Bangkok time (UTC+7)

### 6.6 Revenue Attribution

When a win-back customer places an order:
- Nightly check: query BI API for recent orders
- Match customer email to assignment with contact_attempt in last 30 days
- Auto-populate `resulted_in_order_id` on the contact_attempt
- Credit appears on salesperson's "Win-Back Won" counter

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
│   │   ├── customer/[email]/page.tsx
│   │   ├── performance/page.tsx
│   │   └── log/[assignmentId]/page.tsx
│   ├── (manager)/
│   │   ├── dashboard/page.tsx
│   │   ├── assignments/page.tsx
│   │   ├── scripts/page.tsx
│   │   ├── promotions/page.tsx
│   │   └── sync/page.tsx
│   └── api/
│       ├── bi/[...path]/route.ts       # Server proxy to BI API
│       ├── sheets/sync/route.ts        # Google Sheets pull
│       ├── recommend/[email]/route.ts  # Taste profile + recs
│       └── webhook/line/route.ts       # LINE integration
├── components/
│   ├── ui/                             # shadcn components
│   ├── customer/                       # 360 view widgets
│   │   ├── identity-card.tsx
│   │   ├── purchase-timeline.tsx
│   │   ├── taste-profile.tsx
│   │   └── ai-recommendations.tsx
│   ├── charts/                         # KPI visualizations
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
│   ├── bi-client.ts                    # Typed BI API wrapper
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── taste-profile.ts               # Recommendation engine
│   ├── sheets-parser.ts               # Google Sheets CSV parser
│   ├── assignment-engine.ts           # Mixed balanced assignment
│   └── cooldown.ts                    # Suppression rule engine
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       └── 002_seed_scripts_promos.sql
└── data/
    ├── winback-list.csv               # Archive of initial import
    ├── sales-kpi-data.csv             # Archive
    └── sales-activity-log.csv         # Archive
```

## 10. Implementation Phases

### Phase 1 — MVP (Week 1-2)

**Goal:** Get the team doing outbound immediately with basic tooling.

Deliverables:
- Auth (4 accounts: Manager, Yui, Boo, Mie)
- Import 1,340 winback customers from BI API rfm_snapshot
- Mixed assignment split (auto-balanced by value + segment)
- Sales Cockpit (today's list, daily goal tracker)
- Customer 360 (purchase timeline, taste profile, AI recommendations)
- Log Contact modal (structured outcomes, 6 types)
- Manager Dashboard (team pulse, heatmap, alerts)
- Script library (seeded with luxury templates)
- Cooldown rules + suppression
- KPI sheet manual sync
- Thai + English support
- Mobile-responsive design

### Phase 2 — Activation (Week 3-4)

Deliverables:
- LINE OA integration (one-tap outbound with auto-logging)
- Promotion catalog with performance tracking
- Revenue attribution loop (order match within 30 days)
- Auto-sync KPI from Google Sheets (cron schedule)
- Email/LINE notifications for overdue follow-ups
- Enhanced mobile touch UX

### Phase 3 — Culture (Week 5+)

Deliverables:
- Named leaderboard (feature flag unlock)
- Weekly challenges / contests
- "Win-back of the week" recognition
- Personal trend reports per salesperson
- Slack/LINE notifications for wins

## 11. Acceptance Criteria (MVP)

The MVP is complete when:

1. Manager can log in, see all 3 salespeople's assignments, and reassign a customer
2. A salesperson can log in, see their 400+ customers, click one, and see full 360 view with AI-recommended products from BI API
3. A salesperson can log a contact attempt in under 30 seconds
4. Cooldown prevents re-contact within the defined suppression period
5. Manager dashboard shows week's performance, outbound heatmap, and alerts
6. KPI data from Google Sheet syncs correctly via "Sync" button
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
| Week 1-2 | Build MVP |
| Week 3 | Internal test (manager only, fix bugs) |
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
| Google Sheet format changes break sync | Medium | Manual sync button as fallback; format validation |
| Thai character encoding issues | Medium | Test UTF-8 on all inputs before launch |
| Customer complains about contact | Medium | DNC outcome + 7-day cooldown enforced |
| Salesperson contacts wrong person | Low | Assignment locking — one customer, one owner |

---

*Generated 2026-04-16. This document should be reviewed and approved before implementation begins.*
