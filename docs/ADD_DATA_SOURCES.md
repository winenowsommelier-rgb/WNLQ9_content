# How to Add New Data Sources to Dashboard

## 3-Step Process to Connect Any Data Source

### Step 1: Create Data Fetch Function

Create a new file in `lib/`:

```typescript
// lib/your-source.ts
export interface YourDataType {
  id: string
  name: string
  value: number
  timestamp: string
}

export async function fetchYourData(): Promise<YourDataType[]> {
  // Option A: From Supabase table
  const { data, error } = await supabase
    .from('your_table_name')
    .select('*')
    .limit(100)
  
  if (error) throw error
  return data || []
  
  // Option B: From external API
  // const response = await fetch('https://api.example.com/data')
  // return response.json()
}
```

### Step 2: Create Display Component

Create component in `components/`:

```typescript
// components/YourDataComponent.tsx
import { YourDataType } from '@/lib/your-source'

export function YourDataDisplay({ data }: { data: YourDataType[] }) {
  if (!data.length) return <p>No data yet</p>
  
  return (
    <div className="section">
      <h2>📊 Your Data Title</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.value}</td>
              <td>{new Date(item.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Step 3: Add to Dashboard

Update `app/page.tsx`:

```typescript
'use client'
import { fetchYourData, YourDataType } from '@/lib/your-source'
import { YourDataDisplay } from '@/components/YourDataComponent'

export default function Dashboard() {
  const [yourData, setYourData] = useState<YourDataType[]>([])
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchYourData()
        setYourData(data)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000) // Refresh every 5 min
    return () => clearInterval(interval)
  }, [])
  
  return (
    <main>
      {/* Existing components */}
      <YourDataDisplay data={yourData} />
    </main>
  )
}
```

---

## Ready-Made Examples

### Example 1: Magento Products

```typescript
// lib/magento.ts
export async function fetchTopProducts() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_MAGENTO_API_URL}/products`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.MAGENTO_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  )
  
  const data = await response.json()
  return data.items.slice(0, 10) // Top 10
}
```

### Example 2: Google Search Console API

```typescript
// lib/gsc-api.ts
import { BetaSearchAnalyticsDataClient } from '@google-analytics/data'

export async function fetchGSCData(siteUrl: string) {
  const client = new BetaSearchAnalyticsDataClient({
    projectId: process.env.GCP_PROJECT_ID,
    keyFile: process.env.GCP_SERVICE_ACCOUNT_KEY,
  })
  
  // Query Search Console API
  // Returns: queries, clicks, impressions, ctr, position
}
```

### Example 3: External REST API

```typescript
// lib/external-api.ts
export interface ExternalData {
  id: string
  status: string
  metric: number
}

export async function fetchExternalMetrics(): Promise<ExternalData[]> {
  const response = await fetch('https://api.example.com/metrics', {
    method: 'GET',
    headers: {
      'X-API-Key': process.env.EXTERNAL_API_KEY || '',
    },
  })
  
  if (!response.ok) throw new Error('API Error')
  return response.json()
}
```

### Example 4: Database (Other than Supabase)

```typescript
// lib/postgres.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function fetchFromPostgres() {
  const result = await pool.query(
    'SELECT * FROM metrics WHERE metric_date = CURRENT_DATE'
  )
  return result.rows
}
```

### Example 5: CSV File Upload

```typescript
// app/api/upload-csv/route.ts
import { parse } from 'papaparse'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  const text = await file.text()
  const { data } = parse(text, { header: true })
  
  // Insert to Supabase
  const { error } = await supabase.from('imported_data').insert(data)
  
  return Response.json({ success: !error })
}
```

---

## Common Data Source Patterns

### Pattern 1: Poll Every N Minutes

```typescript
useEffect(() => {
  fetchData() // Fetch immediately
  
  // Then poll every 5 minutes
  const interval = setInterval(fetchData, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
```

### Pattern 2: Real-Time Subscriptions

```typescript
useEffect(() => {
  // Subscribe to Supabase changes
  const subscription = supabase
    .channel('my-table')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'my_table' },
      (payload) => {
        setData(prev => [payload.new, ...prev])
      }
    )
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [])
```

### Pattern 3: Caching with SWR

```typescript
import useSWR from 'swr'

export function useData() {
  const { data, error } = useSWR('key', fetchData, {
    refreshInterval: 5 * 60 * 1000, // Refresh every 5 min
    revalidateOnFocus: false,
  })
  
  return { data, loading: !data, error }
}
```

---

## Adding Environment Variables

For your new data source, add to `.env.local`:

```bash
# External API
NEXT_PUBLIC_API_URL=https://api.example.com
API_SECRET_KEY=xxx

# Database
DATABASE_URL=postgresql://...

# File uploads
MAX_FILE_SIZE=10485760 # 10MB
```

On Vercel, add in **Project Settings → Environment Variables**

---

## Testing Your New Data Source

```bash
# Test locally
npm run dev

# Visit http://localhost:3000 and check console for errors

# Verify data loads and displays
# Check Network tab for API calls
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Make sure file is in `lib/` and imported correctly |
| API 401 Unauthorized | Check API key in env vars |
| Data not displaying | Check component is added to `app/page.tsx` |
| Slow loading | Add loading state, consider pagination |
| CORS error | Check API has correct CORS headers |

---

## File Checklist for New Source

- [ ] Created `lib/your-source.ts` with fetch function
- [ ] Exported interface for TypeScript
- [ ] Created `components/YourComponent.tsx` 
- [ ] Added component to `app/page.tsx`
- [ ] Added state management in Dashboard
- [ ] Updated environment variables
- [ ] Tested locally

---

## Next Steps

1. **Choose your data source** (Supabase, API, CSV, etc)
2. **Create fetch function** following patterns above
3. **Create display component** with tables/charts
4. **Add to dashboard** and test
5. **Deploy to Vercel** - changes auto-deploy on push

Questions? See `/docs/DASHBOARD_SHARING_GUIDE.md` for multi-project setups.
