# Dashboard Sharing & Multi-Project Integration Guide

## Quick Start: Use Dashboard Across Multiple Projects

### Option 1: Single Dashboard, Multiple Data Sources (Recommended)

The dashboard connects to **one Supabase project** but can aggregate data from many sources:

```typescript
// lib/supabase.ts - Add multi-source data fetching

export async function fetchMultipleProjects() {
  // TH Wine (th.wine-now.com)
  const thData = await supabase.from('seo_gsc_daily').select('*')
    .eq('site_url', 'https://th.wine-now.com')
  
  // LIQ9 TH (th.liq9.com)
  const liq9Data = await supabase.from('seo_gsc_daily').select('*')
    .eq('site_url', 'https://th.liq9.com')
  
  return { thData, liq9Data }
}
```

**Benefits:**
- Single dashboard for all sites
- Unified Slack alerts
- One cron job for all syncs
- Team collaboration on metrics

---

## Option 2: Connect Multiple Supabase Projects

Share dashboard code across **different Supabase projects** (if each brand has its own):

### Step 1: Create Project-Specific Config

```typescript
// lib/supabase-config.ts
const PROJECTS = {
  'th-wine': {
    url: 'https://project1.supabase.co',
    key: 'anon-key-1',
    siteUrl: 'https://th.wine-now.com',
  },
  'liq9-th': {
    url: 'https://project2.supabase.co',
    key: 'anon-key-2',
    siteUrl: 'https://th.liq9.com',
  },
}

export function getSupabaseClient(projectKey: string) {
  const config = PROJECTS[projectKey]
  return createClient(config.url, config.key)
}
```

### Step 2: Add Project Selector to Dashboard

```typescript
// app/page.tsx - Add selector
'use client'
import { useState } from 'react'

export default function Dashboard() {
  const [selectedProject, setSelectedProject] = useState('th-wine')
  
  return (
    <main>
      <select onChange={(e) => setSelectedProject(e.target.value)}>
        <option value="th-wine">TH Wine Now</option>
        <option value="liq9-th">LIQ9 TH</option>
      </select>
      {/* Rest of dashboard */}
    </main>
  )
}
```

---

## Option 3: Deploy Dashboard as NPM Package

Share the dashboard code as a reusable npm package:

### Step 1: Create Package Structure

```
dashboard-package/
├── package.json
├── lib/
│   ├── supabase.ts
│   └── hooks.ts
├── components/
│   ├── Dashboard.tsx
│   ├── MetricsOverview.tsx
│   └── ...
└── index.ts
```

### Step 2: Publish to npm

```bash
# In dashboard-package/ directory
npm publish --access public
```

### Step 3: Use in Any Project

```bash
npm install @yourorg/seo-dashboard
```

```typescript
// pages/index.tsx
import { Dashboard } from '@yourorg/seo-dashboard'

export default function Home() {
  return <Dashboard 
    supabaseUrl="..." 
    supabaseKey="..."
  />
}
```

---

## Option 4: API-First Approach

Expose dashboard data via **REST API** for consumption by any app:

### Create API Endpoints

```typescript
// app/api/metrics/route.ts
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  const { data: gsc } = await supabase
    .from('seo_gsc_daily')
    .select('*')
    .eq('metric_date', date)
  
  return Response.json({ gsc })
}
```

### Use API from Any App

```javascript
// Any JavaScript app can fetch metrics
const response = await fetch('https://dashboard.vercel.app/api/metrics?date=2026-06-01')
const data = await response.json()
console.log(data.gsc) // GSC metrics from any project
```

---

## How to Query Multiple Data Sources

### Pattern 1: Aggregate Data from Multiple Tables

```typescript
// Fetch data from all sites at once
async function fetchAllSites() {
  const { data, error } = await supabase
    .from('seo_gsc_daily')
    .select(`
      *,
      products(title_en, sku),
      regressions: seo_regression_alerts(*)
    `)
    .eq('metric_date', today)
  
  return data
}
```

### Pattern 2: Join with External APIs

```typescript
// Fetch GSC data, then enrich with Magento product data
async function enrichMetricsWithMagento() {
  const { data: metrics } = await supabase
    .from('seo_gsc_daily')
    .select('*')
  
  // Fetch from Magento API
  const magento = await fetch(MAGENTO_API_URL + '/products')
    .then(r => r.json())
  
  // Merge data
  return metrics.map(m => ({
    ...m,
    magentoData: magento.find(p => p.sku === m.sku)
  }))
}
```

### Pattern 3: Real-Time Data Sync

```typescript
// Subscribe to live updates
supabase
  .channel('seo_gsc_daily')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'seo_gsc_daily' },
    (payload) => {
      console.log('New metric:', payload.new)
      // Update UI in real-time
    }
  )
  .subscribe()
```

---

## Adding Custom Data Sources

### Example: Connect Magento API

```typescript
// lib/magento.ts
export async function fetchMagentoProducts() {
  const response = await fetch(
    `${process.env.MAGENTO_API_URL}/products`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.MAGENTO_TOKEN}`
      }
    }
  )
  return response.json()
}

// Use in dashboard
const magentoProducts = await fetchMagentoProducts()
```

### Example: Connect Google Analytics 4 API

```typescript
// lib/ga4.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data'

const client = new BetaAnalyticsDataClient({
  projectId: process.env.GCP_PROJECT_ID,
  keyFile: process.env.GCP_KEY_FILE,
})

export async function fetchGA4Metrics() {
  const response = await client.runReport({
    property: `properties/${process.env.GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
    ],
  })
  
  return response[0].rows
}
```

---

## Environment Variables for Multi-Project

```bash
# .env.local

# Current Project (TH Wine Now)
NEXT_PUBLIC_SUPABASE_URL=https://asnarjokyedupsjipzkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Additional Projects (Optional)
SUPABASE_PROJECT2_URL=https://project2.supabase.co
SUPABASE_PROJECT2_KEY=eyJhbGc...

# External Data Sources
MAGENTO_API_URL=https://magento.example.com/rest/V1
MAGENTO_TOKEN=xxx
GA4_PROPERTY_ID=377750759
GCP_PROJECT_ID=wnlq0-seo
```

---

## Deployment Strategies

### Strategy 1: Single Vercel App (All Sites)
- **Dashboard URL**: `https://seo-dashboard.vercel.app`
- **Access**: All team members → all sites
- **Setup**: ~5 minutes

### Strategy 2: Separate Vercel Apps per Brand
- **TH Wine**: `https://th-wine-dashboard.vercel.app`
- **LIQ9**: `https://liq9-dashboard.vercel.app`
- **Setup**: Clone repo, change env vars, deploy

### Strategy 3: Monorepo with Workspaces
```
monorepo/
├── apps/
│   ├── th-wine-dashboard/
│   ├── liq9-dashboard/
│   └── shared-dashboard/
└── packages/
    └── seo-dashboard-lib/
```

---

## Team Sharing Checklist

- [ ] Dashboard deployed to Vercel
- [ ] Share Vercel URL with team: `https://your-dashboard.vercel.app`
- [ ] Add team members to Vercel project
- [ ] Configure Supabase Row Level Security (RLS) for team access
- [ ] Set up Slack channel for daily alerts
- [ ] Document dashboard features in team wiki

---

## Security: Protecting Multi-Project Access

### Row Level Security (RLS) Policy

```sql
-- Only allow viewing metrics, not modifying
CREATE POLICY "allow_select_metrics" ON seo_gsc_daily
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Prevent deletes/updates
CREATE POLICY "no_modify" ON seo_gsc_daily
  FOR UPDATE, DELETE
  USING (false);
```

### Environment Variable Management

```bash
# Never commit secrets
echo ".env.local" >> .gitignore

# Use Vercel Environment Variables for production
# Dashboard → Settings → Environment Variables
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Quick Links

- **Deploy Dashboard**: https://vercel.com/new
- **Supabase Docs**: https://supabase.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **Real-time Updates**: https://supabase.com/docs/guides/realtime

---

## Questions?

- **Adding new metric?** Update `lib/supabase.ts` and create component
- **New data source?** Create file in `lib/` and fetch in dashboard
- **Multiple projects?** Use Option 1 (single dashboard, multiple sources)
- **Team permissions?** Configure in Vercel and Supabase

Next: Deploy to Vercel and share URL with team → https://vercel.com/new
