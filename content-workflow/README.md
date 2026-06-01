# 📂 content-workflow — Persistent Memory for WNLQ9 Content Production

This folder is the **durable "memory"** for the WNLQ9 (Wine-Now + LIQ9) premium content
production workstream. It was recovered on **2026-06-01** from a prior session whose
working files were written to `/tmp` and lost when the container recycled — now committed
so future sessions load context in ~2 minutes instead of re-discovering it.

## Read order for next session
1. **`WNLQ9-Content-Replacement-Workflow-MEMORY.md`** ⭐ — start here. Log + 7-phase process + 10 topics + what's next + quick-start (Section 7).
2. **`new-premium-topics-full-briefs.md`** — writer-facing full briefs for all 10 topics (KEY/TENSION/STORY, image prompts, FAQ, CTAs).
3. **`PREMIUM-CONTENT-REPLACEMENT-SKILL.md`** — the reusable process definition. (Not yet a runnable `.claude` skill — deferred.)

## Current state (as of recovery)
- ✅ Market research complete (40+ data points)
- ✅ 10 premium briefs created (5 Wine-Now, 5 LIQ9)
- ✅ Notion DB updated — 10 items, Status = "Not started"
- ✅ Old→new mapping documented
- ⏳ Next: Writing → Bilingual (EN+TH) → Visuals → SEO → Publishing

## ⚠️ Things to re-verify next session
- The 10 pages still exist in Notion DB `collection://6be4a7bb-d42c-4286-be1b-fa73e3635b45`, and the old "Review" items were handled as intended.
- Whether to promote `PREMIUM-CONTENT-REPLACEMENT-SKILL.md` into a real auto-triggering skill under `.claude/skills/`.

> **Note:** This content-production workstream lives in Notion; it is separate from the
> SEO automation/dashboard code (Supabase + Next.js + Vercel) that occupies the rest of this repo.
