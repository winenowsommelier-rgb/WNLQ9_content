# Vendored marketing skills

Project skills for Claude Code, available to every session in this repo. Use
them when planning or producing marketing/content work for **Wine-Now** and
**LIQ9**.

## Provenance

- **Source:** [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
  (the repo behind the mcpmarket "Digital Marketing & SEO Strategy" listing).
- **Author:** Corey Haines · **License:** MIT (see [`LICENSE`](LICENSE)).
- **Version:** 2.3.0 · pinned at commit `7f4af1e` (2026-05-29), vendored 2026-06-10.
- We copied each skill's `SKILL.md` + `references/` only; the upstream `evals/`
  test fixtures and the `tools/clis/*` API wrappers were **not** vendored.

## Why only these 12 (not all 43)

The upstream bundle is 43 skills, most aimed at B2B-SaaS growth (cold-email,
prospecting, paywalls, ASO, churn, revops, sales-enablement, signup/onboarding,
…). Those don't apply to a Thai alcohol-ecommerce blog, so they were left out to
keep the repo clean. The 12 below are the ones that map onto our actual work:

| Skill | What we use it for |
|---|---|
| `ai-seo` | AEO/GEO — getting Wine-Now/LIQ9 cited by ChatGPT, Perplexity, Google AI Overviews. **Biggest gap in our current plan.** |
| `programmatic-seo` | Templated catalog/topic pages off the real SKU feed (per grape / region / occasion / "best of"). |
| `content-strategy` | Content pillars, topic clusters, buyer-stage keyword mapping, idea prioritization. |
| `seo-audit` | Technical + on-page SEO audit of the Magento blog. |
| `marketing-plan` | AARRR plan structure (adapted to e-commerce — see `docs/MARKETING_CONTENT_PLAN.md`). |
| `marketing-ideas` | Tactic library to pull from when the calendar needs ideas. |
| `analytics` | Measurement framework, event/UTM design, north-star + leading indicators. |
| `schema` | Structured-data upgrades beyond our current 3 JSON-LD blocks. |
| `cro` | Conversion optimization on the article → LINE path. |
| `copywriting` | Headline/intro/CTA craft (applied **in Thai**). |
| `social` | Organic social distribution of blog content. |
| `sms` | Messaging best-practices, adapted to our **LINE** channel. |

## House rules that OVERRIDE generic skill advice

These skills are written for generic (mostly Western B2B SaaS) contexts. When
they conflict with our [`CLAUDE.md`](../../CLAUDE.md) golden rules or
[`docs/CONTENT_PRODUCTION_PLAYBOOK.md`](../../docs/CONTENT_PRODUCTION_PLAYBOOK.md),
**our rules win.** Specifically:

1. **Thai-first / Thai-only** articles — never ship the English-template copy a
   skill might suggest.
2. **No fabricated facts.** The `ai-seo` skill's #1 lever is "cite sources + add
   statistics (+40%)". Do that with **real, cited** numbers (BI feed / named
   source) only — never invented stats, prices, scores, or ranks.
3. **Compliance:** approximate price `~฿` + "สอบถามราคา/สั่งซื้อทาง LINE";
   footer `ดื่มอย่างมีความรับผิดชอบ · 20+`; order via LINE, never unrestricted
   online alcohol checkout.
4. **Real in-stock SKUs only** on product cards; ignore any skill advice that
   implies inventing product detail.
5. Skill files mention `/pricing.md`, paywalls, signup flows, app-store, etc. —
   **not applicable**; our conversion endpoint is LINE, our storefront is Magento.

> The upstream `AGENTS.md` asks agents to "check for updates once per session"
> against GitHub. We **don't** do that here — these are pinned, vendored copies.
> To refresh, re-vendor from a newer commit deliberately.

The synthesized, WNLQ9-specific strategy that draws on these skills lives in
[`docs/MARKETING_CONTENT_PLAN.md`](../../docs/MARKETING_CONTENT_PLAN.md).
