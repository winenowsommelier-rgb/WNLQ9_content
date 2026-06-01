# 🎯 SKILL: Premium Content Replacement Workflow
## Replicable Process for Multi-Topic Content Replacements

**Skill ID:** premium-content-replacement-v1
**Category:** Content Strategy & Production
**Scope:** Replace 5-10 underperforming/review-status content items with premium-focused alternatives
**Personas:** Luxury market collectors, high-net-worth consumers, investment seekers
**Outcomes:** Production-ready content briefs, Notion database updates, SEO-optimized keywords

> **How to invoke:** Tell Claude "run the premium content replacement workflow" (or point it at
> this file). Claude reads this file + `01-WORKFLOW-MEMORY.md`, confirms inputs, then executes
> the 7 phases. To turn this into an actual auto-loading Claude skill, see "Make This a Real Skill" below.

---

## 📖 WHEN TO USE THIS SKILL

✅ **Use when:**
- You have 5-10 "Review"/"In Progress" items in your CMS to replace
- You want trending, premium-focused replacement topics
- You have (or can do) market research
- You need production-ready briefs in a standardized template
- Goal = SEO traffic + collector/investor engagement
- Multi-site platforms (Wine-Now, LIQ9, etc.)
- Bilingual readiness (EN + other language)

❌ **Don't use for:**
- Content enhancement (improving existing items)
- Single-topic creation (1-3 items — just brainstorm)
- Non-premium / casual-audience blog posts
- CMS without structured database fields

---

## 📋 SKILL INPUTS (REQUIRED)

1. **Old Content to Replace** — list of 5-10 items, status, titles, categories, which CMS
2. **Market Positioning** — personas (Collector/Investor/Enthusiast/Explorer), premium yes/no, geo markets, languages
3. **Template Reference** — which template/database defines structure; required fields (KEY/TENSION/STORY, Image Prompts, FAQ, CTAs); examples
4. **Platform Details** — CMS/database, database ID/link, custom fields to populate

---

## 🚀 SKILL EXECUTION (7 PHASES)

### PHASE 1: DISCOVERY & ALIGNMENT (30 min)
Confirm REPLACE intent; identify 5-10 old items; document personas & positioning; get template reference; define success metrics; confirm CMS details. → **Output:** Discovery summary (1 page).

### PHASE 2: MARKET RESEARCH (45 min)
Web search (trends / investment / emerging / luxury) for your category; extract market sizes, CAGR %, producer names, price tiers, auction records, regional data; compile 40+ cited data points. → **Output:** Research summary.

### PHASE 3: TOPIC IDEATION & SELECTION (30 min)
Brainstorm 15-20 ideas; organize by site; balance content types; select 5-10 by growth + collector appeal; verify 1:1 mapping to old items. → **Output:** Topic selection (old→new mapping).

### PHASE 4: COMPLETE BRIEF CREATION (60 min)
For each topic: Content Brief (KEY/TENSION/STORY); Image Strategy (Editorial + POP); Controversy Angle; Production Notes (LINE CTA, Main CTA, widgets, related articles); FAQ (3-5); Persona Target; Target Keyword. → **Output:** 5-10 complete briefs.

### PHASE 5: RESEARCH INTEGRATION (45 min)
Embed producer names (not generic), exact growth rates, auction records, price points, regional details; 3-5 data points per brief; review for specificity. → **Output:** Enhanced briefs.

### PHASE 6: DATABASE REPLACEMENT (30 min)
Fetch schema; create 5-10 entries (Title, Content Brief, Keyword, Type, Site, Status="Not started", Category, CTA, custom fields); verify; create mapping log. **Explicitly handle the OLD items** (archive/delete or mark replaced) so you don't leave duplicates. → **Output:** New CMS entries + mapping.

### PHASE 7: HANDOFF & DOCUMENTATION (20 min)
Create/update memory doc; summarize briefs; document remaining steps; quick-start guide; save into repo. → **Output:** Memory doc + quick-start.

**⏱️ TOTAL: ~4.5 hours (1 focused session)**

---

## 📊 TYPICAL OUTPUTS
- ✅ Research summary (40+ data points, producers, CAGR %, market sizes, price tiers, regions)
- ✅ Content briefs (5-10) with KEY/TENSION/STORY, Image Strategy, Controversy, Production Notes, FAQ, persona
- ✅ Database update (5-10 live entries, Status = "Not started", mapping doc)
- ✅ Memory document (process summary, brief table, production checklist, quick-start)

---

## 🔧 PLATFORM ADAPTATIONS

**Notion:** `notion-fetch` schema → `notion-create-pages` → populate Title, Content Brief, Keywords, Site, Status, Week Theme, Category, CTA → Status = "Not started". To remove old items, update their Status or move/trash them — confirm with owner first.

**WordPress/CMS:** Adapt to custom post types; populate Title, Meta Description, Category, Tags, custom fields; Status = "Draft"; internal-link related articles.

**Multi-Site (Wine-Now + LIQ9):** 5 topics/site; balance content types; site-specific CTAs/widgets; separate production checklists.

**Bilingual:** Structure briefs for easy translation; note cultural nuances during Phase 5; site/language-specific CTAs; language-agnostic image prompts.

---

## 💡 PRO TIPS

**Research:** specific producer names > category trends; extract CAGR %; find auction prices/records; note emerging regions; keep source URLs.

**Briefs:** lead with conflict/tension; one anchor statistic ($812K, 12.25% CAGR); specific CTAs (not "learn more"); related-article links; SEO-worthy FAQ questions.

**Integration:** name producers; exact numbers (55% US+UK, not "majority"); price points ($60-150, not "expensive"); specify regions (Douro, Mount Etna); verify sources.

**Next session:** save memory doc in repo; keep research summary; use quick-start; update lessons learned after each run.

---

## 📌 COPY-PASTE 7-PHASE CHECKLIST
```
PHASE 1: DISCOVERY (30 min)
- [ ] Confirm REPLACE intent
- [ ] Identify 5-10 old items
- [ ] Document personas
- [ ] Get template reference
- [ ] Define success metrics

PHASE 2: MARKET RESEARCH (45 min)
- [ ] 4 web searches (trends, investment, emerging, luxury)
- [ ] Extract 40+ data points
- [ ] Find producer names & regional data
- [ ] Compile with source URLs

PHASE 3: TOPIC IDEATION (30 min)
- [ ] Brainstorm 15-20 ideas
- [ ] Select 5-10 best
- [ ] Organize by site/type
- [ ] Create topic list

PHASE 4: BRIEF CREATION (60 min)
- [ ] Content Brief (KEY/TENSION/STORY) × N
- [ ] Image Strategy × N
- [ ] Controversy Angle × N
- [ ] Production Notes × N
- [ ] FAQ × N
- [ ] Persona target × N

PHASE 5: RESEARCH INTEGRATION (45 min)
- [ ] Add producer names
- [ ] Embed growth rates & market sizes
- [ ] Include auction data, price points
- [ ] Add regional details
- [ ] 3-5 research points per brief

PHASE 6: DATABASE REPLACEMENT (30 min)
- [ ] Fetch database schema
- [ ] Create N new items
- [ ] Populate all required fields
- [ ] Handle OLD items (archive/delete/mark)
- [ ] Create mapping document

PHASE 7: HANDOFF & DOCUMENTATION (20 min)
- [ ] Create/update memory document
- [ ] Summarize all briefs
- [ ] Document next steps
- [ ] Save into repo (not /tmp)
```

---

## 🧩 MAKE THIS A REAL CLAUDE SKILL (optional, recommended)

This repo already ships custom skills under `.claude/skills/` (e.g. `wine-analysis`). To make
this invokable as `/premium-content-replacement`, create:

```
.claude/skills/premium-content-replacement/SKILL.md
```

with YAML frontmatter, e.g.:
```yaml
---
name: premium-content-replacement
description: >
  Replace 5-10 "Review"/"In Progress" CMS items with premium, research-backed
  topics. Runs a 7-phase workflow (discovery, market research, ideation, brief
  creation, research integration, Notion/CMS update, handoff). Use when the user
  says "replace review items", "premium content replacement", "refresh the month
  plan", or references the WNLQ9 content calendar.
---
```
The body should point to `docs/wnlq9/01-WORKFLOW-MEMORY.md` and `03-FULL-BRIEFS.md` as
references and embed the 7-phase checklist above. Then `/premium-content-replacement` will
load this process automatically each session.

> **Open-source alternative:** The Anthropic "skills" pattern (and community skill
> marketplaces like `obra/superpowers`) is the closest off-the-shelf approach. For content
> ops specifically, no single OSS tool beats this for *replacement* scenarios — most assume
> net-new content. The strongest hybrid is **this workflow + HubSpot/Semrush Pillar-Cluster**
> SEO modeling layered into Phase 3.

---

**END OF SKILL DEFINITION** — *Version 1.0 | Wine-Now + LIQ9 Content Strategy*
