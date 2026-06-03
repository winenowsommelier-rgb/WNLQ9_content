# Internal link plan — orphans, link format, Champagne pillar

Goal: turn the 17 standalone articles into a few **hub-and-spoke clusters** so
link equity flows to the money pages and crawlers see topical depth. Execute
this together with the data-driven refreshes (see `GA_GSC_PLANNING.md`) in **one
clean Drive re-delivery**.

Audit snapshot (2026-06, from `pipeline/public/content/*.html`): 33 internal
edges already exist, but with two structural defects.

---

## Defect 1 — link format will 404 on the live blog ⚠️ (fix first)

Every in-body internal link uses a **relative filename**, e.g.

```html
<a href="day7-cabernet-sauvignon-101.html">…</a>   <!-- and href="index.html" -->
```

These resolve in the local `public/content/` preview but **break on the live
Magento blog**, where the page is served at
`https://th.wine-now.com/blog/cabernet-sauvignon-101.html` (the `<link
rel="canonical">` value). `index.html` has no live equivalent at all.

**Fix:** rewrite every in-body internal `<a href>` to the target article's
**canonical URL** before re-delivery. Map filename → canonical from each file's
`<link rel="canonical">` tag (the same map `--score` already builds). Drop or
repoint `index.html` links (there is no live blog index at that path — point to
the brand `/blog/` hub instead).

Do **not** touch product-card links or the brand header/footer links — only the
article-to-article body links.

---

## Defect 2 — orphans (zero inbound links)

| Article | Canonical | In | Out | Fix |
|---|---|---:|---:|---|
| `day5-proof-vs-abv.html` | `th.liq9.com/blog/proof-vs-abv.html` | 0 | 0 | **Fully isolated.** Wire into the LIQ9 spirits cluster (link from `whisky-101`, `bourbon-recommend`; link out to `whisky-101`). |
| `day4-wine-excise-tax-2026.html` | `th.wine-now.com/blog/wine-excise-tax-2026.html` | 0 | 2 | Add inbound from `most-expensive-wines-2026` + `old-world-vs-new-world-wine` (price/tax context). |
| `day6-wine-tourism-khao-yai.html` | `th.wine-now.com/blog/wine-tourism-khao-yai.html` | 0 | 2 | Add inbound from `pinot-noir-101` (Khao Yai grows it) + `white-wines-summer`. |

Target: **every article ≥ 2 inbound links**, no isolated nodes.

---

## Proposed clusters (hub → spokes)

Wire each spoke ↔ hub bidirectionally; cross-link spokes where the topic
genuinely overlaps (don't force it — relevance over volume).

### Wine-Now — "Wine 101" hub
- **Hub candidate:** `cabernet-sauvignon-101` / `pinot-noir-101` (already the
  most-linked; promote one as the varietal pillar).
- Spokes: `tannin-explained`, `wine-acidity`, `old-world-vs-new-world-wine`,
  `natural-organic-biodynamic-wine`, `white-wines-summer`.

### Wine-Now — "Buying & owning wine in Thailand" hub
- Spokes: `most-expensive-wines-2026`, `wine-excise-tax-2026`,
  `wine-storage-condo`, `wine-tourism-khao-yai`.

### LIQ9 — "Spirits 101" hub
- **Hub:** `whisky-101`.
- Spokes: `macallan-guide`, `bourbon-recommend`, `proof-vs-abv`,
  `buy-gin-online-thailand`, `spicy-thai-cocktails`.

---

## Champagne pillar (priority new pillar)

There is **no Champagne/sparkling pillar yet**, but five live articles already
mention sparkling/champagne and are ready-made spokes:

- `most-expensive-wines-2026.html`
- `white-wines-summer.html`
- `wine-acidity.html`
- `wine-excise-tax-2026.html`
- `wine-storage-condo.html`

**Plan:**
1. Author the pillar (Thai, "Whisky 101 v2" depth) — e.g.
   `champagne-sparkling-101` at `th.wine-now.com/blog/champagne-sparkling-101.html`
   (confirm slug against the Notion row / live site).
2. From each of the 5 spokes above, add one contextual in-body link **to** the
   pillar (anchor on the sparkling/celebration mention).
3. From the pillar, link **out** to those 5 + the varietal hub.
4. Add a board row + `Final URL` so it joins into `--score` next pull.

Sequence with data: if the pillar or a spoke shows up **striking-distance** in
`scored.json`, prioritise its links first — that's where the new equity converts
to ranking fastest.

---

## Execution checklist (one re-delivery)

- [ ] Rewrite all in-body internal links → canonical URLs (Defect 1).
- [ ] Resolve the 3 orphans → each ≥ 2 inbound (Defect 2).
- [ ] Author + wire the Champagne pillar (5 spokes ↔ pillar).
- [ ] Apply data-driven refreshes from `scored.json` in the same pass.
- [ ] Re-validate canonical/JSON-LD/SKU rules (CLAUDE.md golden rules) per file.
- [ ] Clear-then-reupload to Drive folder `1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm`
      (Drive MCP can't overwrite) — one clean set.
- [ ] Update Notion `Drive file URL` + Status where changed.
