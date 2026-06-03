// Brief validation + normalization.
//
// A "brief" is the loosely-typed object the Dashboard (or a batch JSON file)
// produces. normalizeBrief() validates it against the Notion schema, fills
// sensible defaults, derives the Week Theme <-> Category pairing, and returns a
// clean object ready for mapping. It never throws — collect errors and decide.

import {
  AUTHORS,
  CATEGORIES,
  CATEGORY_TO_WEEK,
  DEFAULT_PROFILE,
  DEFAULTS,
  EVERGREENS,
  FUNNELS,
  INTENTS,
  MONTHS,
  PRIORITIES,
  SITES,
  STATUSES,
  TYPES,
  WEEK_THEMES,
  WEEK_TO_CATEGORY,
} from "./config.mjs";

/** @returns {string} a url-safe slug derived from `text`. */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled";
}

/**
 * Deterministically derive a Brief ID from site + day + title so the same brief
 * always maps to the same ID (used for dedupe). e.g. "WN-D03-terroir-in-one-minute".
 */
export function deriveBriefId(brief) {
  const sitePrefix = brief.site === "LIQ9" ? "LQ9" : "WN";
  const day = Number.isFinite(Number(brief.day))
    ? `D${String(Number(brief.day)).padStart(2, "0")}`
    : "Dxx";
  return `${sitePrefix}-${day}-${slugify(brief.title)}`;
}

function inEnum(value, allowed) {
  return value != null && allowed.includes(value);
}

/**
 * Validate + normalize a raw brief.
 *
 * @param {object} raw                raw brief
 * @param {object} [opts]
 * @param {object} [opts.profile]     schema profile (see config.schemaProfileFor).
 *   `profile.hasWeekTheme` controls whether Category<->Week Theme is derived;
 *   `profile.month` sets the default Month. Defaults to the June shape so
 *   existing callers are unaffected.
 * @returns {{ ok: boolean, value: object|null, errors: string[] }}
 */
export function normalizeBrief(raw, { profile = DEFAULT_PROFILE } = {}) {
  const errors = [];
  if (raw == null || typeof raw !== "object") {
    return { ok: false, value: null, errors: ["brief must be an object"] };
  }

  const b = { ...raw };

  // --- Required ---
  if (!b.title || typeof b.title !== "string" || !b.title.trim()) {
    errors.push("title is required");
  } else {
    b.title = b.title.trim();
  }
  if (!inEnum(b.site, SITES)) {
    errors.push(`site must be one of ${SITES.join(", ")}`);
  }

  // --- Derive Category <-> Week Theme (only on boards that have Week Theme) ---
  if (profile.hasWeekTheme) {
    if (b.category && !b.weekTheme && CATEGORY_TO_WEEK[b.category]) {
      b.weekTheme = CATEGORY_TO_WEEK[b.category];
    }
    if (b.weekTheme && !b.category && WEEK_TO_CATEGORY[b.weekTheme]) {
      b.category = WEEK_TO_CATEGORY[b.weekTheme];
    }
  } else {
    // Board has no Week Theme column — never carry one through to mapping.
    delete b.weekTheme;
  }

  // --- Enum checks (only when present) ---
  if (b.category != null && !inEnum(b.category, CATEGORIES)) {
    errors.push(`category must be one of ${CATEGORIES.join(", ")}`);
  }
  if (b.weekTheme != null && !inEnum(b.weekTheme, WEEK_THEMES)) {
    errors.push(`weekTheme must be one of ${WEEK_THEMES.join(", ")}`);
  }
  if (b.type != null && !inEnum(b.type, TYPES)) {
    errors.push(`type must be one of ${TYPES.join(", ")}`);
  }
  // July editorial enums (only validated when supplied).
  if (b.author != null && !inEnum(b.author, AUTHORS)) {
    errors.push(`author must be one of ${AUTHORS.join(", ")}`);
  }
  if (b.priority != null && !inEnum(b.priority, PRIORITIES)) {
    errors.push(`priority must be one of ${PRIORITIES.join(", ")}`);
  }
  if (b.intent != null && !inEnum(b.intent, INTENTS)) {
    errors.push(`intent must be one of ${INTENTS.join(", ")}`);
  }
  if (b.funnel != null && !inEnum(b.funnel, FUNNELS)) {
    errors.push(`funnel must be one of ${FUNNELS.join(", ")}`);
  }
  if (b.evergreen != null && !inEnum(b.evergreen, EVERGREENS)) {
    errors.push(`evergreen must be one of ${EVERGREENS.join(", ")}`);
  }

  // --- Defaults ---
  b.status = b.status || DEFAULTS.status;
  if (!inEnum(b.status, STATUSES)) {
    errors.push(`status must be one of ${STATUSES.join(", ")}`);
  }
  b.month = b.month || profile.month || DEFAULTS.month;
  if (!inEnum(b.month, MONTHS)) {
    errors.push(`month must be one of ${MONTHS.join(", ")}`);
  }

  // --- Numbers ---
  if (b.day != null && b.day !== "") {
    const day = Number(b.day);
    if (!Number.isFinite(day)) errors.push("day must be a number");
    else b.day = day;
  } else {
    delete b.day;
  }
  if (b.gaViews != null && b.gaViews !== "") {
    const views = Number(b.gaViews);
    if (!Number.isFinite(views)) errors.push("gaViews must be a number");
    else b.gaViews = views;
  } else {
    delete b.gaViews;
  }
  if (b.wordTarget != null && b.wordTarget !== "") {
    const wt = Number(b.wordTarget);
    if (!Number.isFinite(wt)) errors.push("wordTarget must be a number");
    else b.wordTarget = wt;
  } else {
    delete b.wordTarget;
  }

  // --- Date (accept YYYY-MM-DD or full ISO) ---
  if (b.publishDate) {
    const d = new Date(b.publishDate);
    if (Number.isNaN(d.getTime())) {
      errors.push("publishDate must be a valid date (YYYY-MM-DD or ISO)");
    }
  }

  // --- Brief ID: derive when missing so batches are idempotent ---
  if (!b.briefId && !errors.length) {
    b.briefId = deriveBriefId(b);
  }

  return { ok: errors.length === 0, value: errors.length ? null : b, errors };
}
