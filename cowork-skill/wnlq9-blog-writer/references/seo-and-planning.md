# SEO / AEO & Content Planning Reference

How we plan topics and optimize WNLQ9 blogs for both classic search and AI answer
engines (AEO / "AI citation").

## On-page SEO

- Put the **primary keyword** in the H1, the first paragraph, and 2+ H2/H3 headings.
- Target **long-tail keyword clusters**, not single words — see the `*-topic-library.csv`
  `Long-tail Keywords` column.
- Use **bilingual keywords**: each topic has an English primary keyword and a Thai
  keyword (e.g. `wine tannins` / `เทนนิน`). Use both naturally.
- The **FAQ accordion** is an SEO asset — write questions as real search queries.

## Meta block (ship with every page)

See `seo-meta-example.txt` for a full worked example. Include:

- **Meta title** — keyword-rich, brand-suffixed: `… | Wine-Now Thailand`
- **Meta description** — benefit + proof + delivery promise, ~155 chars
- **Meta keywords** — primary + long-tail cluster
- **URL key**, **canonical**
- **OG title / OG description**
- **JSON-LD schema**:
  - Content blog → `Article` (+ `FAQPage` when an FAQ is present)
  - Product / collection page → `CollectionPage` with an `ItemList`

## AEO / AI citation

We write content AI answer engines will quote:

- Lead with clear, factual, quotable definitions and comparisons.
- Cite credible authorities in production (e.g. Scotch Whisky Association, distillery
  data, auction results) for authority/investigative topics.
- Each library topic is scored for **AI Citation Opportunity / Value** — prioritize
  high-scoring topics for thought-leadership pieces.

## Content planning libraries

| Library | Rows | File |
|---------|------|------|
| Wine-Now topics | 83 | `wine-now-topic-library.csv` |
| LIQ9 topics | 85 | `liq9-topic-library.csv` |
| Viral SEO boosters | 33 | `viral-seo-boosters.csv` |

**Topic library columns:** `Topic Title (Thai | EN)`, `Content Type`,
`Primary Keyword`, `Long-tail Keywords`, `Search Intent`, `Buyer Persona`,
`Category`, `Seasonality`, `Est. Search Volume`, `Thai Language Keyword`,
`AI Citation Opportunity`, `Notes`.

**Viral booster columns:** `Topic Title`, `Brand Focus`, `Content Type`,
`Viral Hook`, `SEO Power Angle`, `Primary Keyword`, `Search Volume`, `Competition`,
`Link Potential`, `Expected Traffic Impact`, `Thai Angle`, `AI Citation Value`,
`Production Notes`.

### Content types

- **Pillar** — comprehensive foundational guides ("Wine 101", "Whisky 101") that
  anchor a topic cluster and receive internal links from related blogs.
- **Blog** — focused educational / comparison pieces feeding a pillar.
- **Commercial** — buying-intent pages leading toward catalog / product grids.

### Search intent & personas

- **Intent:** mostly *Informational*, plus *Commercial* buying-intent topics.
- **Personas:** Explorer / Casual Drinker / Enthusiast / Collector (+ gift buyers).
  Match tone and depth to the persona.
- **Seasonality:** mostly *Evergreen*; seasonal pushes target Songkran, New Year, summer.

### Proven viral angles

- **Consumer protection / trust** — "How to spot counterfeit wine / fake whisky"
- **Trend analysis** — "Green wine & Millennials", "Premium tequila"
- **Market / scarcity / FOMO** — "Japanese whisky shortage: why prices soar"

## Image & asset conventions

- Blog images live at each brand's `media/wysiwyg/blog/` path; reference a descriptive
  filename and remind the user to upload the real asset.
- Canva naming: `WN-` (Wine-Now) / `LQ-` (LIQ9) + `CH{n}` chapter + index + slug,
  e.g. `WN-CH1-01-Bordeaux-1855-Classification`.
