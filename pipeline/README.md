# WNLQ9 Content Production Pipeline

Runs the full content lifecycle for **`2026 JUN — WNLQ9 — Content Production`**:

```
 Brief intake ──▶ Notion row ──▶ generate EN+TH drafts ──▶ review ──▶ Google Doc ──▶ Published
                  (source of truth, status + activity log)            (link back to Notion)
```

A web **control-panel dashboard** drives the whole thing; a CLI handles batch
intake. Dependency-free (Node 22 native `fetch`, no SDK, no build step), so it
runs locally, in CI, or on Vercel.

`pipeline/` is the self-contained Vercel deploy root (`api/` + `public/` +
`src/` colocated — no out-of-root imports).

```
pipeline/                ← Vercel Root Directory
├── api/                Vercel serverless endpoints (see below)
├── public/             index.html (control panel) + intake.html (brief form)
├── src/
│   ├── config.mjs      endpoints, DB id, canonical options, env wiring
│   ├── validate.mjs    brief validation + defaults + Category↔Week derivation
│   ├── mapping.mjs     brief → Notion `properties` (exact column names, chunked)
│   ├── notion.mjs      REST client: create / update / list / page-comment log
│   ├── llm.mjs         Anthropic draft generation (EN + TH) with prompt caching
│   ├── docbuilder.mjs  markdown → HTML body for the Google Doc
│   ├── drive.mjs       Google Drive Doc creation (service-account JWT)
│   ├── pipeline.mjs    lifecycle: generateDrafts · approveToDrive
│   ├── ingest.mjs      intake: validate → dedupe → map → create
│   └── cli.mjs         batch ingest from a JSON file
├── vercel.json         static (public/) + functions (api/*.mjs)
├── examples/           sample-briefs.json
└── test/               34 offline unit tests (node:test)
```

## Dashboard API

All endpoints require the `X-Ingest-Secret` header (fail-closed on `INGEST_SECRET`).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/items`    | GET  | List all rows from Notion (normalized) |
| `/api/ingest`   | POST | Create a row from a brief |
| `/api/generate` | POST `{pageId}` | Draft Content EN + TH → status `Review` |
| `/api/approve`  | POST `{pageId}` | Create Google Doc → link back → status `Done` |
| `/api/log`      | GET `?pageId=` | Activity log (Notion page comments) |

The activity log is stored as **Notion page comments**, so every step is visible
both in the dashboard and directly in Notion.

## Setup

```bash
cd pipeline
cp .env.example .env        # then paste your NOTION_TOKEN
```

The Notion integration must be **shared with the database** (Notion → database →
`•••` → Connections → add your integration).

## Use it

**Dry run** — validate + preview the Notion payloads, no network, no token:

```bash
npm run ingest:dry
# or: node src/cli.mjs examples/sample-briefs.json --dry-run
```

**Real ingest** — create rows (skips briefs whose Brief ID already exists):

```bash
export NOTION_TOKEN=ntn_xxx
node src/cli.mjs examples/sample-briefs.json --skip-existing
```

A brief is a plain object. Only `title` and `site` are required; everything else
is optional and `Status`/`Month` default to `Brief Ready` / `June 2026`. Supply
either `category` or `weekTheme` — the other is derived. A stable `briefId`
(e.g. `WN-D03-terroir-in-one-minute`) is auto-generated for idempotent batches.

```json
{
  "title": "Terroir in One Minute",
  "site": "Wine-Now",
  "category": "Education",
  "type": "Blog",
  "day": 3,
  "publishDate": "2026-06-03",
  "targetKeyword": "what is terroir",
  "contentBrief": "60-second explainer…",
  "story": "Soil leaves a fingerprint you can taste.",
  "tension": "Skeptics call it marketing.",
  "cta": "Explore terroir-driven wines"
}
```

### Field → Notion column map

| Brief field      | Notion column   | Type      | Notes |
|------------------|-----------------|-----------|-------|
| `title`*         | Title           | title     | required |
| `site`*          | Site            | select    | `Wine-Now` \| `LIQ9` |
| `type`           | Type            | select    | `Pillar` \| `Blog` \| `Social` |
| `category`       | Category        | select    | derives `weekTheme` |
| `weekTheme`      | Week Theme      | select    | derives `category` |
| `status`         | Status          | select    | default `Brief Ready` |
| `month`          | Month           | select    | default `June 2026` |
| `day`            | Day             | number    | |
| `gaViews`        | GA Views        | number    | |
| `publishDate`    | Publish Date    | date      | `YYYY-MM-DD` or ISO |
| `targetKeyword`  | Target Keyword  | rich text | |
| `contentBrief`   | Content Brief   | rich text | |
| `contentTH`      | Content TH      | rich text | |
| `contentEN`      | Content EN      | rich text | |
| `story`          | STORY           | rich text | |
| `tension`        | TENSION         | rich text | |
| `cta`            | CTA             | rich text | |
| `key`            | KEY             | rich text | |
| `briefId`        | Brief ID        | rich text | auto-derived; used for dedupe |
| `finalUrl`       | Final URL       | url       | |
| `url`            | URL             | url       | |

## Dashboard (Vercel)

`public/index.html` is the **control panel** (lists items, shows the status
pipeline, review pane, and per-item activity log, with Generate / Approve
actions). `intake.html` is the brief form. Both call the serverless API in
`api/`.

**Vercel project settings:** Root Directory = `pipeline`, Framework Preset =
`Other` (it is *not* a Next.js app). Then set these env vars:

| Env var                       | Required for | Purpose |
|-------------------------------|--------------|---------|
| `NOTION_TOKEN`                | everything   | Notion integration secret |
| `INGEST_SECRET`               | everything   | Passphrase callers send as `X-Ingest-Secret` |
| `NOTION_DATABASE_ID`          | optional     | Override target database |
| `ANTHROPIC_API_KEY`           | `/api/generate` | Draft EN + TH content |
| `ANTHROPIC_MODEL`             | optional     | Model override (default `claude-sonnet-4-6`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | `/api/approve`  | Service account `{client_email, private_key}` |
| `DRIVE_FOLDER_ID`             | `/api/approve`  | Destination Drive folder (shared with the SA) |

The API **fails closed**: if `INGEST_SECRET` is not set it refuses every
write (503), and requests without a matching `X-Ingest-Secret` header are
rejected (401). This stops a public deploy from being used to spam the
production database. The dashboard prompts for the passphrase and remembers it
locally. For stronger protection, also enable Vercel deployment protection in
front of the project.

## Tests

```bash
npm test          # node --test, fully offline (validation, mapping, ingest)
```

## July 2026 → published Magento-safe HTML

July content is **authored in Notion** (plain-text bilingual `Content TH` /
`Content EN`, Status = `Review`) and published through main's Drive-handoff
model: render → upload self-contained HTML to the "WNLQ9 Blog Html center" Drive
folder → write the link + Status back to Notion → the team pastes into Magento.

The July board (`93ac15a8-…`, data source `d342f9b8-…`) differs from June: it has
**no `Week Theme`** and adds `Author/Priority/Intent/Funnel/Evergreen`. The
pipeline adapts automatically via a **schema profile** (`config.schemaProfileFor`):
validation accepts `July 2026`, and mapping omits `Week Theme` while writing the
new editorial columns.

```
Notion row (Review)
  └─ pickProducts()      real, in-stock SKUs from data/products.json (BI feed)
  └─ expandArticle()     full-depth Thai body (Anthropic) — or seedExpansion() offline
  └─ buildArticleModel() title split, slug, JSON-LD (from the row's Schema field),
  │                      compliance, emoji strip, Buddhist ban-day handling
  └─ renderArticle()     standalone Magento-safe HTML (brand chrome + assets/article.css)
  └─ approveToDrive()    CSS-inline + upload + Notion writeback (Status, Drive/Final URL)
```

### Run it

```bash
# Dry-run: render every Review row to ./out/july-dry, no Notion/Drive writes.
NOTION_DATABASE_ID=93ac15a8-bb65-40f7-b357-b8cabd336214 \
  node src/july-cli.mjs --dry-run

# Dry-run from a local items file (offline, no token needed):
node src/july-cli.mjs --dry-run --items rows.json --out ./out/july-dry

# Live publish (needs NOTION_TOKEN, GOOGLE_SERVICE_ACCOUNT_JSON, DRIVE_FOLDER_ID;
# ANTHROPIC_API_KEY enables full-depth expansion, else an offline seed is used):
NOTION_DATABASE_ID=93ac15a8-bb65-40f7-b357-b8cabd336214 \
  node src/july-cli.mjs --publish --limit 1
```

| Env var | Purpose |
|---------|---------|
| `NOTION_DATABASE_ID` | Set to the July id `93ac15a8-…` (config defaults to June) |
| `WNLQ9_BI_API_KEY` | BI product feed (header `X-API-Key`, base `https://wnlq9-bi-api.vercel.app`) |
| `ANTHROPIC_API_KEY` | Full-depth Thai expansion (`llm.expandArticle`); falls back to seed |
| `PUBLISH_LANGS` | **The EN switch.** `th` (default) = Thai-only; `th,en` also emits the English article from `Content EN` |

### Turning on English later

Thai-only ships now. To also publish English, set **`PUBLISH_LANGS=th,en`**
(Vercel env or shell). The renderer already parses the EN half of the
`TH / EN` title and reads `Content EN`; EN files are written as
`<slug>.en.html`. **Before enabling**, confirm the EN locale/URL pattern (the
canonical currently mirrors the TH domain) — that's the one open item.
