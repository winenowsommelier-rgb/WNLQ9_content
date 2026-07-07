# SEO Consolidation & Cannibalization Map — WN × LIQ9

**Source:** GSC pull 2026-03-01→06-03 (this session). **Strategy context:** "Thai + English
regional" — so **same-language** duplicates get merged/301'd, but **cross-language EN/TH**
pairs are KEPT and joined with **hreflang** (one canonical per language per topic).
Re-pull live GSC before executing any 301 to confirm current numbers.

## The rule set
1. **Same topic, same language, multiple URLs** → pick the strongest (impressions × position),
   301 the rest into it, merge the best content. One canonical per topic per language.
2. **Same topic, EN vs TH** → keep both, set `hreflang` (`th` ↔ `en`) + self-canonical each.
   This is the engine of the Thai+English plan — don't collapse languages.
3. **Thin "what-is-X" stubs** → roll up into a pillar with anchor sections; 301 stubs to anchors.

## 🔴 Priority 1 — the flagship cluster (biggest single win)
"Most expensive wine" is split 3 ways and bleeding clicks:
| URL | Imp | Clicks | CTR | Pos | Action |
|---|---|---|---|---|---|
| `blog/15-most-expensive-wine-in-the-world-en.html` | 150,778 | 362 | **0.24%** | 7.7 | **Keep = EN canonical.** Fix title/meta for CTR; push to top 3. |
| `blog/15-most-expensive-wine-in-the-world-th.html` | 2,454 | 19 | 0.77% | 7.7 | **Keep = TH canonical;** hreflang-pair to `-en`. Expand TH content. |
| `blog/15-most-expensive-wine-in-the-world.html` (base) | 13,242 | 251 | 1.9% | 7.2 | **= TH canonical** — query-level confirms it ranks for Thai ("ไวน์ที่แพงที่สุดในโลก", "ไวน์ 3 เหรียญ ราคา"). Hreflang-pair base↔`-en`; **do not 301 base into the EN page.** |
> A 150k-impression page at 0.24% CTR is the highest-value fix on the site: rewrite the `-en`
> title to the exact English head term ("most expensive wine in the world" alone = 15,489 imp at
> pos 7.4), hreflang base↔`-en`, push to top 3. Likely +thousands of clicks/mo, zero new content.
> **Query-level correction:** this is *already* an EN/TH split (en=English terms, base=Thai), so it's
> a 2-language hreflang setup — **not** a 3-way merge. The thin `-th` (2,454 imp) is the same language
> as base → fold `-th` into base (301, same-language), then keep base↔`-en` as the hreflang pair.

## 🔴 Priority 2 — "wine for beginners" sprawl (5+ same-language posts)
`5-recommended-wine-for-beginners` (16,843/pos 9.8) · `6-recommended-white-wine-for-beginners-th`
(28,488/pos 7.1) · `6-recommended-red-wine-for-beginners` (2,073/pos 19.7) ·
`wine-selection-guide-for-complete-beginners` (2,471) · `10-wine-for-beginner-under-1500` (2,754) ·
`wines-101-type-of-wines-should-know`.
**Action:** make **one Thai "Wine for Beginners" pillar** (merge the strongest + the white/red
splits as sections), 301 the weak ones in, keep the value-under-1500 as a distinct *commercial*
angle linking up. Pair June `day16-wine-for-beginners` with this as the refresh, not a new URL.

## 🟠 Priority 3 — recurring same-language duplicate patterns
| Cluster | Competing URLs (same lang) | Action |
|---|---|---|
| Decanting | `what-is-decanting` · `when-should-you-decant-wine` · `decant-vs-aerator` | 1 pillar + sections; 301 the rest. June `day28-decanting-guide` = the refresh. |
| Tannin/body | `what-is-tannin` · `what-is-body-tannin-and-acidity` · `what-is-body-wine` | merge → 1 "structure" pillar. June `day2-tannin`/`day2-wine-acidity` link up. |
| Champagne/sparkling **(Thai "แชมเปญ" — 5-way, query-level)** | `wine/champagne-wine.html` category (5,986 imp **pos 4.3** ← strongest) · `5-styles-champagne` (10,369/6.5) · `champagne-or-sparkling-wine` (4,078/4.1) · `5-world-class-champagne-for-celebrate` (3,524/10.8) · `champagne-the-art-of-bubble-wine` (1,400/9.3) | **category page = the "แชมเปญ" hub** (best position + commercial). Point the blogs' anchor text at it; differentiate each blog to a long-tail (styles / vs-sparkling / luxury / history) so they stop competing for the head term. `cava` stays separate (own term, see striking-distance). |
| Rosé | `what-is-rose-wine` (12k) · `wine/rose-wine.html` (category) | blog = info hub linking to category; no merge (diff intent). |
| Bottle sizes | `wine-bottle-sizes` · `meaning-of-wine-bottle-sizes-en` | EN/TH or dup? if same lang → 301; if EN/TH → hreflang. |
| Corks | `corks-vs-screw-caps` + `corks-vs-screw-caps-th` | EN/TH → **hreflang pair** (keep both). |

## 🟢 EN/TH pairs to formalize with hreflang (keep both — supports the plan)
`...-en` / `...-th` / base trios across the blog (most-expensive, bottle-sizes, good-bad-benefits,
corks, etc.). Build a script to flag every slug with `-en`/`-th` variants → assign one canonical
per language + reciprocal `hreflang`. This turns accidental duplication into a deliberate
bilingual asset (the foundation of "Thai + English regional").

## LIQ9 note
Nothing to consolidate (homepage only indexed). Its risk is the opposite — **no architecture
yet.** Build clean from the start: one canonical per topic per language, hreflang from day one,
so it never accrues this debt.

## Execution order
1. Flagship trio (P1) — consolidate + hreflang + title fix.
2. Beginners pillar (P2).
3. Decanting/tannin/champagne roll-ups (P3).
4. Site-wide `-en/-th/base` hreflang pass (script-assisted).
> Every 301 must be a real redirect on Magento (dev task) + update internal links to the survivor.
