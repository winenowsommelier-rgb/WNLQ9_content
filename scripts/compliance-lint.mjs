#!/usr/bin/env node
/**
 * WNLQ9 Thai-Alcohol-Compliance Linter
 * Implements Editorial Production Standard §18.2.
 *
 * Pure core: lintContent({ title_en, title_th, content_en, content_th, publishDate, funnel })
 *   -> Array<{ rule, severity, field, match }>
 *
 * CLI: node scripts/compliance-lint.mjs <path-to-json>
 *   <path-to-json> is a JSON array of records with the same shape as lintContent's arg
 *   (records may also carry an `id`/`code`/`title` for reporting).
 *   Prints per-record violations grouped by severity + a summary.
 *   Exit code 1 if any `error`-severity violation is found (CI gate), else 0.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

/* ------------------------------------------------------------------ *
 * Buddhist alcohol sales-ban days (วันพระใหญ่ / งดขายเครื่องดื่มแอลกอฮอล์)
 * On these dates, commercial selling of alcohol is prohibited in Thailand,
 * so on-page price / purchase CTA / "buy this bottle" recommendation copy
 * must NOT be live.
 *
 * 2026 CONFIRMED:
 *   2026-07-29  Asalha Bucha (วันอาสาฬหบูชา)
 *   2026-07-30  Khao Phansa  (วันเข้าพรรษา)
 *
 * TODO [VERIFY] — other 2026 holy days the team must confirm and add:
 *   Makha Bucha   (วันมาฆบูชา)    ~2026-03-03  [VERIFY]
 *   Visakha Bucha (วันวิสาขบูชา)  ~2026-05-31  [VERIFY]
 *   Ok Phansa     (วันออกพรรษา)   ~2026-10-26  [VERIFY]
 * ------------------------------------------------------------------ */
export const BAN_DATES = [
  '2026-07-29', // Asalha Bucha  (confirmed)
  '2026-07-30', // Khao Phansa   (confirmed)
  // '2026-03-03', // Makha Bucha   [VERIFY]
  // '2026-05-31', // Visakha Bucha [VERIFY]
  // '2026-10-26', // Ok Phansa     [VERIFY]
];

/* ------------------------------------------------------------------ *
 * Rule regexes
 * ------------------------------------------------------------------ */

// 1. Price patterns: ฿ + digits, digits + บาท, THB + digits, "ราคา ... บาท".
//    Returns the actual matched price string.
const PRICE_PATTERNS = [
  /฿\s?\d[\d,]*\d|฿\s?\d/g,                          // ฿1,500 / ฿ 1500 / ฿5
  /\d[\d,]*\d\s?บาท|\d\s?บาท/g,                      // 1500 บาท / 1,500บาท / 5บาท
  /(?:THB|thb|บาท)\s?\d[\d,]*\d|(?:THB|thb|บาท)\s?\d/g, // THB 1500 / THB 5
  /\d[\d,]*\d\s?THB|\d\s?THB/gi,                     // 1500 THB / 5 THB
  /ราคา[\s\S]{0,15}?\d[\d,]*(?:\.\d+)?\s?(?:บาท|฿|THB)/gi, // ราคา ... บาท
];

// 2. Emoji / decorative pictographs (Magento CMS display rule).
const EMOJI_PATTERN =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F0FF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

// 3. Age-notice indicators expected in Thai content.
const AGE_INDICATORS = [
  'ผู้ที่มีอายุ',
  'อายุ 20',
  'บุคคลอายุต่ำกว่า',
  '20+',
  '20', // bare "20" as a last-resort age token
];

// 4. Direct purchase mechanisms (instead of the required LINE CTA).
const DIRECT_PURCHASE_PATTERNS = [
  /\/checkout\b/gi,
  /\/cart\b/gi,
  /add\s+to\s+cart/gi,
  /สั่งซื้อทันที/g,
  // "ซื้อเลย" only counts as a direct-purchase CTA when wired to a link.
  /ซื้อเลย[\s\S]{0,40}?(?:https?:\/\/|www\.|\/(?:cart|checkout|product))/gi,
  /(?:https?:\/\/|href=)[\s\S]{0,40}?ซื้อเลย/gi,
];

// LINE CTA = compliant path (informational; used to reason about CTAs).
const LINE_CTA_PATTERN = /(LINE|ไลน์|@[A-Za-z0-9._-]+)/i;

// 5. Sales-ban commercial language (in addition to price / CTA on ban dates).
const COMMERCIAL_PATTERNS = [
  /แนะนำให้ซื้อ/g,
  /\bbuy\b/gi,
  /ขวดนี้/g,
];

const FIELDS = ['title_en', 'title_th', 'content_en', 'content_th'];

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function collectMatches(text, regex) {
  if (!text) return [];
  const out = [];
  // Clone regex to keep state isolated between calls.
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(m[0]);
    if (m.index === re.lastIndex) re.lastIndex++; // guard against zero-width
  }
  return out;
}

function findPriceMatches(text) {
  const all = [];
  for (const re of PRICE_PATTERNS) all.push(...collectMatches(text, re));
  return all;
}

function findPurchaseCtaMatches(text) {
  const all = [];
  for (const re of DIRECT_PURCHASE_PATTERNS) all.push(...collectMatches(text, re));
  return all;
}

function findCommercialMatches(text) {
  const all = [];
  for (const re of COMMERCIAL_PATTERNS) all.push(...collectMatches(text, re));
  return all;
}

function normalizeDate(d) {
  if (!d) return '';
  // Accept ISO datetime or date; keep YYYY-MM-DD.
  return String(d).slice(0, 10);
}

/* ------------------------------------------------------------------ *
 * Core linter
 * ------------------------------------------------------------------ */

export function lintContent({
  title_en = '',
  title_th = '',
  content_en = '',
  content_th = '',
  publishDate = '',
  funnel = '',
} = {}) {
  const record = { title_en, title_th, content_en, content_th };
  const violations = [];

  // --- Rule 1: no_onpage_price (error) ---
  for (const field of FIELDS) {
    for (const match of findPriceMatches(record[field])) {
      violations.push({ rule: 'no_onpage_price', severity: 'error', field, match });
    }
  }

  // --- Rule 2: no_emoji (error) ---
  for (const field of FIELDS) {
    for (const match of collectMatches(record[field], EMOJI_PATTERN)) {
      violations.push({
        rule: 'no_emoji',
        severity: 'error',
        field,
        match: `${match} (U+${match.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`,
      });
    }
  }

  // --- Rule 3: missing_age_notice (warning) — Thai content only ---
  const hasAge = AGE_INDICATORS.some((ind) => content_th.includes(ind));
  if (!hasAge) {
    violations.push({
      rule: 'missing_age_notice',
      severity: 'warning',
      field: 'content_th',
      match: '(no age indicator found — expected e.g. "20+", "ผู้ที่มีอายุ", "อายุ 20")',
    });
  }

  // --- Rule 4: direct_purchase_cta (warning) ---
  for (const field of FIELDS) {
    for (const match of findPurchaseCtaMatches(record[field])) {
      violations.push({ rule: 'direct_purchase_cta', severity: 'warning', field, match });
    }
  }

  // --- Rule 5: salesban_commercial (error) — only on ban dates ---
  const pubDate = normalizeDate(publishDate);
  if (BAN_DATES.includes(pubDate)) {
    for (const field of FIELDS) {
      const text = record[field];
      const banMatches = [
        ...findPriceMatches(text),
        ...findPurchaseCtaMatches(text),
        ...findCommercialMatches(text),
      ];
      for (const match of banMatches) {
        violations.push({
          rule: 'salesban_commercial',
          severity: 'error',
          field,
          match: `${match} (publishDate ${pubDate} is a Buddhist sales-ban day)`,
        });
      }
    }
  }

  return violations;
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};
const c = (color, s) => (process.stdout.isTTY ? `${COLORS[color]}${s}${COLORS.reset}` : s);

function recordTitle(rec, i) {
  return (
    rec.code ||
    rec.id ||
    rec.title ||
    rec.title_en ||
    rec.title_th ||
    `record #${i + 1}`
  );
}

function runCli(jsonPath) {
  let raw;
  try {
    raw = readFileSync(jsonPath, 'utf8');
  } catch (err) {
    console.error(c('red', `Cannot read file: ${jsonPath}\n${err.message}`));
    process.exit(2);
  }

  let records;
  try {
    records = JSON.parse(raw);
  } catch (err) {
    console.error(c('red', `Invalid JSON in ${jsonPath}: ${err.message}`));
    process.exit(2);
  }
  if (!Array.isArray(records)) records = [records];

  let totalErrors = 0;
  let totalWarnings = 0;
  let cleanCount = 0;

  console.log(c('bold', `\nWNLQ9 Compliance Lint — §18.2`));
  console.log(c('dim', `Source: ${jsonPath}  •  ${records.length} record(s)\n`));

  records.forEach((rec, i) => {
    const violations = lintContent(rec);
    const errors = violations.filter((v) => v.severity === 'error');
    const warnings = violations.filter((v) => v.severity === 'warning');
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    const label = recordTitle(rec, i);
    const tEn = rec.title_en ? ` — ${rec.title_en}` : '';

    if (violations.length === 0) {
      cleanCount++;
      console.log(`${c('green', 'CLEAN')}  ${label}${tEn}`);
      return;
    }

    const head = errors.length
      ? c('red', `FAIL `)
      : c('yellow', `WARN `);
    console.log(`${head}  ${c('bold', label)}${tEn}`);

    if (errors.length) {
      console.log(`  ${c('red', `errors (${errors.length}):`)}`);
      for (const v of errors) {
        console.log(`    ${c('red', '✗')} [${v.rule}] ${c('dim', v.field)}  →  ${JSON.stringify(v.match)}`);
      }
    }
    if (warnings.length) {
      console.log(`  ${c('yellow', `warnings (${warnings.length}):`)}`);
      for (const v of warnings) {
        console.log(`    ${c('yellow', '!')} [${v.rule}] ${c('dim', v.field)}  →  ${JSON.stringify(v.match)}`);
      }
    }
    console.log('');
  });

  console.log(c('bold', '\n──────── Summary ────────'));
  console.log(`Records:   ${records.length}`);
  console.log(`Clean:     ${c('green', cleanCount)}`);
  console.log(`Errors:    ${totalErrors ? c('red', totalErrors) : totalErrors}`);
  console.log(`Warnings:  ${totalWarnings ? c('yellow', totalWarnings) : totalWarnings}`);
  console.log('');

  if (totalErrors > 0) {
    console.log(c('red', `GATE: FAILED — ${totalErrors} error-severity violation(s). Block handoff/CI.`));
    process.exit(1);
  }
  console.log(c('green', 'GATE: PASSED — no error-severity violations.'));
  process.exit(0);
}

// Run CLI only when invoked directly (not when imported).
const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: node scripts/compliance-lint.mjs <path-to-json>');
    process.exit(2);
  }
  runCli(jsonPath);
}
