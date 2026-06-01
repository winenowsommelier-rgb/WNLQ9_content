# 🎯 Premium Content Replacement Workflow — Process Definition

> **Status:** Reference document (not a runnable `.claude` skill yet — building the auto-triggering skill was deferred). To activate as a real skill later, move/adapt this into `.claude/skills/premium-content-replacement/SKILL.md` with YAML frontmatter.

**Process ID:** premium-content-replacement-v1
**Category:** Content Strategy & Production
**Scope:** Replace 5–10 underperforming / "Review"-status content items with premium-focused alternatives
**Personas:** Luxury collectors, high-net-worth consumers, investment seekers
**Outcomes:** Production-ready briefs, CMS/Notion updates, SEO keywords

---

## 📖 When to Use
✅ You have 5–10 "Review"/"In Progress" items in a CMS to replace with trending premium topics, need standardized briefs, target SEO + collector/investor engagement, multi-site (Wine-Now, LIQ9), bilingual-ready.
❌ Not for: enhancing existing items, single-topic creation, non-premium content, CMS without structured fields.

## 📋 Required Inputs
1. **Old content** — list of items + status + titles + CMS location
2. **Positioning** — personas, premium focus, markets, languages
3. **Template reference** — which structure to follow + required fields
4. **Platform** — CMS/DB + ID + custom fields to populate

---

## 🚀 Execution (7 Phases · ~4.5 hrs)

**1. Discovery (30m):** confirm REPLACE intent; identify items; personas; template; metrics. → *Discovery summary*
**2. Market Research (45m):** 4 searches (trends / investment / emerging / luxury); extract sizes, CAGR %, producers, tiers, auction records. → *40+ cited data points*
**3. Topic Ideation (30m):** brainstorm 15–20; organize by site; balance types; select 5–10; verify 1:1 map. → *Topic selection (old→new)*
**4. Brief Creation (60m):** per topic — Content Brief (KEY/TENSION/STORY), Image Strategy (editorial+POP), Controversy, Production Notes (LINE/Main CTA, widgets, related), FAQ (3–5), Persona, Target Keyword. → *5–10 briefs*
**5. Research Integration (45m):** add producer names, exact growth rates, auction/price points, regional detail; 3–5 per brief. → *Enhanced briefs*
**6. Database Replacement (30m):** fetch schema; create items (Title, Brief, Keyword, Type, Site, Status="Not started", Category, CTA); verify; mapping log. → *Live CMS entries + mapping*
**7. Handoff & Docs (20m):** memory doc; brief summary; remaining steps; quick-start. → *Memory document*

---

## 📊 Outputs
- Research summary (40+ data points, producer spotlights, CAGR/sizes/tiers)
- 5–10 complete briefs (KEY/TENSION/STORY, image prompts, controversy, production notes, FAQ, persona)
- CMS update (Status="Not started") + old→new mapping
- Memory document + quick-start

## 🔧 Platform Adaptation
- **Notion:** `notion-fetch` schema → `notion-create-pages` → populate fields → Status="Not started".
- **WordPress/CMS:** map to custom post types; Status="Draft"; internal-link related.
- **Multi-site:** 5 topics/site; site-specific CTAs/widgets; separate checklists.
- **Bilingual:** structure for easy translation; note cultural nuances in Phase 5; image prompts language-agnostic.

## 💡 Pro Tips
- Research: specific producer names; CAGR % over "growing"; auction prices; emerging regions; source URLs.
- Briefs: lead with tension; one anchor statistic; specific CTAs; related links; searchable FAQ questions.
- Integration: name producers, exact numbers, price points, named regions; verify sources.

## 🎓 What Comes Next (Production)
Writing (1200–1500w, EN+TH) → Visuals (editorial+POP, infographics, featured) → SEO (headers, schema, internal links, alt text) → Publishing & analytics (schedule, GA4, ranks, CTR).

---

## 📌 Copy-Paste 7-Phase Checklist
```
PHASE 1 DISCOVERY      [ ] replace intent [ ] 5–10 items [ ] personas [ ] template [ ] metrics
PHASE 2 RESEARCH       [ ] 4 searches [ ] 40+ data points [ ] producers/regions [ ] sources
PHASE 3 IDEATION       [ ] 15–20 ideas [ ] select 5–10 [ ] by site/type [ ] topic list
PHASE 4 BRIEFS         [ ] KEY/TENSION/STORY [ ] image [ ] controversy [ ] production [ ] FAQ [ ] persona
PHASE 5 INTEGRATION    [ ] producers [ ] growth rates [ ] auction/price [ ] regions [ ] 3–5/brief
PHASE 6 DATABASE       [ ] schema [ ] create items [ ] fields [ ] mapping log
PHASE 7 DOCS           [ ] memory doc [ ] summary [ ] next steps [ ] quick-start
```

## 🔄 Continuous Improvement
After each run: update the memory doc (actual times, lessons); refine topic scoring rubric; expand research query templates; enrich brief fields (social hooks, video outlines, collector/controversy quotes).

## 🚀 Example Invocations
"Replace 10 old wine articles with premium investment content" · "Create 5 new spirits topics for collector portfolios" · "Refresh Q2 content with trending luxury topics."

---
*Version 1.0 · Wine-Now + LIQ9 Content Strategy*
