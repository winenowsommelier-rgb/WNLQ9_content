# WNLQ9 Blog Workflow Dashboard — Implementation Roadmap

## 🎉 Phase 0: Setup Complete ✅

**Status:** Development environment fully initialized and verified

### What's Ready

- ✅ Next.js 14 project with TypeScript + Tailwind CSS
- ✅ Git repository initialized (clean main branch)
- ✅ Vercel deployment configuration ready
- ✅ Sample GA4 & GSC CSV data for development
- ✅ TypeScript type definitions for all data structures
- ✅ Environment configuration templates
- ✅ Comprehensive setup documentation (SETUP.md)
- ✅ Dev server running successfully
- ✅ Folder structure ready for components

### Quick Start (2 minutes)

```bash
cd /Users/admin/WNLQ9\ CONTENT/dashboard

# 1. Update .env.local with your Notion API token
# Get it from: https://www.notion.so/my-integrations

# 2. Start dev server
npm run dev

# 3. Open http://localhost:3000
```

---

## 📅 Week 1: MVP (Calendar + Brief Editor + Notion Sync)

### Priority 1: Calendar Component
**Time:** 2-3 hours  
**Files:** `components/Calendar/`  
**Deliverable:** Month grid showing brief status by date, click to create

```tsx
// Usage
<Calendar 
  briefs={notionBriefs}
  onDateSelect={(date) => openBriefForm(date)}
/>
```

**Tasks:**
- [ ] Read existing briefs from Notion database
- [ ] Build month grid with status color coding
- [ ] Add click handler to create brief for date
- [ ] Display legend (Pending/Brief Ready/In Progress/Review/Done/Published)

---

### Priority 2: Brief Editor Form
**Time:** 2-3 hours  
**Files:** `components/Brief/BriefEditor.tsx`  
**Deliverable:** Form to create/edit briefs with KEY/TENSION/STORY fields

```tsx
<BriefEditor 
  date={selectedDate}
  brand="wine-now"
  onSave={(brief) => saveBrief(brief)}
/>
```

**Fields:**
- Date (read-only)
- Brand (Wine-Now / LIQ9)
- Headline (text)
- KEY (textarea, 500 chars)
- TENSION (textarea, 500 chars)
- STORY (textarea, 1000 chars)
- SEO Keyword (text, from GSC suggestions)
- Status (auto-set to "Brief Ready")

**Tasks:**
- [ ] Create form layout with Tailwind
- [ ] Add form validation
- [ ] Add Thai language support (contentEditable or input)
- [ ] Generate Brief ID (UUID)
- [ ] Show "Save to Notion" button
- [ ] Show "Cancel" button

---

### Priority 3: Notion Integration (Save Briefs)
**Time:** 2 hours  
**Files:** `lib/api/notion.ts`  
**Deliverable:** Create Notion rows from brief form

```ts
// Usage
await createNotionBrief({
  date: "2026-06-02",
  brand: "wine-now",
  headline: "Rosé Myths Debunked",
  key: "...",
  tension: "...",
  story: "...",
  seoKeyword: "best rosé wines",
});
```

**Implementation:**
- [ ] Set up Notion API client (npm package: `@notionhq/client`)
- [ ] Create function to build Notion row properties
- [ ] Handle API errors gracefully
- [ ] Validate NOTION_API_TOKEN in .env.local
- [ ] Test database connection on app startup

---

### Priority 4: Slack Notifications
**Time:** 1-2 hours  
**Files:** `lib/api/slack.ts`  
**Deliverable:** Post notifications when brief is created

```ts
// Usage
await notifySlack({
  event: "brief-created",
  topic: "Rosé Myths Debunked",
  brand: "wine-now",
  date: "2026-06-02",
});
```

**Triggers:**
- Brief created → "✅ Brief ready: [Topic] ([Brand]) — [Date]"
- (Future) HTML generated
- (Future) Published to Magento

**Implementation:**
- [ ] Set up Slack webhook client
- [ ] Create notification formatters
- [ ] Add error logging (webhook failures shouldn't break form)
- [ ] Test webhook connection on app startup

---

### Priority 5: Settings Panel
**Time:** 1.5 hours  
**Files:** `components/Settings/SettingsPanel.tsx`  
**Deliverable:** Manage API tokens and data imports

**Sections:**
- **API Credentials** (read-only display with copy button)
  - Notion token (masked)
  - Slack webhook (masked)
  - Test connection buttons
- **Brand Configuration**
  - Wine-Now / LIQ9 (checkboxes)
- **Data Management**
  - Import GA4 CSV button → upload → cache
  - Import GSC CSV button → upload → cache
  - Refresh data button → clear cache + reload
  - Last import timestamp
- **Cache Status**
  - GA4: X topics loaded (expires in Y hours)
  - GSC: Y keywords loaded (expires in Y hours)

**Implementation:**
- [ ] Build settings layout
- [ ] Add file upload handlers (CSV)
- [ ] Parse CSV files into typed data
- [ ] Store in memory with TTL caching
- [ ] Add validation for CSV format

---

### Priority 6: Topic Intelligence Component
**Time:** 1.5 hours  
**Files:** `components/TopicIntelligence/TopicList.tsx`  
**Deliverable:** Display GA4 trends, filterable by brand

```tsx
<TopicIntelligence 
  topics={ga4Topics}
  brand="wine-now"
  onSelectTopic={(topic) => openBriefGeneratorWithTopic(topic)}
/>
```

**Display:**
- Table: Page Title | Views | Users | Bounce Rate | Device | Traffic
- Brand filter (Wine-Now / LIQ9)
- Sort by views (desc)
- Click row → select as brief topic

**Implementation:**
- [ ] Create table component with Tailwind
- [ ] Load GA4 data from cache or CSV import
- [ ] Add brand filter logic
- [ ] Add click handler to pre-fill Brief Generator

---

### Priority 7: Keyword Manager Component
**Time:** 1.5 hours  
**Files:** `components/KeywordManager/KeywordList.tsx`  
**Deliverable:** Display GSC keywords, sortable by brand/intent/opportunity

```tsx
<KeywordManager 
  keywords={gscKeywords}
  onSelectKeyword={(keyword) => useSeoKeywordInBrief(keyword)}
/>
```

**Display:**
- Table: Keyword | Brand | Impressions | Clicks | CTR | Position | Intent
- Brand filter
- Sort by impressions (desc)
- Click row → use as SEO keyword in brief form

**Implementation:**
- [ ] Create table component with Tailwind
- [ ] Load GSC data from cache or CSV import
- [ ] Add brand + intent filter logic
- [ ] Add opportunity scoring (CTR × Position)

---

### Priority 8: Brief Generator (3 Options)
**Time:** 2 hours  
**Files:** `components/BriefGenerator/BriefGenerator.tsx`  
**Deliverable:** Generate 3 brief options from GA/GSC data

```tsx
<BriefGenerator 
  date={selectedDate}
  brand="wine-now"
  gaTrends={ga4Topics}
  gscKeywords={gscKeywords}
  onSelectOption={(option) => loadBriefForm(option)}
/>
```

**Flow:**
1. User selects date + brand
2. System picks:
   - Top 1-2 GA topics for that brand
   - Top GSC keywords related to those topics
   - Create 3 different narrative spins (KEY/TENSION/STORY)
3. User picks best option
4. Open Brief Editor with pre-filled fields

**Implementation:**
- [ ] Identify GA topic relevance to brand
- [ ] Cluster GSC keywords by topic
- [ ] Create 3 narrative templates (wine education / spirit trends / pairing guides)
- [ ] Generate variation for each (different KEY/TENSION/STORY angle)
- [ ] Calculate confidence score for each option

---

## 🧪 Week 1 Integration Testing

**Test Scenarios:**
- [ ] Import GA CSV → data displays in Topic Intelligence
- [ ] Import GSC CSV → data displays in Keyword Manager
- [ ] Select GA topic → Brief Generator pre-fills headline + keyword
- [ ] Fill brief form → Save to Notion → Row created
- [ ] Brief saved → Slack notification fires
- [ ] Calendar refreshes → New brief appears with "Brief Ready" status
- [ ] Edit brief → Changes persisted to Notion
- [ ] Delete brief → Row removed from Notion + Calendar updated

---

## 📋 Week 2: Polish & Publication Tracker

*(Following Week 1 completion)*

- [ ] Publication Tracker component (Gantt-style grid)
- [ ] GA/GSC data refresh scheduling (manual button + auto-refresh)
- [ ] Keyword clustering (group by topic)
- [ ] Team collaboration features (comments on briefs)
- [ ] Responsive design (tablet/mobile)
- [ ] Thai language full support
- [ ] WCAG AA accessibility audit
- [ ] User documentation + video guide
- [ ] Deploy to Vercel staging

---

## 🔗 Week 3: API Integration (Real-time Data)

*(Deferred, after GA4 API + GSC API setup)*

- [ ] Google Cloud Project setup
- [ ] GA4 API service account configuration
- [ ] GSC API service account configuration
- [ ] Replace CSV imports with live API calls
- [ ] Data refresh scheduling (hourly GA, daily GSC)
- [ ] API error handling + fallback strategies
- [ ] Production deployment to Vercel

---

## 📊 Architecture Notes

### Data Flow
```
┌─────────────────────┐
│  Manual CSV Import  │ (Week 1-2)
│  or GA4/GSC API     │ (Week 3)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  In-Memory Cache    │ (6-hour TTL)
│  GA4: GA4Dataset    │
│  GSC: GSCDataset    │
└──────────┬──────────┘
           ↓
┌─────────────────────────────────────┐
│   Dashboard Components              │
│  - Topic Intelligence               │
│  - Keyword Manager                  │
│  - Brief Generator (3 options)      │
│  - Brief Editor                     │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────┐
│  Brief Object (App) │
└──────────┬──────────┘
           ↓
┌──────────────────────────────────┐
│  Save to Notion                  │
│  ↓ Create Notion row             │
│  ↓ Auto-set status: Brief Ready  │
└──────────┬───────────────────────┘
           ↓
┌──────────────────────────────────┐
│  Slack Notification              │
│  "✅ Brief ready: [Topic]"       │
└──────────────────────────────────┘
```

### State Management
- Brief form state → local React state (useState)
- Cached GA/GSC data → global context or Zustand store
- Settings (API tokens) → localStorage (masked display only)
- Notion briefs → fetched on app startup, cached locally

### API Routes
- `POST /api/notion/briefs` → Create brief in Notion
- `GET /api/notion/briefs` → Read all briefs for calendar
- `PUT /api/notion/briefs/:id` → Update brief status
- `POST /api/slack/notify` → Send notification
- `POST /api/data/validate` → Test API connections

---

## 🚀 Deployment Checklist

- [ ] All env variables set in Vercel project
- [ ] Notion token validated
- [ ] Slack webhook tested
- [ ] Build succeeds locally (`npm run build`)
- [ ] Dev server works (`npm run dev`)
- [ ] All Week 1 features tested
- [ ] No console errors in production build
- [ ] Performance: page load <2s
- [ ] Vercel preview deployment successful
- [ ] Production deployment to main URL

---

## 📝 Notes

- **Thai Language:** All user content (briefs, topics, keywords) supports Thai characters. UI labels stay in English.
- **CSV Format:** See `data/sample-*.csv` for expected format. Strict header matching required.
- **Caching:** GA/GSC data cached 6 hours. Refresh button clears cache and re-loads from latest CSV.
- **Notion Field Mapping:** See SETUP.md for exact field names and types.
- **Error Handling:** API errors (Notion, Slack) should not break the form. Log to console + show friendly message.

---

**Last updated:** May 30, 2026  
**Status:** Ready to start Week 1 implementation