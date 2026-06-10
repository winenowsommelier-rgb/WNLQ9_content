# WNLQ9 — Operations Runbook (up & running ASAP)

The one page to spin this process back up fast. Pairs with:
- **`CLAUDE.md`** — rules auto-loaded into every Claude Code session.
- **`docs/CONTENT_STRATEGY.md`** — *what* to make next + brand strategy (GSC/GA4-backed).
- **`docs/SESSION_HANDOFF.md`** — subsystem map + verified infra state.
- **`docs/CONTENT_PRODUCTION_PLAYBOOK.md`** — *how* to write the content.
- **this file** — *where things live, the keys, the sync points, and how to deploy/run.*

> **Live data sources (verified 2026-06):** Google Search Console + Google
> Analytics 4 are both authed via the Supermetrics MCP (`winenowsommelier@gmail.com`).
> GSC accounts: `https://th.wine-now.com/`, `https://th.liq9.com/`. GA4 properties:
> WN TH `377750759`, LIQ9 TH `396617303`. Use them to rank topics on real demand.

---

## 0) 60-second quickstart (a new session)
1. Open a **Claude Code session on this repo** (web or CLI). `CLAUDE.md` auto-loads the rules.
2. Say what you want, e.g. *"Write July Day 1–7 for Wine-Now + LIQ9 to v2 depth"* or *"upload day 3 to Drive."*
3. Claude authors the Thai HTML into `pipeline/public/content/`, maps it in `data/articles.json`, **commits**, then on request **uploads the self-contained HTML to the Drive folder** and updates the Notion row (Status → **Brief Ready**, **Drive file URL** set).
4. Review status + activity log in **Notion** (or the dashboard). Done.

> **No paid API needed.** Drafting = Claude Code (your subscription). Drive upload = Claude Code via MCP. The dashboard's server-side Generate/Approve are intentionally left unconfigured (Option B).

---

## 1) Where everything lives

| Thing | Location |
|---|---|
| **Article HTML (source of truth)** | `pipeline/public/content/*.html` + shared `assets/article.css` |
| **pageId → HTML manifest** | `pipeline/data/articles.json` |
| **Product feed (SKUs)** | `pipeline/data/products.json` |
| **Dashboard (ops console)** | `pipeline/public/index.html` |
| **Public process summary + article index** | `pipeline/public/process.html` |
| **Pipeline code** | `pipeline/src/*.mjs`, endpoints `pipeline/api/*.mjs` |
| **Notion board** | "2026 JUN — WNLQ9 — Content Production" · DB id `786d080f-8da2-4a1e-b84e-161f4e19d56d` |
| **Google Drive delivery folder** | "WNLQ9 Blog Html center" · id `1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm` |
| **Vercel project (live)** | `seodashboard` · Root Directory `pipeline/` · Production Branch **`main`** |
| **Supabase (optional, dormant)** | project `dsyplzckfezcxiuikkfm` "WNLQ9 PI DB" |

**Dead duplicates to ignore:** Vercel projects `seo-dashboard` and `wnlq-9-content-seo` (always Error — not used).

### Delivered batches (one fresh Drive subfolder per period — see CLAUDE.md convention)

| Period | Drive subfolder (`YYYY-MM Month`) | Folder ID | Articles |
|---|---|---|---|
| 2026-06 | `2026-06 June` (currently named `WNLQ9 Magento-Ready Version` — rename pending; MCP can't rename) | `1JBuRFDzO2UFZdQRO5LRzSzueNwgKZS4O` | 52 (day 1–30, both brands) |
| 2026-07 | `2026-07 July` (to create at build start) | _TBD_ | ~40 (post-dedup) |

> All 52 rows on the June Notion board point to file IDs inside the June folder; Status = "Brief Ready". The earlier interim folder `WNLQ9 Magento-Ready (scoped)` (`1G8YX_IsFvv9VrvFiHT-HsPElerYv9AZM`) was a duplicate-laden working copy and has been deleted. Each new period gets its own subfolder under the delivery root above.

---

## 2) Keys / environment variables (set in Vercel → `seodashboard` → Settings → Env Vars)

> Never commit values. Template lives in `pipeline/.env.example`. Names only below.

| Variable | Needed for | Notes |
|---|---|---|
| `INGEST_SECRET` | **Dashboard login** (the "Passphrase") | You invent it. No default; API fails closed without it. Type the same value into the dashboard Passphrase box. |
| `NOTION_TOKEN` | Dashboard reading the board | Notion internal-integration token. **Share the board with the integration** (board → ⋯ → Connections). |
| `NOTION_DATABASE_ID` | optional | Defaults to the June board id above. |
| `ANTHROPIC_API_KEY` | *server-side* Generate only | **Not used** in Option B (we draft in Claude Code). Leave unset → dashboard hides Generate. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` + `DRIVE_FOLDER_ID` | *server-side* Approve→Drive only | **Not used** in Option B (Claude Code uploads). Leave unset → dashboard shows "Drive upload not configured". |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Supabase sync (optional) | Only if you activate the content_plan mirror. |
| `CRON_SECRET` | authorize the daily cron | Cron hits `/api/sync-plan` at 06:00 UTC; harmless 503 if Supabase/secret unset. |

**Minimum to run the dashboard:** `INGEST_SECRET` + `NOTION_TOKEN` → redeploy → open `/`, enter the passphrase, Refresh.

---

## 3) Sync points (what talks to what)
```
Claude Code session ──writes──▶ repo  pipeline/public/content/*.html (+ articles.json)
        │                          │
        │                          └──push──▶ GitHub ──auto──▶ Vercel (seodashboard, branch=main) ▶ production
        ├──uploads HTML──▶ Google Drive folder (delivery)
        └──updates row──▶ Notion board (Status=Brief Ready, Drive file URL)  ◀── dashboard reads via NOTION_TOKEN
```
- **Repo ↔ production:** push to **`main`** → Vercel auto-deploys (Root Dir `pipeline/`). Feature branches get preview URLs only.
- **Repo ↔ Drive:** manual, by Claude Code (Drive MCP) — it CSS-inlines the repo
  HTML and uploads a self-contained file. ⚠️ Drive MCP can only create/copy/read:
  **no overwrite, delete, or rename.** So:
  - **Pull first.** `git pull` the active content branch **before** inlining/
    uploading. A session on a stale checkout uploads outdated content (this bit us
    on day4 — see `SESSION_HANDOFF.md`). The repo HTML is the source of truth; the
    upload is only as fresh as the working copy.
  - **One fresh `YYYY-MM Month` subfolder per period** (see CLAUDE.md). Re-uploads
    make same-name duplicates; never re-upload into a live month folder. Build the
    clean set, upload once, repoint Notion, delete stale copies by hand in Drive.
- **Repo ↔ Notion:** the dashboard reads Notion live; Claude Code writes status + `Drive file URL` per row.
- **Supabase:** only if activated (Notion→content_plan mirror + product picks). Off by default.

---

## 4) Deploy / hosting model
- Production deploys from **`main`** only. Current production domain:
  `https://seodashboard-winenowsommelier-rgbs-projects.vercel.app`
  (`/` dashboard · `/process.html` summary · `/content/<file>.html` articles)
- **Deployment Protection is ON** (team-only; anonymous gets 403). That's fine — this is an internal tool. The *public* blog is Magento (`th.wine-now.com` / `th.liq9.com`), where the finished HTML is pasted.
- **Apply env-var changes:** Vercel → Deployments → ⋯ → **Redeploy** (env changes don't apply to existing builds).
- Branch model here: content is developed on a `claude/*` session branch; `main` is an **unrelated history** (different tree), so we ship by branching from `main`, copying the deliverables in (additive), and merging a normal PR. Don't try to merge a `claude/*` branch directly into `main` (no common ancestor).

---

## 5) Troubleshooting (things we actually hit)
| Symptom | Cause → Fix |
|---|---|
| Site asks Vercel login / 403 to outsiders | Deployment Protection ON. Fine for internal use; to make public set Settings → Deployment Protection → Disabled. |
| Dashboard "Passphrase" prompt | App-level `INGEST_SECRET`. Enter the value you set in Vercel. |
| `Endpoint not configured: set INGEST_SECRET` | `INGEST_SECRET` not set (or no redeploy after adding). |
| Dashboard list error "object_not_found"/Notion | `NOTION_TOKEN` valid but integration not connected to the board → add it in Notion Connections; check `NOTION_DATABASE_ID`. |
| "☁️ Drive upload not configured" | Expected in Option B. To enable the button: set `GOOGLE_SERVICE_ACCOUNT_JSON` + `DRIVE_FOLDER_ID` + share the Drive folder with the service account. |
| Article links 404 on the live blog | Articles serve from `/content/` on Vercel for preview; the public blog is Magento — paste the HTML there. |

---

## 6) Paste-to-resume prompt
> "Resume WNLQ9 content. Read `CLAUDE.md` + `docs/CONTENT_PRODUCTION_PLAYBOOK.md`. We work Option B (no paid API): you author Thai v2 articles into `pipeline/public/content/`, map them in `data/articles.json`, commit, then upload the self-contained HTML to Drive folder `1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm` and set the Notion row to **Brief Ready** with the **Drive file URL**. Next task: <…>."

---

## 7) Open dev backlog (nice-to-have, not blocking)
- SKU → real PDP deep-links on product cards (needs the PDP URL pattern).
- Real OG/hero images to replace `.figph` placeholders + `og:image` URLs.
- Bring the other repo articles (tannin, storage, label, natural/organic, proof-vs-abv) to v2 standard if shipped.
- Optional: activate Supabase sync (env vars + a manual `/api/sync-plan` run) for a queryable plan + auto product-picks.
- Optional: drop the daily cron in `vercel.json` if Supabase stays off (it currently 503s harmlessly each day).
