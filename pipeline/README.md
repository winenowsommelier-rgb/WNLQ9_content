# WNLQ9 Content Production — Ingest Pipeline

Turns a **content brief** (from the web Dashboard or a JSON batch) into a row in
the Notion database **`2026 JUN — WNLQ9 — Content Production`**.

This is the source for the *Dashboard → Notion* flow verified by the live E2E
test. It is dependency-free (Node 22 native `fetch`, no SDK, no build step), so
it runs anywhere Node 22+ is available — locally, in CI, or on Vercel.

```
pipeline/
├── src/
│   ├── config.mjs    Notion endpoint, DB id, and canonical select options
│   ├── validate.mjs  brief validation + defaults + Category↔Week derivation
│   ├── mapping.mjs   brief → Notion `properties` payload (exact column names)
│   ├── notion.mjs    thin Notion REST client (createRow / findByBriefId)
│   ├── ingest.mjs    orchestration: validate → dedupe → map → create
│   └── cli.mjs       batch ingest from a JSON file
├── dashboard/        web intake form + Vercel serverless /api/ingest
├── examples/         sample-briefs.json
└── test/             offline unit tests (node:test)
```

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

`dashboard/` is a static intake form (`public/index.html`) backed by a
serverless function (`api/ingest.mjs`) that calls the same ingest core.

Deploy with project root `pipeline/dashboard` and set these env vars in the
Vercel project:

| Env var             | Required | Purpose |
|---------------------|----------|---------|
| `NOTION_TOKEN`      | yes      | Notion integration secret (server-side only) |
| `INGEST_SECRET`     | yes      | Shared passphrase callers must present (`X-Ingest-Secret` header) |
| `NOTION_DATABASE_ID`| no       | Override target database |

`/api/ingest` **fails closed**: if `INGEST_SECRET` is not set it refuses every
write (503), and requests without a matching `X-Ingest-Secret` header are
rejected (401). This stops a public deploy from being used to spam the
production database. The intake form prompts for the passphrase and remembers it
locally. For stronger protection, also enable Vercel deployment protection in
front of the project.

## Tests

```bash
npm test          # node --test, fully offline (validation, mapping, ingest)
```
