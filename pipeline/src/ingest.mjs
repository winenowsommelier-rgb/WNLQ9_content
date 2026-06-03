// Orchestration: validate -> (optional dedupe) -> map -> create row.

import { getConfig, schemaProfileFor } from "./config.mjs";
import { briefToNotionProperties } from "./mapping.mjs";
import { createClient } from "./notion.mjs";
import { normalizeBrief } from "./validate.mjs";

/**
 * Ingest a single brief.
 *
 * @param {object} raw                 raw brief from dashboard/JSON
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun]       validate + map but do not call Notion
 * @param {boolean} [opts.skipExisting] skip if a row with the same Brief ID exists
 * @param {object}  [opts.client]       Notion client (created lazily if omitted)
 * @param {object}  [opts.profile]      schema profile (else resolved from the
 *   target database id so the right columns are written per board)
 * @returns {Promise<{status: 'created'|'skipped'|'invalid'|'dry-run', briefId?: string, url?: string, properties?: object, errors?: string[]}>}
 */
export async function ingestBrief(raw, opts = {}) {
  const { dryRun = false, skipExisting = false } = opts;
  const profile =
    opts.profile || schemaProfileFor((opts.client?.config || getConfig()).databaseId);

  const { ok, value, errors } = normalizeBrief(raw, { profile });
  if (!ok) return { status: "invalid", errors };

  const properties = briefToNotionProperties(value, { hasWeekTheme: profile.hasWeekTheme });

  if (dryRun) {
    return { status: "dry-run", briefId: value.briefId, properties };
  }

  const client = opts.client || createClient();

  if (skipExisting && value.briefId) {
    const existing = await client.findByBriefId(value.briefId);
    if (existing) {
      return { status: "skipped", briefId: value.briefId, url: existing.url };
    }
  }

  const page = await client.createRow(properties);
  return { status: "created", briefId: value.briefId, url: page.url };
}

/**
 * Ingest a batch of briefs sequentially (gentle on the Notion rate limit).
 * @returns {Promise<{summary: object, results: object[]}>}
 */
export async function ingestBriefs(briefs, opts = {}) {
  const list = Array.isArray(briefs) ? briefs : [briefs];
  const client = opts.client || (opts.dryRun ? undefined : createClient());

  const results = [];
  const summary = { total: list.length, created: 0, skipped: 0, invalid: 0, failed: 0 };

  for (const [i, brief] of list.entries()) {
    try {
      const result = await ingestBrief(brief, { ...opts, client });
      results.push({ index: i, ...result });
      if (result.status === "created") summary.created++;
      else if (result.status === "skipped") summary.skipped++;
      else if (result.status === "invalid") summary.invalid++;
    } catch (err) {
      summary.failed++;
      results.push({ index: i, status: "failed", error: err.message });
    }
  }

  return { summary, results };
}
