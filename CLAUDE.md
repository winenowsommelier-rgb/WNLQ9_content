# CLAUDE.md — WNLQ9 content repo

This repo produces blog content for two Thai beverage e-commerce brands:
**Wine-Now** (wine) and **LIQ9** (spirits).

## Read this first
- **What to make next + brand strategy (data-backed) →** [`docs/CONTENT_STRATEGY.md`](docs/CONTENT_STRATEGY.md)
- **How to write content →** [`docs/CONTENT_PRODUCTION_PLAYBOOK.md`](docs/CONTENT_PRODUCTION_PLAYBOOK.md)
- **Where things live, keys, sync, deploy, get-up-and-running →** [`docs/RUNBOOK.md`](docs/RUNBOOK.md)
- **One-page console (Settings · Planning · Processing) →** `pipeline/public/index.html`
  ("Mission Control"; serves at `/`). Regenerate its data with `npm run data` in `pipeline/`.

> **Brand asymmetry (data-verified):** Wine-Now = SEO-volume play (real wine
> search demand). LIQ9 = premium/luxury **storytelling** play for AEO + brand +
> LINE conversion (barely indexed on Google; traffic is direct/LINE). Plan them
> differently — see `CONTENT_STRATEGY.md`.

Follow the playbook on every content session. Below are the rules that must never
be skipped.

## Golden rules
1. **Thai-first / Thai-only** articles. Full, ready-to-use posts at "Whisky 101
   v2" depth (`pipeline/public/content/liq9-day1-whisky-101.html` is the
   exemplar) — **never** brief-style drafts. Hit the Notion row's Word Target.
2. **No fabricated facts** (tax rates, prices, critic scores, vineyard
   hours/names, bestseller ranks, ABV/PPM specifics). Write around them, add a
   visible verify-note, and keep a verify-list. Real numbers only — from the BI
   feed or a cited source.
3. **Every product card carries a real, in-stock SKU** — `data-sku` attribute +
   a visible `SKU: <b>…</b>` chip — using only SKUs from the product feed. No
   matching stock → 0 cards + route to LINE. Soft badges only (no `#NN` ranks).
4. **Compliance:** approximate price `~฿` + "สอบถามราคา/สั่งซื้อทาง LINE";
   footer `ดื่มอย่างมีความรับผิดชอบ · 20+`; branded E-E-A-T byline.
5. **HTML:** standalone page, shared `assets/article.css`, Sarabun webfont,
   canonical, OG+Twitter (incl. og:image placeholder), three JSON-LD blocks
   (Article headline MUST match H1; FAQPage mirrors the on-page FAQ),
   `.figph`/`img` hold 16/9 aspect-ratio for CLS.

## Where things live
- Article HTML: `pipeline/public/content/*.html` (source of truth) + shared
  `assets/article.css`.
- Notion board `2026 JUN — WNLQ9 — Content Production` = what to make + status.
  When HTML is done: **Status = "Brief Ready"** (not "Done"); paste link into
  the **`Drive file URL`** property.
- Drive delivery root "WNLQ9 Blog Html center" =
  `1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm`. Upload **CSS-inlined, self-contained**
  HTML. ⚠️ Drive MCP can't overwrite/delete → re-uploads make same-name
  duplicates; clear-then-reupload for a clean refresh.
- **One fresh subfolder per batch/period.** For each content run, create a new
  subfolder under the delivery root named for its period (e.g.
  `WNLQ9 2026-JUN`, `WNLQ9 2026-JUL`) and upload that batch's files there — one
  copy per article. Because the MCP can't overwrite/delete, a clean per-period
  folder avoids duplicate pile-up, makes auditing a simple file-count check
  (N articles = N files), and keeps prior periods untouched. Point each Notion
  row's `Drive file URL` at the file in the new folder.

## Git
- Develop on the session's feature branch; commit + push when work is complete.
- Don't open PRs unless asked. Production DB writes (Supabase migration/INSERT)
  need explicit user authorization.

## Workflow = Option B (no paid API)
Claude Code authors the Thai HTML and **uploads it to Drive via MCP**; it sets the
Notion row to **Brief Ready** + `Drive file URL`. The dashboard's server-side
Generate/Approve are intentionally left unconfigured (so it shows "Drafts authored
in Claude Code" / "Drive upload not configured" — that's expected, not an error).

## Infra
- Live Vercel project: **`seodashboard`** (Root Directory `pipeline/`, Production
  Branch **`main`**; push to `main` → auto-deploys). `seo-dashboard` and
  `wnlq-9-content-seo` are dead duplicates — ignore.
- `main` has an **unrelated git history** to the `claude/*` content branches; ship
  to prod by branching from `main`, copying deliverables in (additive), PR + merge.
- Env vars (set in Vercel; template `pipeline/.env.example`): dashboard needs
  `INGEST_SECRET` (= the passphrase) + `NOTION_TOKEN`. `ANTHROPIC_API_KEY`,
  `GOOGLE_SERVICE_ACCOUNT_JSON`/`DRIVE_FOLDER_ID`, `SUPABASE_*`, `CRON_SECRET` are
  optional and unused under Option B. Deployment Protection is ON (internal tool);
  the public blog is Magento, not this Vercel URL.
