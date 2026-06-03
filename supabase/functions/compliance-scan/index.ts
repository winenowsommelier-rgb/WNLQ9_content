// Supabase Edge Function: WNLQ9 Thai-alcohol compliance gate.
//
// Fetches Review/Done/Published content rows from the Notion content system
// (Master Topic Ledger + monthly production DBs), runs the §18.2 compliance
// lint rules over each row's Title / Content EN / Content TH, and posts any
// error-severity violations to Slack. Designed to run daily from the SEO cron.
//
// This is the automated, enforced counterpart to scripts/compliance-lint.mjs.
// The lint rules below are a faithful port of that script — KEEP THE TWO IN
// SYNC. The .mjs file remains the source of truth for the rule definitions and
// is what runs as the local/CI gate; this function re-implements the same pure
// core so it can run in Deno against live Notion data.
//
// Secrets are read from Supabase Vault via service_role RPCs (never inlined):
//   get_vault_secret('notion_token')  -> Notion internal integration token
//   get_slack_webhook()               -> Slack incoming webhook URL
//
// Invocation (cron uses GET; query params optional):
//   GET /compliance-scan
//   GET /compliance-scan?statuses=Review,Done&verbose=true
//
// Returns 200 with a JSON summary in all non-fatal cases (including
// "not_configured" when notion_token is absent), 500 only on unexpected error.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const RATE_LIMIT_DELAY_MS = 350; // Notion allows ~3 req/sec; stay under it.

// Default statuses that constitute a "gate point" — content at or past Review
// must be compliant. Overridable via ?statuses=A,B,C.
const DEFAULT_GATE_STATUSES = ["Review", "Done", "Published"];

// Notion databases / data sources to scan. IDs are hardcoded so the function is
// self-contained (mirrors scripts/notion-backup.mjs). The Master Topic Ledger
// carries no Content EN/TH fields, so it only contributes title-level checks;
// the monthly DBs carry the article content fields.
const TARGETS = [
  { name: "master-topic-ledger", id: "43240f1120df437391017e67a64723a7" },
  { name: "july-2026", id: "d342f9b8-3725-4068-9ccb-03b09821b0c8" },
  { name: "june-2026", id: "6be4a7bb-d42c-4286-be1b-fa73e3635b45" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ *
 * Compliance rules — faithful port of scripts/compliance-lint.mjs §18.2.
 * ------------------------------------------------------------------ */

// Buddhist alcohol sales-ban days (วันพระใหญ่). On these dates commercial
// selling of alcohol is prohibited, so price / purchase CTA / "buy this bottle"
// copy must NOT be live. 2026 CONFIRMED only (others pending [VERIFY] in .mjs).
const BAN_DATES = [
  "2026-07-29", // Asalha Bucha  (confirmed)
  "2026-07-30", // Khao Phansa   (confirmed)
];

const PRICE_PATTERNS = [
  /฿\s?\d[\d,]*\d|฿\s?\d/g,
  /\d[\d,]*\d\s?บาท|\d\s?บาท/g,
  /(?:THB|thb|บาท)\s?\d[\d,]*\d|(?:THB|thb|บาท)\s?\d/g,
  /\d[\d,]*\d\s?THB|\d\s?THB/gi,
  /ราคา[\s\S]{0,15}?\d[\d,]*(?:\.\d+)?\s?(?:บาท|฿|THB)/gi,
];

const EMOJI_PATTERN =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F0FF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

const AGE_INDICATORS = [
  "ผู้ที่มีอายุ",
  "อายุ 20",
  "บุคคลอายุต่ำกว่า",
  "20+",
  "20",
];

const DIRECT_PURCHASE_PATTERNS = [
  /\/checkout\b/gi,
  /\/cart\b/gi,
  /add\s+to\s+cart/gi,
  /สั่งซื้อทันที/g,
  /ซื้อเลย[\s\S]{0,40}?(?:https?:\/\/|www\.|\/(?:cart|checkout|product))/gi,
  /(?:https?:\/\/|href=)[\s\S]{0,40}?ซื้อเลย/gi,
];

const COMMERCIAL_PATTERNS = [/แนะนำให้ซื้อ/g, /\bbuy\b/gi, /ขวดนี้/g];

const FIELDS = ["title_en", "title_th", "content_en", "content_th"] as const;

interface Violation {
  rule: string;
  severity: "error" | "warning";
  field: string;
  match: string;
}

interface LintRecord {
  title_en?: string;
  title_th?: string;
  content_en?: string;
  content_th?: string;
  publishDate?: string;
  funnel?: string;
}

function collectMatches(text: string, regex: RegExp): string[] {
  if (!text) return [];
  const out: string[] = [];
  const re = new RegExp(
    regex.source,
    regex.flags.includes("g") ? regex.flags : regex.flags + "g",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[0]);
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

function findPriceMatches(text: string): string[] {
  return PRICE_PATTERNS.flatMap((re) => collectMatches(text, re));
}
function findPurchaseCtaMatches(text: string): string[] {
  return DIRECT_PURCHASE_PATTERNS.flatMap((re) => collectMatches(text, re));
}
function findCommercialMatches(text: string): string[] {
  return COMMERCIAL_PATTERNS.flatMap((re) => collectMatches(text, re));
}

function normalizeDate(d?: string): string {
  return d ? String(d).slice(0, 10) : "";
}

function lintContent(rec: LintRecord): Violation[] {
  const record: Record<string, string> = {
    title_en: rec.title_en || "",
    title_th: rec.title_th || "",
    content_en: rec.content_en || "",
    content_th: rec.content_th || "",
  };
  const violations: Violation[] = [];

  // Rule 1: no_onpage_price (error)
  for (const field of FIELDS) {
    for (const match of findPriceMatches(record[field])) {
      violations.push({ rule: "no_onpage_price", severity: "error", field, match });
    }
  }

  // Rule 2: no_emoji (error)
  for (const field of FIELDS) {
    for (const match of collectMatches(record[field], EMOJI_PATTERN)) {
      violations.push({
        rule: "no_emoji",
        severity: "error",
        field,
        match: `${match} (U+${match.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")})`,
      });
    }
  }

  // Rule 3: missing_age_notice (warning) — Thai content only
  const hasAge = AGE_INDICATORS.some((ind) => record.content_th.includes(ind));
  if (!hasAge) {
    violations.push({
      rule: "missing_age_notice",
      severity: "warning",
      field: "content_th",
      match: '(no age indicator found — expected e.g. "20+", "ผู้ที่มีอายุ", "อายุ 20")',
    });
  }

  // Rule 4: direct_purchase_cta (warning)
  for (const field of FIELDS) {
    for (const match of findPurchaseCtaMatches(record[field])) {
      violations.push({ rule: "direct_purchase_cta", severity: "warning", field, match });
    }
  }

  // Rule 5: salesban_commercial (error) — only on ban dates
  const pubDate = normalizeDate(rec.publishDate);
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
          rule: "salesban_commercial",
          severity: "error",
          field,
          match: `${match} (publishDate ${pubDate} is a Buddhist sales-ban day)`,
        });
      }
    }
  }

  return violations;
}

/* ------------------------------------------------------------------ *
 * Notion fetch + property mapping
 * ------------------------------------------------------------------ */

async function notionRequest(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<any> {
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  let res = await fetch(`${NOTION_API}${path}`, init);
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || 1;
    await sleep(retryAfter * 1000);
    res = await fetch(`${NOTION_API}${path}`, init);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Notion ${method} ${path} -> ${res.status}: ${text}`);
  }
  return res.json();
}

async function queryDatabase(token: string, id: string): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const data = await notionRequest(token, "POST", `/databases/${id}/query`, body);
    if (Array.isArray(data.results)) results.push(...data.results);
    hasMore = Boolean(data.has_more);
    cursor = data.next_cursor || undefined;
    if (hasMore) await sleep(RATE_LIMIT_DELAY_MS);
  }
  return results;
}

// --- Notion property value extractors ---

function plainTextFrom(richArray: any[]): string {
  if (!Array.isArray(richArray)) return "";
  return richArray.map((rt) => rt?.plain_text ?? "").join("");
}

function getTitle(props: Record<string, any>): string {
  for (const v of Object.values(props)) {
    if (v && v.type === "title") return plainTextFrom(v.title);
  }
  return "";
}

function getRichText(props: Record<string, any>, name: string): string {
  const v = props[name];
  if (v && v.type === "rich_text") return plainTextFrom(v.rich_text);
  return "";
}

function getSelectName(props: Record<string, any>, name: string): string {
  const v = props[name];
  if (!v) return "";
  if (v.type === "select") return v.select?.name ?? "";
  if (v.type === "status") return v.status?.name ?? "";
  return "";
}

function getDateStart(props: Record<string, any>, name: string): string {
  const v = props[name];
  if (v && v.type === "date") return v.date?.start ?? "";
  return "";
}

// The page status may be stored as either a "status" or "select" property.
function getStatus(props: Record<string, any>): string {
  const v = props["Status"];
  if (!v) return "";
  if (v.type === "status") return v.status?.name ?? "";
  if (v.type === "select") return v.select?.name ?? "";
  return "";
}

// Title carries "TH / EN". Split so violations are attributed to the right
// field; fall back to putting the whole string in title_th (it carries Thai).
function splitTitle(title: string): { th: string; en: string } {
  const idx = title.indexOf(" / ");
  if (idx === -1) return { th: title, en: "" };
  return { th: title.slice(0, idx), en: title.slice(idx + 3) };
}

interface ScanRow {
  target: string;
  pageId: string;
  url: string;
  status: string;
  briefId: string;
  site: string;
  record: LintRecord;
}

function mapRow(target: string, page: any): ScanRow {
  const props = page.properties || {};
  const title = getTitle(props);
  const { th, en } = splitTitle(title);
  return {
    target,
    pageId: page.id,
    url: page.url || "",
    status: getStatus(props),
    briefId: getRichText(props, "Brief ID") || getSelectName(props, "Brief ID"),
    site: getSelectName(props, "Site"),
    record: {
      title_th: th,
      title_en: en,
      content_en: getRichText(props, "Content EN"),
      content_th: getRichText(props, "Content TH"),
      publishDate: getDateStart(props, "Publish Date"),
      funnel: getSelectName(props, "Funnel"),
    },
  };
}

/* ------------------------------------------------------------------ *
 * Slack
 * ------------------------------------------------------------------ */

interface FailingPage {
  label: string;
  url: string;
  errors: Violation[];
}

function buildSlackText(
  failing: FailingPage[],
  totals: { scanned: number; errors: number; warnings: number; statuses: string[] },
): string {
  if (failing.length === 0) {
    return `:white_check_mark: WNLQ9 compliance gate: ${totals.scanned} ` +
      `${totals.statuses.join("/")} page(s) scanned, no error-severity violations.`;
  }
  const header =
    `:rotating_light: *WNLQ9 compliance gate — ${totals.errors} error-severity ` +
    `violation(s) across ${failing.length} page(s)* ` +
    `(scanned ${totals.scanned} ${totals.statuses.join("/")} page(s))`;

  const body = failing
    .slice(0, 15)
    .map((p) => {
      const lines = p.errors
        .slice(0, 6)
        .map((v) => `    • [${v.rule}] ${v.field} → ${v.match}`)
        .join("\n");
      const more = p.errors.length > 6 ? `\n    • …and ${p.errors.length - 6} more` : "";
      const link = p.url ? `<${p.url}|${p.label}>` : p.label;
      return `*${link}*\n${lines}${more}`;
    })
    .join("\n\n");

  const overflow =
    failing.length > 15 ? `\n\n…and ${failing.length - 15} more failing page(s).` : "";

  return `${header}\n\n${body}${overflow}`;
}

/* ------------------------------------------------------------------ *
 * Handler
 * ------------------------------------------------------------------ */

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const verbose = url.searchParams.get("verbose") === "true";
    const statusesParam = url.searchParams.get("statuses");
    const gateStatuses = statusesParam
      ? statusesParam.split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_GATE_STATUSES;

    // 1. Notion token from Vault (fail-soft: surface config gap, don't spam Slack).
    const { data: notionToken, error: tokenErr } = await supabase.rpc(
      "get_vault_secret",
      { secret_name: "notion_token" },
    );
    if (tokenErr || !notionToken) {
      return new Response(
        JSON.stringify({
          status: "not_configured",
          reason:
            "notion_token is not present in Supabase Vault. Store it " +
            "(select vault.create_secret('<token>','notion_token')) to enable the gate.",
          rpc_error: tokenErr ? String(tokenErr.message ?? tokenErr) : null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. Fetch + scan all target databases.
    const failing: FailingPage[] = [];
    let scanned = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    const targetStats: Record<string, { scanned: number; errors: number }> = {};

    for (const target of TARGETS) {
      const pages = await queryDatabase(notionToken as string, target.id);
      targetStats[target.name] = { scanned: 0, errors: 0 };

      for (const page of pages) {
        const row = mapRow(target.name, page);
        if (!gateStatuses.includes(row.status)) continue;

        scanned++;
        targetStats[target.name].scanned++;

        const violations = lintContent(row.record);
        const errors = violations.filter((v) => v.severity === "error");
        const warnings = violations.filter((v) => v.severity === "warning");
        totalErrors += errors.length;
        totalWarnings += warnings.length;

        if (errors.length > 0) {
          targetStats[target.name].errors += errors.length;
          const label =
            row.briefId ||
            row.record.title_en ||
            row.record.title_th ||
            row.pageId;
          failing.push({ label, url: row.url, errors });
        }
      }
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    // 3. Post to Slack — alert on errors; "all clear" only when verbose.
    const { data: webhookUrl, error: webhookErr } = await supabase.rpc("get_slack_webhook");
    const slackUrl = webhookErr ? null : (webhookUrl as string | null);

    let alertSent = false;
    const shouldPost = slackUrl && (failing.length > 0 || verbose);
    if (shouldPost) {
      const text = buildSlackText(failing, {
        scanned,
        errors: totalErrors,
        warnings: totalWarnings,
        statuses: gateStatuses,
      });
      const slackRes = await fetch(slackUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      alertSent = slackRes.ok;
    }

    return new Response(
      JSON.stringify({
        status: failing.length > 0 ? "violations_found" : "clean",
        gate_statuses: gateStatuses,
        pages_scanned: scanned,
        failing_pages: failing.length,
        total_errors: totalErrors,
        total_warnings: totalWarnings,
        per_target: targetStats,
        alert_sent: alertSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
