import type { Brand, BriefOption, GA4Row, GSCRow } from "./types";
import { guessBrand } from "./brands";

/**
 * Generates 3 brief options for a brand by combining GA4 topic signals
 * with GSC keyword signals. This is a deterministic, signal-driven
 * generator (no LLM) — it surfaces the strongest opportunities so the
 * user can pick one, then refine in the Brief Editor.
 */
export function generateBriefOptions(
  brand: Brand,
  ga4: GA4Row[],
  gsc: GSCRow[],
): BriefOption[] {
  // Filter signals to this brand
  const pages = ga4
    .filter((r) => guessBrand(`${r.pageTitle} ${r.pagePath}`) === brand)
    .sort((a, b) => b.views - a.views);

  const keywords = gsc
    .filter((r) => guessBrand(r.query) === brand)
    .sort((a, b) => b.impressions - a.impressions);

  const maxViews = pages[0]?.views || 1;
  const maxImpr = keywords[0]?.impressions || 1;

  // Build up to 3 options pairing a hot page with a high-opportunity keyword
  const options: BriefOption[] = [];
  const used = new Set<string>();

  for (let i = 0; i < 3; i++) {
    const page = pages[i] || pages[pages.length - 1];
    // pick a keyword not yet used, prefer high impressions + low CTR (opportunity)
    const kw =
      keywords.find((k) => {
        const opportunity = k.impressions * (1 - k.ctr / 100);
        return opportunity > 0 && !used.has(k.query);
      }) ||
      keywords[i] ||
      keywords[0];

    if (!page && !kw) break;
    if (kw) used.add(kw.query);

    const topicSeed = page?.pageTitle?.trim() || kw?.query || "New topic";
    const seoKeyword = kw?.query || topicSeed;

    const viewScore = page ? Math.round((page.views / maxViews) * 50) : 0;
    const imprScore = kw ? Math.round((kw.impressions / maxImpr) * 50) : 0;
    const signalScore = Math.min(100, viewScore + imprScore);

    options.push({
      topic: titleCase(topicSeed),
      seoKeyword,
      key: `Give readers a clear, confident answer on "${seoKeyword}" — the one thing they should remember.`,
      tension: `Most readers are unsure about ${seoKeyword.toLowerCase()} and settle for guesswork instead of getting it right.`,
      story: `Open with the common mistake → explain the why → give 3 concrete, brand-specific recommendations → finish with a practical tip and a LINE CTA.`,
      rationale: buildRationale(page, kw),
      signalScore,
    });
  }

  return options;
}

function buildRationale(page?: GA4Row, kw?: GSCRow): string {
  const parts: string[] = [];
  if (page) {
    parts.push(
      `Page "${truncate(page.pageTitle, 40)}" drew ${page.views.toLocaleString()} views`,
    );
  }
  if (kw) {
    parts.push(
      `"${kw.query}" has ${kw.impressions.toLocaleString()} impressions at ${kw.ctr.toFixed(
        1,
      )}% CTR (pos ${kw.position.toFixed(1)}) — room to capture more clicks`,
    );
  }
  return parts.join(" · ") || "Based on available signals.";
}

function titleCase(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
