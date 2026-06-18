# 🔄 Automated Content Optimization Workflow

**Status:** Ready to Deploy  
**Last Updated:** 2026-06-18  
**Branch:** `claude/lucid-bardeen-F6DjC`

---

## Overview

This fully automated workflow connects your SEO detection system to content optimization, automatically generates recommendations using Claude AI, tracks implementation, and monitors results.

```
Daily Sync (6 AM UTC)
    ↓
Detect Opportunities (72 found)
    ↓
Auto-Optimizer (7 AM UTC) ← YOU ARE HERE
    ├─ Fetch top 20 opportunities
    ├─ Generate 3 title + 3 description variants
    ├─ Store in seo_content_optimizations table
    └─ Auto-apply best recommendations (urgent only)
    ↓
Magento Webhook (auto-sync)
    ├─ Update product titles/descriptions
    └─ Log all changes
    ↓
Monitor Results (Daily)
    ├─ Track CTR improvements
    ├─ Calculate clicks gained
    └─ Update status to "completed"
    ↓
Dashboard Shows Full Pipeline
    ├─ Pending: Awaiting approval
    ├─ Applied: In progress (5-7 days)
    ├─ Completed: CTR results visible
    └─ All synced in real-time
```

---

## Setup Steps

### 1. **Deploy Database Schema**

Apply the migration to create the workflow tables:

```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase console:
# Copy contents of supabase/migrations/20260618_content_optimization_workflow.sql
# Paste into SQL editor and run
```

**Creates:**
- `seo_content_optimizations` — Stores recommendations & tracks status
- `optimization_webhook_log` — Audit trail of all changes
- RPC functions: `apply_optimization()`, `track_optimization_results()`

### 2. **Deploy Edge Functions**

```bash
# Deploy auto-optimizer function
supabase functions deploy auto-content-optimizer

# Set environment variables in Supabase
# ANTHROPIC_API_KEY (required) — Your Claude API key
# MAGENTO_WEBHOOK_URL (optional) — Webhook to send changes to Magento
```

### 3. **Add GitHub Actions Scheduler**

The workflow file already exists: `.github/workflows/seo-auto-optimizer.yml`

Set these secrets in your GitHub repo settings:

```
SUPABASE_FUNCTION_URL = https://[project-ref].supabase.co/functions/v1
SUPABASE_SERVICE_ROLE_KEY = [your-service-role-key]
```

**Runs automatically:**
- Every day at 7 AM UTC (configurable in the .yml file)
- Or manually: GitHub → Actions → Auto-Content Optimizer → "Run workflow"

### 4. **Configure Magento Integration (Optional)**

If you want auto-sync to Magento:

1. Create a webhook endpoint in Magento or use a middleware service
2. Point `MAGENTO_WEBHOOK_URL` in Supabase to your webhook
3. The Edge Function will send optimization events to it

Example webhook format:
```json
{
  "event": "optimization_applied",
  "keyword": "organic wine delivery",
  "site": "wine-now",
  "newTitle": "Best Organic Wines | Sustainable Delivery",
  "newDescription": "Shop certified organic wines with eco-friendly shipping..."
}
```

---

## Dashboard Components

### **OptimizationWorkflow Component**

Shows the complete pipeline:

```
┌─ Pending (needs review) → Click to approve & apply
├─ Applied (in progress) → CTR tracking for 5-7 days
├─ Monitoring (collecting data) → Wait for enough impressions
└─ Completed (results visible) → Shows CTR improvement %
```

**Location:** `/dashboard` → Scroll to "🔄 Automated Optimization Workflow"

**Features:**
- Real-time status tracking
- One-click approval/application
- Filter by status
- Results display with CTR improvement

### **ContentOptimizer Component**

Manual on-demand analysis (complements automation):

```
Click "✨ Analyze Top Opportunities"
→ Claude generates variants for top 20
→ Review & manually select best options
→ Apply to workflow
```

---

## Daily Workflow (Automated)

### **6:00 AM UTC - Sync Data**
- `sync-gsc-ga4` Edge Function fetches latest GSC + GA4 data
- Updates `seo_gsc_daily` and `seo_ga4_daily` tables

### **6:15 AM UTC - Detect Issues**
- `detect_seo_opportunities()` finds 72+ opportunities
- `detect_seo_regressions()` finds regressions
- Results stored in `seo_opportunities` and `seo_regression_alerts`

### **7:00 AM UTC - Optimize Content** ← AUTO-OPTIMIZER RUNS
- `auto-content-optimizer` Edge Function triggers
- Steps:
  1. Fetch top 20 opportunities (sorted by impact)
  2. Generate 3 title + 3 description variants using Claude
  3. Store in `seo_content_optimizations` (status = "pending")
  4. Auto-apply best variant to top 5 urgent items (status = "applied")
  5. Send Magento webhook if configured

### **7:30 AM UTC - Slack Alert**
- `seo-slack-alerts` sends daily summary
- Includes top opportunities, regressions, and new optimizations

### **Daily (24h cycle) - Monitor Results**
- Background job queries GSC for updated metrics
- Calls `track_optimization_results()` RPC
- Updates `ctr_after`, `ctr_improvement_percent`, `clicks_gained`
- Changes status to "completed" when improvement detected

---

## Monitoring & Troubleshooting

### Check Workflow Status

**In Dashboard:**
- Go to "🔄 Automated Optimization Workflow"
- Filter tabs show: Pending | Applied | Monitoring | Completed
- Click each card to see variants, approval status, results

**In Supabase Console:**

```sql
-- See all recommendations
select keyword, status, expected_impact_score, ctr_improvement_percent
from seo_content_optimizations
order by expected_impact_score desc;

-- See what was applied recently
select keyword, selected_title, selected_description, applied_at
from seo_content_optimizations
where status != 'pending'
order by applied_at desc;

-- See completed optimizations with results
select keyword, ctr_improvement_percent, clicks_gained
from seo_content_optimizations
where status = 'completed' and ctr_improvement_percent > 0
order by clicks_gained desc;
```

### Common Issues

**"No optimizations generated"**
- Check `ANTHROPIC_API_KEY` is set in Supabase
- Verify Edge Function deployed: `supabase functions list`
- Check logs: Supabase Console → Edge Functions → auto-content-optimizer

**"Status stays 'applied' (not moving to 'completed')"**
- Monitoring runs daily but needs 5-7 days of data
- Check GSC to confirm CTR actually changed
- If CTR improved but status didn't update, run manually:
  ```sql
  select track_optimization_results(
    'wine-now',
    'red wine under $20',
    0.025,  -- new_ctr (2.5%)
    12000   -- new_impressions
  );
  ```

**"Magento webhook not received"**
- `MAGENTO_WEBHOOK_URL` not set? Won't trigger (optional)
- Check webhook logs: `select * from optimization_webhook_log;`
- Verify webhook endpoint is live: `curl -X POST [your-url]`

---

## Expected Results Timeline

| Week | What Happens | Metrics |
|------|-------------|---------|
| **Week 1** | Top 5-10 urgent keywords get optimized | Status = "applied" |
| **Week 2** | CTR improvement visible in GSC | +20-50% CTR on updated keywords |
| **Week 3** | Results finalize in dashboard | Status = "completed" |
| **Month 1** | 15-20 keywords implemented | +100-300 additional clicks |
| **Month 2** | Full 72 opportunities processed | +200-500 additional clicks/month |

---

## Configuration Options

### Adjust Auto-Apply Threshold

Edit `supabase/functions/auto-content-optimizer/index.ts`:

```typescript
// Default: auto-apply top 5 urgent items
.limit(5)

// Change to 10 for more aggressive automation
.limit(10)
```

### Change Schedule

Edit `.github/workflows/seo-auto-optimizer.yml`:

```yaml
# Run at 8 AM instead of 7 AM
- cron: '0 8 * * *'

# Run every 6 hours
- cron: '0 */6 * * *'

# Run every weekday at 6 AM
- cron: '0 6 * * 1-5'
```

### Adjust Claude Model

Edit `supabase/functions/auto-content-optimizer/index.ts`:

```typescript
// Default: claude-opus-4-8 (most capable)
model: "claude-opus-4-8"

// Faster/cheaper: claude-sonnet-4-6
model: "claude-sonnet-4-6"

// Fastest/cheapest: claude-haiku-4-5
model: "claude-haiku-4-5-20251001"
```

---

## Integration Checklist

- [ ] Database migration applied (`20260618_content_optimization_workflow.sql`)
- [ ] Edge Function deployed (`auto-content-optimizer`)
- [ ] `ANTHROPIC_API_KEY` set in Supabase
- [ ] GitHub Actions secrets configured
- [ ] Dashboard loads `OptimizationWorkflow` component
- [ ] Test manual optimization via dashboard ("✨ Analyze Top Opportunities")
- [ ] Verify first automated run (check logs in 24 hours)
- [ ] (Optional) Configure Magento webhook for auto-sync

---

## Next Steps

1. **Today:** Deploy migration + Edge Function
2. **Tomorrow:** Verify first automated run in dashboard
3. **This Week:** Review pending recommendations & manually approve 5-10
4. **Next Week:** Monitor CTR improvements, iterate on thresholds
5. **Month 1:** Full automation running, 20+ keywords optimized, +100 clicks

---

## Support & Debugging

**Check Edge Function Logs:**
```bash
supabase functions logs auto-content-optimizer --limit 100
```

**Manual Trigger (for testing):**
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/auto-content-optimizer \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Query Workflow Status:**
```sql
-- Summary stats
select
  status,
  count(*) as count,
  round(avg(expected_ctr_lift), 2) as avg_ctr_lift,
  sum(clicks_gained) as total_clicks_gained
from seo_content_optimizations
group by status;
```

---

**The system is now fully automated. Let it run for 2-3 weeks and track results.** 🚀
