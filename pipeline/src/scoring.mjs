// Score each merged GA4+GSC record into one of four action buckets so the next
// content session knows what to do with every live URL. Pure + unit-tested.
//
// Buckets (priority order high->low when a record qualifies for several):
//   converter         conversions>0 (or BOFU/Transactional intent + real views)
//                     -> protect & optimise CTA / product cards; high value.
//   win-scale         position<=10 AND clicks>=winClicks
//                     -> already winning; scale via clusters + internal links.
//   striking-distance position in [sdMin, sdMax] AND impressions>=sdImpr
//                     -> page-2 / bottom-of-page-1 with demand; small refresh
//                        to break the top 10 (best ROI).
//   thin              impressions<thinImpr AND views<thinViews
//                     -> little visibility/demand; consolidate, rework, or cut.
//   none              doesn't qualify yet (watch).
//
// Thresholds are window-relative defaults (tuned for a ~28-day pull on a small
// blog) and overridable so they can be re-tuned once real volumes are known.
import { normalizeUrl } from "./ga-gsc.mjs";

export const DEFAULT_THRESHOLDS = {
  winClicks: 20,
  sdMin: 8,
  sdMax: 20,
  sdImpr: 100,
  thinImpr: 30,
  thinViews: 20,
};

const COMMERCIAL_FUNNELS = new Set(["BOFU", "MOFU"]);
const COMMERCIAL_INTENTS = new Set(["Transactional", "Commercial"]);

/**
 * Classify a single record (merged metrics + optional board fields) into bucket
 * tags. Returns every matched tag plus the single highest-priority `primary`.
 * @param {object} rec  merged record, may carry board fields {funnel, intent}
 * @param {object} [thresholds]
 */
export function classify(rec, thresholds = DEFAULT_THRESHOLDS) {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const tags = [];

  const views = num(rec.views);
  const clicks = num(rec.clicks);
  const impressions = num(rec.impressions);
  const position = rec.position == null ? null : Number(rec.position);
  const conversions = num(rec.conversions);

  const commercialIntent =
    COMMERCIAL_FUNNELS.has(rec.funnel) || COMMERCIAL_INTENTS.has(rec.intent);

  if (conversions > 0 || (commercialIntent && views >= t.thinViews)) tags.push("converter");
  if (position != null && position <= 10 && clicks >= t.winClicks) tags.push("win-scale");
  if (position != null && position >= t.sdMin && position <= t.sdMax && impressions >= t.sdImpr) {
    tags.push("striking-distance");
  }
  if (impressions < t.thinImpr && views < t.thinViews) tags.push("thin");

  // Priority order resolves multi-membership to one actionable primary bucket.
  const order = ["converter", "win-scale", "striking-distance", "thin"];
  const primary = order.find((b) => tags.includes(b)) || "none";
  return { tags, primary };
}

/**
 * A sortable opportunity score: weights the buckets where editing effort pays
 * off most (striking-distance + converter) above already-won pages.
 */
export function opportunityScore(rec, classification) {
  const impressions = num(rec.impressions);
  const clicks = num(rec.clicks);
  const conversions = num(rec.conversions);
  let s = 0;
  if (classification.tags.includes("striking-distance")) s += impressions * 1.0 + 200;
  if (classification.tags.includes("converter")) s += conversions * 500 + clicks * 5 + 150;
  if (classification.tags.includes("win-scale")) s += clicks * 3 + 50;
  if (classification.tags.includes("thin")) s -= 50;
  return Math.round(s);
}

/**
 * Join merged records to board rows (by normalized URL) and score everything.
 * Board rows that never got a live URL still surface (as `unmatched`) so the
 * session can see which planned posts have no data yet.
 * @param {Array} merged    output of mergeGaGsc()
 * @param {Array} boardRows normalized Notion items (need {finalUrl|url, ...})
 * @param {object} [thresholds]
 * @returns {{scored: Array, unmatchedBoard: Array, buckets: object}}
 */
export function scoreAll(merged = [], boardRows = [], thresholds = DEFAULT_THRESHOLDS) {
  const boardByUrl = new Map();
  for (const row of boardRows) {
    const u = row.finalUrl || row.url;
    if (u) boardByUrl.set(normalizeUrl(u), row);
  }

  const scored = merged.map((rec) => {
    const board = boardByUrl.get(rec.url) || null;
    const enriched = board
      ? { ...rec, funnel: board.funnel, intent: board.intent, title: board.title, pageId: board.id, targetKeyword: board.targetKeyword }
      : rec;
    const classification = classify(enriched, thresholds);
    return {
      ...enriched,
      bucket: classification.primary,
      tags: classification.tags,
      score: opportunityScore(enriched, classification),
      onBoard: Boolean(board),
    };
  });
  scored.sort((a, b) => b.score - a.score);

  const matchedUrls = new Set(scored.filter((s) => s.onBoard).map((s) => s.url));
  const unmatchedBoard = boardRows.filter((row) => {
    const u = row.finalUrl || row.url;
    return !u || !matchedUrls.has(normalizeUrl(u));
  });

  const buckets = scored.reduce((acc, s) => {
    acc[s.bucket] = (acc[s.bucket] || 0) + 1;
    return acc;
  }, {});

  return { scored, unmatchedBoard, buckets };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
