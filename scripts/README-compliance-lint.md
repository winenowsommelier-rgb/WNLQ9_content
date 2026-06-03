# WNLQ9 Thai-Alcohol-Compliance Linter

A pure-function + CLI linter that enforces **Editorial Production Standard §18.2**
(Thai alcohol advertising / sales-ban compliance) against WNLQ9 content drafts.

- Script: `scripts/compliance-lint.mjs`
- Core export: `lintContent({ title_en, title_th, content_en, content_th, publishDate, funnel })`
  → `Array<{ rule, severity, field, match }>`

## Why this exists

Thai law (Alcohol Beverage Control Act) restricts how alcohol may be advertised and
sold. The recurring failure modes in our Magento/Notion pipeline are:

1. On-page prices leaking onto editorial pages.
2. Emojis breaking the Magento CMS renderer.
3. Missing age guardrail copy on Thai pages.
4. Direct "buy now / add to cart" CTAs instead of the required LINE handoff.
5. Commercial copy going live on Buddhist **sales-ban holy days** (no alcohol sales allowed).

## Rules

| Rule | Severity | Field(s) | What it flags |
|------|----------|----------|----------------|
| `no_onpage_price` | **error** | all | `฿1,500`, `1500 บาท`, `THB 1500`, `1500 THB`, `ราคา … บาท`. Mentioning *that* prices exist is fine; an actual number+currency is the violation. |
| `no_emoji` | **error** | all | Any emoji / decorative pictograph. Ranges: `1F300–1FAFF`, `2600–27BF`, `1F000–1F0FF`, `2190–21FF`, `2B00–2BFF`, plus variation selector `FE0F` and ZWJ `200D`. Magento CMS display rule. |
| `missing_age_notice` | warning | `content_th` | Thai content lacking an age indicator (`20+`, `ผู้ที่มีอายุ`, `อายุ 20`, `บุคคลอายุต่ำกว่า`, bare `20`). |
| `direct_purchase_cta` | warning | all | Direct purchase mechanisms: `/checkout`, `/cart`, `add to cart`, `สั่งซื้อทันที`, or `ซื้อเลย` wired to a link. The compliant path is a **LINE** CTA (`LINE`, `@handle`, `ไลน์`). |
| `salesban_commercial` | **error** | all | On a `BAN_DATES` publish date: ANY price, purchase CTA, or product-recommendation language (`แนะนำให้ซื้อ`, `buy`, `ขวดนี้`). |

## Running it

```bash
node scripts/compliance-lint.mjs <path-to-json>
```

`<path-to-json>` is a JSON **array** of records, each shaped like the `lintContent`
argument. Records may also carry a `code`, `id`, or `title` for nicer reporting.

```json
[
  {
    "code": "JUL-F3",
    "title_en": "Mocktails & Low-ABV",
    "title_th": "ม็อกเทลและเครื่องดื่มแอลกอฮอล์ต่ำ",
    "content_en": "…",
    "content_th": "…",
    "publishDate": "2026-07-29",
    "funnel": "TOFU"
  }
]
```

Output: per-record status (`CLEAN` / `WARN` / `FAIL`), violations grouped by
severity, and a summary. **Exit code 1** if any `error`-severity violation is found
(so it can gate CI); **0** otherwise.

### Programmatic use

```js
import { lintContent } from './scripts/compliance-lint.mjs';
const violations = lintContent(record);
const blocking = violations.filter(v => v.severity === 'error');
```

## Maintaining ban dates

Buddhist sales-ban days are hardcoded in the `BAN_DATES` array at the top of
`compliance-lint.mjs`. Add a `YYYY-MM-DD` string per holy day:

```js
export const BAN_DATES = [
  '2026-07-29', // Asalha Bucha  (confirmed)
  '2026-07-30', // Khao Phansa   (confirmed)
  // '2026-03-03', // Makha Bucha   [VERIFY]
  // '2026-05-31', // Visakha Bucha [VERIFY]
  // '2026-10-26', // Ok Phansa     [VERIFY]
];
```

**Action for the team:** confirm and uncomment the `[VERIFY]` 2026 dates
(Makha Bucha, Visakha Bucha, Ok Phansa), and add 2027 dates before year-end.
Lunar-calendar holy days shift each year — never copy last year's dates blindly.

## Wiring into the pre-handoff (DoR) gate

Add a step to the Definition-of-Ready / pre-handoff check so no draft moves to
the publish queue with an error-severity violation:

1. Export the batch of drafts to a JSON array (one record per page, fields as above).
2. Run the linter; non-zero exit blocks the gate.

**CI example (GitHub Actions):**

```yaml
- name: Compliance lint (DoR gate)
  run: node scripts/compliance-lint.mjs build/drafts-to-publish.json
```

**Pre-handoff checklist item:** "Compliance lint passes (exit 0). Any
`warning`-severity items (missing age notice, non-LINE CTA) reviewed and
either fixed or explicitly waived by the editor."

The error tier is hard-blocking (price leaks, emojis, sales-ban commercial copy).
The warning tier is advisory but should be triaged before handoff.
