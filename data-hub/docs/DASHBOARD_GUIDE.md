# Dashboard & Analysis Guide

This guide turns the raw **Articles** sheet (populated by the ingest pipeline /
`SheetsExporter`) into a set of decision-making dashboards for the Wine-Now and
LIQ9 content team. Everything here is built with native Google Sheets
**formulas, QUERY, and pivot tables** — no code runs against the sheet, so the
views refresh themselves whenever the pipeline appends new rows.

Copy-paste each formula into the cell indicated. All formulas reference the
**Articles** tab and assume the column layout the exporter writes.

> Optional: the helper `exporters/dashboard_bootstrap.py` can create the empty
> dashboard tabs (Dashboard, Trends, Regions, Brands, AEO Opportunities,
> Editorial) and seed them with these formulas via the Sheets API. It is a
> convenience only — you can build everything by hand from this guide. See the
> last section.

---

## The Articles column map (memorise this)

Every formula below depends on these columns being in this exact order. This is
the contract enforced by `SheetsExporter.COLUMNS`.

| Col | Header           | Field                      | Notes |
|-----|------------------|----------------------------|-------|
| A   | Source           | source_name                | e.g. "Decanter" |
| B   | Title            | title                      | |
| C   | URL              | article_url                | one per article — use for COUNTs |
| D   | Published Date   | published_date             | ISO date/datetime |
| E   | Author           | author                     | |
| F   | Excerpt          | content_excerpt            | |
| G   | Content Type     | content_type               | blog/news/review/spotlight/guide/opinion/research/video |
| H   | Region           | topic_region               | France, Scotland, Japan, … |
| I   | Spirits Type     | spirits_type               | whisky/gin/rum/vodka/tequila/mezcal/brandy/cognac/liqueur/other |
| J   | Trend Signals    | trend_signals              | **pipe-joined** e.g. `award_winning \| scarcity/shortage` |
| K   | Primary Category | primary_category           | wine/spirits/food_beverage/cultural/other |
| L   | Buyer Persona    | buyer_persona              | casual_drinker/enthusiast/collector |
| M   | AEO Value        | aeo_citation_opportunity   | high/medium/low |
| N   | Collected Date   | collected_date             | when the pipeline grabbed it |
| O   | Source Language  | source_language            | en/th/es/fr/de/it/ja/zh/pt |

Row 1 is the header row. Data starts at row 2. Open-ended ranges like
`Articles!C2:C` grow automatically as new rows land.

---

## View 1 — Summary Dashboard

**Tab:** `Dashboard`
**Purpose:** the one-glance "state of the content radar" — volume, freshness,
coverage, wine-vs-spirits split. This is the tab you open first each morning.

### Headline metrics

Lay out a two-column key/value block. Put the **labels** in column A and the
**formulas** in column B.

| Cell | Label (col A) | Formula (col B) |
|------|---------------|-----------------|
| A1 | `Metric` (header) | put `Value` in B1 |
| A2 | `Total articles` | `=COUNTA(Articles!C2:C)` |
| A3 | `Unique sources` | `=COUNTA(UNIQUE(Articles!A2:A))` |
| A4 | `Earliest published` | `=TEXT(MIN(Articles!D2:D), "yyyy-mm-dd")` |
| A5 | `Latest published` | `=TEXT(MAX(Articles!D2:D), "yyyy-mm-dd")` |
| A6 | `Collected last 7 days` | `=COUNTIF(Articles!N2:N, ">="&(TODAY()-7))` |
| A7 | `Collected last 30 days` | `=COUNTIF(Articles!N2:N, ">="&(TODAY()-30))` |
| A8 | `High-AEO articles` | `=COUNTIF(Articles!M2:M, "high")` |

Notes:
- `COUNTA(Articles!C2:C)` counts URLs — every article has exactly one, so this
  is your true article count (do not count column A/Source, which repeats).
- `MIN`/`MAX` on column D return a date serial; `TEXT(…, "yyyy-mm-dd")` makes it
  human-readable. If a cell shows a big number instead of a date, the Published
  Date column was imported as text — see "Date handling" in the gotchas section.
- The 7/30-day counters use **Collected Date (N)**, which is when *we* ingested
  the article — the right signal for "what's new in the hub", independent of the
  article's own publish date. `TODAY()` re-evaluates every day automatically.

### Wine vs spirits split (and all primary categories)

Pick an empty cell (e.g. **D1**) and paste one QUERY — it spills a 2-column
table of every category and its count:

```
=QUERY(Articles!A:O, "SELECT K, COUNT(K) WHERE K IS NOT NULL GROUP BY K ORDER BY COUNT(K) DESC LABEL COUNT(K) 'Articles'", 1)
```

The trailing `1` tells QUERY the source has **1 header row** (so it skips row 1
and uses "Primary Category" as the label). Result looks like:

| Primary Category | Articles |
|------------------|----------|
| wine             | 312      |
| spirits          | 188      |
| food_beverage    | 24       |

Single-number alternatives if you prefer fixed cells (no spill):
- Wine: `=COUNTIF(Articles!K2:K, "wine")`
- Spirits: `=COUNTIF(Articles!K2:K, "spirits")`

### How to read it
Total + unique sources tell you breadth. The 7/30-day counters are your
heartbeat — if "collected last 7 days" drops to 0, a collector is broken. The
wine/spirits split tells you whether coverage matches business priorities
(Wine-Now vs LIQ9).

---

## View 2 — Content Type Breakdown

**Tab:** `Dashboard` (below the summary) **or** a dedicated `Analysis` tab.
**Purpose:** what *kind* of content the market is producing — are competitors
shipping guides, reviews, or news? Informs our own format mix.

### Option A — Pivot table (recommended, interactive)
1. Select `Articles!A1:O` (whole data range incl. header).
2. **Insert → Pivot table → New sheet** (or an existing cell on `Analysis`).
3. In the pivot editor:
   - **Rows:** `Content Type` (column G)
   - **Values:** `URL` (column C), summarised by **COUNTA** (count).
4. (Optional) add **Primary Category (K)** as a second Rows field to see, e.g.,
   "reviews — wine vs spirits".

### Option B — QUERY (formula, auto-refreshing)
Paste into any empty cell:

```
=QUERY(Articles!A:O, "SELECT G, COUNT(C) WHERE G IS NOT NULL GROUP BY G ORDER BY COUNT(C) DESC LABEL COUNT(C) 'Articles'", 1)
```

Cross-tab content type × category in one shot:

```
=QUERY(Articles!A:O, "SELECT G, K, COUNT(C) WHERE G IS NOT NULL GROUP BY G, K ORDER BY COUNT(C) DESC LABEL COUNT(C) 'Articles'", 1)
```

### How to read it
A market heavy in `news`/`review` and light in `guide` is an opening: long-form
guides are exactly the evergreen, AEO-friendly format Wine-Now/LIQ9 should own.

---

## View 3 — Trend Signal Heatmap

**Tab:** `Trends`
**Purpose:** which market narratives (scarcity, awards, sustainability, celebrity
ties, …) are heating up, and *when*. This is the core trend-spotting view.

### The multi-value problem
Trend Signals live in **column J** as a **pipe-joined** string, e.g.
`award_winning | scarcity/shortage`. A single cell can hold several signals, so
you **cannot** `GROUP BY J` — that would treat the whole combined string as one
category. Instead, count how many rows *contain* each signal with a **wildcard
`COUNTIF`**. The `*` wildcards match the substring anywhere in the cell.

### Total count per signal
List every taxonomy signal in column A and its count in column B. Start at row 2
(row 1 is a header: A1 `Trend Signal`, B1 `Count`):

| Cell | A (signal) | B (formula) |
|------|------------|-------------|
| A2 | `scarcity/shortage` | `=COUNTIF(Articles!$J$2:$J, "*scarcity/shortage*")` |
| A3 | `price_spike` | `=COUNTIF(Articles!$J$2:$J, "*price_spike*")` |
| A4 | `emerging_region` | `=COUNTIF(Articles!$J$2:$J, "*emerging_region*")` |
| A5 | `health_angle_positive` | `=COUNTIF(Articles!$J$2:$J, "*health_angle_positive*")` |
| A6 | `health_angle_negative` | `=COUNTIF(Articles!$J$2:$J, "*health_angle_negative*")` |
| A7 | `sustainability_focus` | `=COUNTIF(Articles!$J$2:$J, "*sustainability_focus*")` |
| A8 | `cultural_moment` | `=COUNTIF(Articles!$J$2:$J, "*cultural_moment*")` |
| A9 | `celebrity_tie` | `=COUNTIF(Articles!$J$2:$J, "*celebrity_tie*")` |
| A10 | `investment_opportunity` | `=COUNTIF(Articles!$J$2:$J, "*investment_opportunity*")` |
| A11 | `counterfeit_warning` | `=COUNTIF(Articles!$J$2:$J, "*counterfeit_warning*")` |
| A12 | `award_winning` | `=COUNTIF(Articles!$J$2:$J, "*award_winning*")` |
| A13 | `limited_release` | `=COUNTIF(Articles!$J$2:$J, "*limited_release*")` |
| A14 | `viral_on_social` | `=COUNTIF(Articles!$J$2:$J, "*viral_on_social*")` |
| A15 | `climate_impact` | `=COUNTIF(Articles!$J$2:$J, "*climate_impact*")` |
| A16 | `regulatory_change` | `=COUNTIF(Articles!$J$2:$J, "*regulatory_change*")` |
| A17 | `technology_innovation` | `=COUNTIF(Articles!$J$2:$J, "*technology_innovation*")` |

> **Wildcard caveat:** `health_angle_positive` is a substring of nothing else, so
> it is safe. But because `*x*` matches substrings, keep signal names distinct.
> All 16 taxonomy values above are mutually non-overlapping, so each COUNTIF is
> exact. If you ever add a signal whose name is a prefix of another, anchor the
> match with the surrounding pipe/space (e.g. search `"*| award_winning |*"`)
> after normalising — but with the current taxonomy this is unnecessary.

Tip: to keep the signal list in sync with the taxonomy, you can paste the values
once and let the COUNTIF in B reference `A2` instead of a literal:
`=COUNTIF(Articles!$J$2:$J, "*"&$A2&"*")` — then fill down. This is the form the
bootstrap helper writes.

### Month-by-month trend table (the heatmap grid)
Goal: rows = trend signal, columns = month, values = count of articles published
that month carrying that signal. This is a `COUNTIFS` combining a **date range**
on Published Date (D) with a **wildcard** on Trend Signals (J).

Layout: put signals down column A (as above, starting A2). Put month-start dates
across row 1 starting at **B1**. Enter real dates (format the cells as
`yyyy-mm`), e.g. B1 = `2026-01-01`, C1 = `2026-02-01`, D1 = `2026-03-01`, …
(or generate them: B1 = `=DATE(2026,1,1)`, C1 = `=EDATE(B1,1)` filled right).

In **B2** paste this and fill across **and** down:

```
=COUNTIFS(Articles!$J$2:$J, "*"&$A2&"*", Articles!$D$2:$D, ">="&B$1, Articles!$D$2:$D, "<"&EDATE(B$1,1))
```

How it works:
- `"*"&$A2&"*"` — wildcard match on the signal name in the row label (A is
  locked to the column, row floats as you fill down).
- `">="&B$1` and `"<"&EDATE(B$1,1)` — Published Date on or after this month's
  first day and before next month's first day (row 1 locked, column floats as
  you fill right). `EDATE(B$1,1)` is the first of the following month.
- The mixed `$` anchoring (`$A2`, `B$1`) is what makes a single formula tile the
  whole grid when filled.

### Conditional formatting → make it a heatmap
1. Select the value grid (e.g. `B2:M17`).
2. **Format → Conditional formatting → Color scale**.
3. Set **Min** = white (or light grey), **Max** = a strong brand colour (deep
   red / burgundy works for wine). Leave Midpoint on "Percentile 50".
4. Apply.

Now hot signals/months glow. Read it left-to-right per row to see a narrative
accelerating (e.g. `scarcity/shortage` lighting up across recent months → time
to publish allocation/where-to-buy content).

---

## View 4 — Region Analysis

**Tab:** `Regions`
**Purpose:** geographic coverage — which wine regions and spirits origins the
market is talking about, so editorial can match demand and find under-covered
regions.

### Count by region (auto-refreshing)
Paste into A1:

```
=QUERY(Articles!A:O, "SELECT H, COUNT(C) WHERE H IS NOT NULL GROUP BY H ORDER BY COUNT(C) DESC LABEL COUNT(C) 'Articles'", 1)
```

This already gives **top regions by volume** (sorted desc). To show only the
leaders, add `LIMIT 10` before the `LABEL` clause:

```
=QUERY(Articles!A:O, "SELECT H, COUNT(C) WHERE H IS NOT NULL GROUP BY H ORDER BY COUNT(C) DESC LIMIT 10 LABEL COUNT(C) 'Articles'", 1)
```

### Cross-tab: Region × Spirits Type
Spirits coverage by origin (Scotland → whisky, Mexico → tequila/mezcal, …). The
`WHERE I IS NOT NULL` keeps only spirits rows (wine rows have an empty Spirits
Type column I):

```
=QUERY(Articles!A:O, "SELECT H, I, COUNT(C) WHERE I IS NOT NULL GROUP BY H, I ORDER BY H LABEL COUNT(C) 'Articles'", 1)
```

For a true matrix (regions down the side, spirit types across the top), use a
**pivot table** instead: Rows = Region (H), Columns = Spirits Type (I), Values =
COUNTA of URL (C).

### How to read it
Big region counts confirm where buyer attention is. Equally important: regions
in the taxonomy (`Thailand`, `Georgia`, emerging markets) with **near-zero**
counts are white-space — under-covered by competitors and a chance to be the
authoritative source.

---

## View 5 — Competitor / Brand Monitoring

**Tab:** `Brands`
**Purpose:** track how often key brands and entities show up in incoming
coverage, and when each was last in the news — an early-warning system for brand
momentum and PR moments.

### Configurable brand list
Put brand names down column A (A1 = header `Brand`, brands from A2). Brand
mentions are detected across **Title (B)** and **Excerpt (F)** with wildcard
COUNTIF (one COUNTIF per field, summed). Seed list:

| Cell | A (brand) | B `Title hits` | C `Excerpt hits` | D `Total` | E `Last mentioned` |
|------|-----------|----------------|------------------|-----------|--------------------|
| A2 | `Macallan` | `=COUNTIF(Articles!$B$2:$B,"*"&$A2&"*")` | `=COUNTIF(Articles!$F$2:$F,"*"&$A2&"*")` | `=B2+C2` | `=TEXT(MAXIFS(Articles!$D$2:$D, Articles!$B$2:$B, "*"&$A2&"*"), "yyyy-mm-dd")` |
| A3 | `Hibiki` | (fill B2 down) | (fill C2 down) | (fill D2 down) | (fill E2 down) |
| A4 | `Yamazaki` | | | | |
| A5 | `Bordeaux` | | | | |
| A6 | `Penfolds` | | | | |
| A7 | `Johnnie Walker` | | | | |
| A8 | `Hennessy` | | | | |

After typing the four formulas in **B2:E2**, select B2:E2 and **fill down** to
the last brand row. Because column A is referenced as `$A2` (column locked, row
floats), every row scores its own brand. Add/remove brands by editing column A —
the scores follow.

Notes:
- **Total** (D) double-counts an article that mentions the brand in *both* title
  and excerpt. That's usually fine for a momentum signal. If you need unique
  articles, use the COUNTIFS-OR trick:
  `=COUNTA(Articles!$C$2:$C)-COUNTIFS(Articles!$B$2:$B,"<>*"&$A2&"*",Articles!$F$2:$F,"<>*"&$A2&"*")`
  (total rows minus rows that mention it in *neither* field).
- **Last mentioned** uses `MAXIFS` over Published Date (D) where Title (B)
  matches — the most recent date the brand appeared. Swap `$B$2:$B` for
  `$F$2:$F` to key off the excerpt instead. If a brand has zero hits, MAXIFS
  returns 0 → shows `1899-12-30`; wrap in `IFERROR`/`IF(...=0,"—",...)` if you
  want a blank.

### How to read it
A brand spiking in **Total** with a recent **Last mentioned** = it's having a
moment (new release, award, controversy). Cross-check against the Trends tab to
see *why* (e.g. `limited_release` + Macallan). Feed hot brands into the
Editorial tab.

---

## View 6 — AEO Opportunity Ranking

**Tab:** `AEO Opportunities`
**Purpose:** surface the articles most likely to be cited by AI answer engines
(`AEO Value = high`), newest first — a ready-made sourcing queue for content the
team should respond to or out-do.

Paste into **A1**:

```
=QUERY(Articles!A:O, "SELECT B, A, H, J, D WHERE M = 'high' ORDER BY D DESC LIMIT 50", 1)
```

Columns returned: **Title (B), Source (A), Region (H), Trend Signals (J),
Published Date (D)** — the 50 most recent high-AEO articles.

Variants:
- Only wine: add `AND K = 'wine'` → `WHERE M = 'high' AND K = 'wine'`.
- Include the URL to click through: select `C` too —
  `SELECT B, C, A, H, J, D WHERE M = 'high' ORDER BY D DESC LIMIT 50`.
- Published in the last 60 days only (note the `date` literal syntax):
  `WHERE M = 'high' AND D >= date '2026-04-01' ORDER BY D DESC`.

### How to read / use it
This is your **content sourcing list**. Each high-AEO article is a topic an AI
engine already considers citation-worthy. Wine-Now/LIQ9 should produce a better,
localised (Thailand-context) version of the strongest entries so *we* become the
cited source. Work the list top-down (newest first).

---

## View 7 — Editorial Calendar Opportunities

**Tab:** `Editorial`
**Purpose:** the prioritised "what should we write next" board — articles that
are simultaneously **trending** (have at least one Trend Signal) **and**
**high-AEO** — then layer the team's own content idea and priority on top.

### Auto-generated opportunity feed
Paste into **A1**. The condition `J IS NOT NULL AND J <> ''` keeps only rows that
carry a trend signal; `M = 'high'` keeps the AEO winners:

```
=QUERY(Articles!A:O, "SELECT D, B, A, H, J, K WHERE M = 'high' AND J IS NOT NULL AND J <> '' ORDER BY D DESC LIMIT 100", 1)
```

Returns **Published Date (D), Title (B), Source (A), Region (H), Trend Signals
(J), Primary Category (K)** for up to 100 trending high-AEO articles, newest
first.

### Manual planning columns
The QUERY spills into A:F. Leave **G, H, I** for the team to fill by hand:

| Col | Header | Filled by |
|-----|--------|-----------|
| G | `Content Idea` | editor — the angle/headline we'd publish |
| H | `Priority (1-5)` | editor — 5 = do this week |
| I | `Owner / Status` | editor — assignee + draft/published |

> Put these headers in **G1:I1**. Because QUERY output is a live spill that
> *re-sorts* as new rows arrive, do **not** type idea text directly beside a
> spilled row (it will desync when the list reshuffles). Instead, either:
> (a) treat G:I as a scratch planning area and copy a row's Title into it before
> annotating, or (b) **paste the QUERY result as static values** once a week
> (Copy → Paste special → Values only) onto a "Sprint" sub-range, then annotate
> that frozen snapshot. Option (b) is what most editorial teams prefer for a
> weekly planning cadence.

### A simple priority score (optional)
If you snapshot to static values, add a computed priority in a spare column,
e.g. boost rows whose signals include high-intent commercial cues:

```
=IF(REGEXMATCH(E2, "scarcity/shortage|limited_release|award_winning|investment_opportunity"), 5, 3)
```

(assuming the snapshot's Trend Signals landed in column E). Sort the snapshot by
this score descending to get your shortlist.

### How to read it
Top of the list = trending **and** AI-citation-worthy = highest-leverage content
to produce now. The manual columns turn the radar into an actual editorial
backlog.

---

## How to refresh

- **Formulas & QUERY (Views 1, 2B, 3, 4, 5, 6, 7):** auto-refresh. They
  recalculate whenever the Articles tab changes or the sheet is opened.
  `TODAY()`-based metrics (7/30-day counters) roll over daily. No action needed.
- **Pivot tables (View 2A, optional View 4 matrix):** also auto-update when
  source data changes, but if you ever *extend the source range* (you shouldn't
  need to — use whole-column ranges like `A:O`), open the pivot editor and
  confirm the range covers new rows. A hard refresh: click any pivot cell → the
  editor reopens → range is shown.
- **Static-value snapshots (View 7 option b):** these are frozen by design.
  Re-run the snapshot (re-paste the QUERY values) on your planning cadence
  (e.g. each Monday).
- **The pipeline appends** to `Articles!A:O` via `INSERT_ROWS`, so new articles
  push in below existing data and every open-ended range picks them up.

---

## Tips

- **Freeze the header row** on every tab: **View → Freeze → 1 row**. On Articles
  also freeze so scrolling keeps headers visible.
- **Named ranges** make formulas readable. **Data → Named ranges**, e.g. name
  `Articles!$J$2:$J` as `Signals`, then `=COUNTIF(Signals,"*award_winning*")`.
  Define `Articles!$A:$O` as `Hub` and write `=QUERY(Hub, "…", 1)`.
- **Filter views vs filters:** use **Data → Create a filter view** (not a plain
  filter) on shared sheets. A filter view is private to you — sorting/filtering
  to explore won't disrupt teammates or, crucially, won't reorder the rows the
  pipeline appends to. Plain filters are global and shared.
- **Don't sort the Articles tab in place.** The exporter appends to the bottom;
  manual sorting there is cosmetic and can confuse "what's newest". Do all
  sorting in QUERY/pivots/filter views on the dashboard tabs instead.
- **Protect the Articles tab** (right-click tab → Protect sheet) so dashboards
  built on it don't get accidentally edited.
- Keep the dashboard tabs to the **left** of Articles so the team lands on
  insights, not raw data.

---

## QUERY function — syntax gotchas

The Google Sheets `QUERY` function uses the Google Visualization API Query
Language, which is *almost* SQL but has sharp edges:

1. **Column references are letters, not headers.** Inside the query string you
   write `SELECT H, COUNT(C)` — the literal sheet column letters A–O — **never**
   the header text. Wrong letter = wrong (or broken) column. Double-check against
   the column map at the top: Region is **H**, Trend Signals **J**, AEO Value
   **M**, Primary Category **K**, Spirits Type **I**.
2. **The header-rows argument matters.** The 3rd argument (`, 1`) tells QUERY how
   many header rows the *source range* has. Pass `1` when you select `A:O` /
   `A1:O` (which include row 1). Omit it or pass `0` and QUERY may treat your
   header as data and/or mislabel columns. We always select with the header and
   pass `1`.
3. **String literals use single quotes.** `WHERE M = 'high'` — single quotes
   inside the double-quoted query string. Don't use double quotes inside.
4. **Dates use the `date` keyword + `yyyy-mm-dd`.** Comparisons against a date
   column must be written `WHERE D >= date '2026-04-01'` — the literal `date`
   prefix and an ISO `yyyy-mm-dd` string. `WHERE D >= '2026-04-01'` (no `date`)
   fails or compares as text. For datetimes use `datetime 'yyyy-mm-dd HH:mm:ss'`.
5. **The Published/Collected columns must be real dates** for date math to work
   (MIN/MAX, COUNTIF `>=`, QUERY `date` literals). The exporter writes ISO
   strings with `valueInputOption=USER_ENTERED`, which Sheets normally parses to
   real dates. If a column behaves like text, select it → **Format → Number →
   Date**, or wrap comparisons in `DATEVALUE(...)`. Symptom: MIN/MAX return blank
   or 0, or `date` literals match nothing.
6. **`LABEL` renames aggregate columns.** Without `LABEL COUNT(C) 'Articles'`,
   the header reads `count`. Put `LABEL` *after* `ORDER BY`/`LIMIT`.
7. **`LIMIT`/`OFFSET` go before `LABEL`** and after `ORDER BY`. Clause order:
   `SELECT … WHERE … GROUP BY … ORDER BY … LIMIT … LABEL …`.
8. **QUERY can't aggregate the pipe-joined Trend Signals.** As covered in View 3,
   never `GROUP BY J`. Use wildcard `COUNTIF`/`COUNTIFS` for per-signal counts.
9. **Whole-column ranges (`A:O`) are preferred** over `A2:O500` so the views grow
   with the data automatically.

---

## Optional: bootstrap the tabs with `dashboard_bootstrap.py`

`exporters/dashboard_bootstrap.py` provides a small, fail-soft helper that
creates the six dashboard tabs and (optionally) seeds them with the formulas
above via the Sheets API — handy when standing up a fresh hub sheet.

```python
import os
from exporters.dashboard_bootstrap import DashboardBootstrap

boot = DashboardBootstrap(sheet_id=os.environ["DATA_HUB_SHEET_ID"])

# 1. Create any missing dashboard tabs (Dashboard, Trends, Regions,
#    Brands, AEO Opportunities, Editorial). Existing tabs are left alone.
print(boot.create_dashboard_tabs())
# {"created": ["Dashboard", "Trends", ...], "skipped": [...]}

# 2. Write formula cells to a tab. Keys are A1-notation cells, values are
#    the formula strings (include the leading '=').
boot.write_formulas("Dashboard", {
    "A2": "Total articles",
    "B2": "=COUNTA(Articles!C2:C)",
    "D1": "=QUERY(Articles!A:O, \"SELECT K, COUNT(K) WHERE K IS NOT NULL GROUP BY K LABEL COUNT(K) 'Articles'\", 1)",
})

# Or seed every tab with the canned starter formulas from this guide:
boot.seed_default_formulas()
```

It shares `SheetsExporter`'s design: credentials and the googleapiclient service
are lazy-loaded behind a mockable `_get_service()` seam, the constructor never
touches the network, and every API call is fail-soft (errors are logged and
returned as `{"error": "..."}` rather than raised). Credential setup is identical
to the exporter — see `docs/GOOGLE_SHEETS_SETUP.md`.
