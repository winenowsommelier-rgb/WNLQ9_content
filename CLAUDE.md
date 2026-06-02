# CLAUDE.md — WNLQ9 Monthly Content Operation

> Auto-loaded context for every Claude Code session in this repo. Read this first, then
> `docs/wnlq9/00-START-HERE.md` for live status. The full process lives in Notion (see below)
> and is mirrored in `docs/wnlq9/` so a session can orient even before Notion connects.

## What this project is
We run a **monthly bilingual (Thai + English) content operation** for two Thai alcohol e‑commerce
brands, managed in **Notion** and published to a **Magento** blog:

- **Wine-Now (WN)** — wine; *Bangkok's sommelier in your pocket*. Voice: Thai-first, calm,
  no hyperbole, "why this bottle/moment/table," never "drink this."
- **LIQ9** — spirits & cocktails; *the spirits intelligence behind Bangkok's bar scene*. Voice:
  Master-of-Malt wit + Bangkok-bartender confidence, em-dash rhythm, names real BKK bars.

Each month = ~80 pieces/brand-pair, organised as **hub-and-spoke clusters**, drafted **TH+EN** to
`Review`, then expanded/QA'd and scheduled.

## The single source of truth (Notion)
- **Governing doc:** *Editorial Production Standard, Monthly Content Engine & Brand Direction —
  WN × LIQ9 (v2)* — page `3729d75a-e4b5-81a8-83dd-c176804fdbdd`. §§1–14 = per-piece quality;
  **§15 = the Monthly Content Engine** (how to build a month); §16–17 = brand direction; §18 = shared rules.
- **Content Hub (parent):** "2026 Content Calendar Hub" `35e9d75a-e4b5-81ed-b331-f6655718c066`.
- **June 2026 DB:** `786d080f-8da2-4a1e-b84e-161f4e19d56d` (data source `6be4a7bb-d42c-4286-be1b-fa73e3635b45`).
- **July 2026 DB:** `93ac15a8-bb65-40f7-b357-b8cabd336214` (data source `d342f9b8-3725-4068-9ccb-03b09821b0c8`).
- Full ID list + Hero page IDs: `docs/wnlq9/06-NOTION-MAP.md`.

## Non-negotiable rules (full detail in the Notion Standard §9 + §15.6)
1. **Thai alcohol compliance (Alcohol Beverage Control Act B.E. 2551):** no on-page price
   (price-on-request / LINE CTA), no "buy/cart," no consumption-inducing language, 20+ note.
2. **Sale events:** never name a sale ("7.7", "11.11") or use buy/cart/stock-up/% off — reframe as
   *decision-stage education* timed to the window.
3. **Buddhist sales-ban days:** content that day is **secular AND non-commercial** — no product,
   no price, **no reference to Buddhism or the religious reason**. (Dates shift yearly — verify.)
4. **Magento has no emoji rendering:** **Title / Content TH / Content EN are plain text only.**
   Emoji only in internal Notion-only fields, never in published fields, never in DB row content.
5. **No fabricated facts:** every score/price/brand/tasting note is sourced or marked `[VERIFY]`
   and resolved (live research) before publish.

## How to build / continue a month
Follow the **Monthly Content Engine** (`docs/wnlq9/04-MONTHLY-CONTENT-ENGINE.md`, mirrors Notion §15):
Step 0 lock parameters → 1 live-signal research → 2 cluster architecture → 3 council pre-flight →
4 build (new sibling DB, batches, v1 skeleton at Review) → 5 council QA + resolve [VERIFY] →
6 Hero expansion → 7 date re-flow + views → 8 handoff.

## To resume in a NEW session
Paste the prompt in `docs/wnlq9/07-SESSION-PROMPT.md`. Tooling/secrets setup is in
`docs/wnlq9/08-SECRETS-AND-ACCESS.md` and `.env.example` (Notion access is required;
the rest are optional).

## Repo conventions
- Work on the branch you're told to (currently `claude/magical-keller-AroZC`); never push to `main` without permission.
- This repo also contains a Next.js SEO dashboard (`app/`, `components/`, `lib/`, `supabase/`) and
  the Claude SEO skills (`.claude/`). The content operation lives in `docs/wnlq9/` + Notion.
- Secrets are **never** committed. Config reads from env (`.mcp.json`, `.env.example`).
