# Monthly Content & SEO Operating Cadence — WN × LIQ9

The standing process that turns content into rankings and organic traffic. Pairs with
`CONTENT_STRATEGY.md` (what to make), `CONTENT_PRODUCTION_PLAYBOOK.md` (how to write),
`SEO_STRIKING_DISTANCE.md` + `SEO_CANNIBALIZATION_CONSOLIDATION.md` (where the wins are),
`REAL_URL_INVENTORY.md` (the live link graph). **Model:** Option B (Claude Code authors,
human ships). **Markets:** Thai-first + English-regional (hreflang TH/EN).

## The loop (this is the whole system)
```
   ┌────────────────────────────────────────────────────────────────┐
   │ 1 MINE demand (GSC query+page) ─▶ 2 DECIDE refresh-vs-new        │
   │        ▲                                      │                  │
   │ 6 READ BACK (GA Views/GSC, kill·scale) ◀─ 3 BRIEF (gated)       │
   │        ▲                                      │                  │
   │ 5 SHIP (Magento live + Final URL + hreflang) ◀─ 4 DRAFT v2 HTML │
   └────────────────────────────────────────────────────────────────┘
```
The two things that were missing and unlock everything: **step 1 (mine, don't guess)** and
**steps 5–6 (ship + read back)**. Without 5–6 nothing compounds.

## Weekly rhythm
| Day | Action | Tool |
|---|---|---|
| **Mon — Mine** | Pull last-28-day GSC query+page; refresh the striking-distance shortlist (pos 5–15, imp > ~2k, weak CTR). | Supermetrics GSC (`GW`) |
| **Tue — Decide** | Triage shortlist → *refresh* (existing URL) vs *new* (true gap). Refresh beats new by default. Check no cannibalization vs live + month boards. | board + consolidation map |
| **Wed–Thu — Brief & draft** | Brief gate → draft v2 Thai-first HTML (+EN variant where regional). Real SKUs from feed; real internal links from `REAL_URL_INVENTORY.md`. | Claude Code |
| **Fri — Ship & QA** | Upload to Drive month folder (`YYYY-MM Month`), set Notion `Brief Ready` + Drive URL; human publishes on Magento, sets `Final URL` + `Published` + hreflang. | Drive/Notion/Magento |

## Monthly rhythm
1. **Read-back review (month-end):** per row, read `GA Views` + GSC clicks/position. Tag
   **kill / hold / scale**. Scale winners (repurpose pack, more cluster posts); kill losers.
2. **Plan next month** from the demand shortlist + the fixed skeleton (below) — not intuition.
3. **One consolidation action** from `SEO_CANNIBALIZATION_CONSOLIDATION.md` (301/merge/hreflang).
   Cannibalization cleanup is a *standing* monthly task until the backlog clears.
4. **Authority drip:** 1–2 E-E-A-T / off-page actions (author pages, local backlink, GBP, LINE).

## Gates (definition-of-done, enforced)
- **Brief Ready** = KEY · TENSION · STORY · Target Keyword · Hook · 3–5 KEY points · de-dup angle.
- **Done** = v2 TH (+EN) HTML, real SKUs, real internal links, Drive-uploaded, Notion Drive URL set.
- **Published** = live on Magento + `Final URL` + **hreflang pair** + repurpose pack drafted.
- **Reviewed** = `GA Views`/GSC read back; kill/scale logged.
> Guardrail: **no new URL** for a topic that already has a live ranker — refresh it instead
> (prevents re-creating the cannibalization we're cleaning up).

## Fixed monthly skeleton (per site, ~24–26) — stops quality drift
2 Pillar · 8–10 Education (each with a Thai-context hook) · 6–8 Commercial (real SKUs, LINE) ·
4–6 Timely (calendar pegs) · 2–4 Signature POV · **+ a premium tier** woven through (value→premium
SKU pair on listicles; a premium cluster: icon producers, prestige champagne, rare whisky, luxury
cognac). Every Pillar gets 4–6 cluster posts linking up.

## Bilingual (TH + EN regional) rules
- One **canonical per language per topic**; reciprocal `hreflang` (`th` ↔ `en`).
- Thai = primary depth; English = regional/expat + pan-SEA English demand.
- Never let EN/TH variants compete — pair them, don't merge them.

## Roles (Option B)
- **Claude Code:** mine GSC, draft briefs + v2 HTML (TH/EN), upload Drive, set Notion, produce
  the monthly demand/cannibalization reports.
- **Human (owner):** publish on Magento, set Final URL/hreflang/301s, approve premium/SKU picks,
  run the kill/scale call.

## Per-site focus
- **Wine-Now:** harvest mode — consolidate cannibalization, fix CTR on the high-impression pages,
  push page-2 winners. Compound the existing 300-URL graph.
- **LIQ9:** foundation mode — build category + 101 pillar architecture, hreflang from day one,
  seed from proven demand (e.g. the Jack Daniel's term already ranking on WN). Treat as a launch.

## Health metrics (watch monthly)
Organic clicks (GSC) · indexed/valid pages · # topics with a single canonical (cannibalization
shrinking) · published count + avg time-to-publish · GA Views per published row · CTR on the
striking-distance set · LIQ9 indexed-page count (from ~1 upward).
