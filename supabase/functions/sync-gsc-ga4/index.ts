// Supabase Edge Function: Sync Google Search Console + GA4 metrics (Wine-Now + LIQ9).
// Service-account JWT (key from Vault via get_gcp_sa_key) -> GSC Search Analytics + GA4 runReport.
// Sites + property IDs from seo_config table. Backfill: POST {"startDate","endDate"} for any range.
// Scheduled 6 AM UTC daily via GitHub Actions cron.
//
// Memory model: results are streamed page-by-page straight into the DB and a wide
// range is split into <= CHUNK_DAYS windows, so peak memory stays bounded no matter
// how wide the requested range is (wide backfills previously OOM'd the worker by
// buffering the whole result set in one array).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

// Max days processed per delete/insert window. Keeps each window near the proven-good
// daily profile so peak memory and per-window work stay well under worker limits.
const CHUNK_DAYS = 14;

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(sa: any, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = { iss: sa.client_email, scope, aud: sa.token_uri, iat: now, exp: now + 3600 };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToPkcs8(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64url(new Uint8Array(sig))}`;
  const res = await fetch(sa.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) });
  const j = await res.json();
  if (!j.access_token) throw new Error("OAuth token error: " + JSON.stringify(j));
  return j.access_token as string;
}

function ymd(d: Date): string { return d.toISOString().split("T")[0]; }
function daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); }

// Default trailing windows. GSC lags ~3 days (Google finalization); GA4 -> yesterday.
function gscWindow(): [string, string] { return [daysAgo(30), daysAgo(3)]; }
function ga4Window(): [string, string] { return [daysAgo(28), daysAgo(1)]; }

// Split [start,end] (inclusive) into consecutive windows of at most `days` days.
function chunkRange(start: string, end: string, days: number): [string, string][] {
  const out: [string, string][] = [];
  const end_ = new Date(`${end}T00:00:00Z`);
  let cur = new Date(`${start}T00:00:00Z`);
  while (cur <= end_) {
    const winEnd = new Date(cur);
    winEnd.setUTCDate(winEnd.getUTCDate() + days - 1);
    const capped = winEnd > end_ ? end_ : winEnd;
    out.push([ymd(cur), ymd(capped)]);
    cur = new Date(capped);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

// GA4 returns the date dimension as "YYYYMMDD"; normalize to "YYYY-MM-DD".
function ga4Date(v: string): string {
  return v && v.length === 8 ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}` : v;
}

// Insert in batches so a large date×dimension result stays under payload limits.
async function insertChunked(table: string, rows: any[], size = 1000) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + size));
    if (error) throw new Error(`${table} insert: ${error.message}`);
  }
}

// Stream GSC Search Analytics straight into `table`, paging through startRow.
// (rowLimit caps TOTAL rows per request, not per day — with a date dimension we must
// page.) Each page is mapped and inserted immediately so we never hold the full
// result set in memory. The window is delete-replaced only once real data arrives,
// so a 0-row API response never wipes existing rows.
async function syncGscStream(
  token: string,
  siteUrl: string,
  site: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  table: string,
  mapRow: (r: any) => any,
): Promise<number> {
  const rowLimit = 25000; // GSC max per request
  let startRow = 0;
  let total = 0;
  let cleared = false;
  while (true) {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, startRow }) },
    );
    const body = await res.json();
    if (!res.ok) throw new Error(`GSC ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
    const apiRows = body.rows || [];
    if (apiRows.length) {
      if (!cleared) {
        await supabase.from(table).delete().eq("site", site).gte("metric_date", startDate).lte("metric_date", endDate);
        cleared = true;
      }
      const rows = apiRows.map(mapRow).filter((r: any) => r.metric_date && (r.keyword || r.page_path));
      await insertChunked(table, rows);
      total += rows.length;
    }
    if (apiRows.length < rowLimit) break;
    startRow += rowLimit;
  }
  return total;
}

async function syncGSC(token: string, siteUrl: string, site: string, startDate: string, endDate: string) {
  // dimensions ["date","query"] -> keys[0]=date (YYYY-MM-DD), keys[1]=query.
  return await syncGscStream(token, siteUrl, site, startDate, endDate, ["date", "query"], "seo_gsc_daily", (r: any) => ({
    product_id: null, site, metric_date: r.keys?.[0] ?? "", keyword: r.keys?.[1] ?? "",
    impressions: Math.round(r.impressions || 0), clicks: Math.round(r.clicks || 0), ctr: r.ctr || 0,
    rank_position: r.position || 0, avg_rank_position: r.position || 0, synced_at: new Date().toISOString(),
  }));
}

async function syncGSCPages(token: string, siteUrl: string, site: string, startDate: string, endDate: string) {
  // dimensions ["date","page"] -> keys[0]=date, keys[1]=page.
  return await syncGscStream(token, siteUrl, site, startDate, endDate, ["date", "page"], "seo_gsc_pages_daily", (r: any) => ({
    site, metric_date: r.keys?.[0] ?? "", page_path: r.keys?.[1] ?? "",
    impressions: Math.round(r.impressions || 0), clicks: Math.round(r.clicks || 0), ctr: r.ctr || 0,
    avg_rank_position: r.position || 0, synced_at: new Date().toISOString(),
  }));
}

async function syncGA4(token: string, propertyId: string, site: string, startDate: string, endDate: string) {
  const limit = 25000;
  let offset = 0;
  let total = 0;
  let cleared = false;
  while (true) {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      // dimensions [date, pagePath] -> per-day rows.
      body: JSON.stringify({ dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }, { name: "pagePath" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" }, { name: "conversions" }], limit, offset }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(`GA4 ${site} ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
    const apiRows = body.rows || [];
    if (apiRows.length) {
      if (!cleared) {
        await supabase.from("seo_ga4_daily").delete().eq("site", site).gte("metric_date", startDate).lte("metric_date", endDate);
        cleared = true;
      }
      const rows = apiRows.map((r: any) => {
        const dv = r.dimensionValues || [];
        const m = r.metricValues || [];
        const num = (i: number) => Number(m[i]?.value || 0);
        const sessions = Math.round(num(1));
        const conversions = Math.round(num(5));
        return { product_id: null, site, metric_date: ga4Date(dv[0]?.value ?? ""), page_path: dv[1]?.value ?? "", users: Math.round(num(0)), sessions, pageviews: Math.round(num(2)), bounce_rate: num(3), avg_session_duration: num(4), goal_completions: conversions, conversion_rate: sessions > 0 ? conversions / sessions : 0, synced_at: new Date().toISOString() };
      }).filter((r: any) => r.page_path && r.metric_date);
      await insertChunked("seo_ga4_daily", rows);
      total += rows.length;
    }
    const rowCount = Number(body.rowCount || (offset + apiRows.length));
    if (apiRows.length < limit || offset + apiRows.length >= rowCount) break;
    offset += limit;
  }
  return total;
}

async function logSync(syncType: string, imported: number, status: string, error?: string) {
  await supabase.from("seo_sync_log").insert({ sync_type: syncType, records_imported: imported, records_updated: 0, sync_date: ymd(new Date()), completed_at: new Date().toISOString(), status, error_message: error ?? null });
}

async function getConfig(): Promise<Record<string, string>> {
  const { data } = await supabase.from("seo_config").select("config_key, config_value");
  const cfg: Record<string, string> = {};
  (data || []).forEach((r: any) => (cfg[r.config_key] = r.config_value));
  return cfg;
}

const isYmd = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Run `fn` over each (site, window) pair, accumulating row counts and capturing
// per-site errors without aborting the rest of the sync.
async function runSynced(
  targets: [string, string][],
  windows: [string, string][],
  results: Record<string, unknown>,
  key: string,
  fn: (id: string, site: string, start: string, end: string) => Promise<number>,
): Promise<number> {
  let grand = 0;
  for (const [id, site] of targets) {
    let siteTotal = 0;
    try {
      for (const [s, e] of windows) siteTotal += await fn(id, site, s, e);
      results[`${key}_${site}`] = siteTotal;
    } catch (err) {
      results[`${key}_${site}_error`] = String(err);
      await logSync(`${key}_${site}`, siteTotal, "failed", String(err));
    }
    grand += siteTotal;
  }
  return grand;
}

async function main(opts: { startDate?: string; endDate?: string } = {}) {
  const cfg = await getConfig();
  const { data: keyJson, error: keyErr } = await supabase.rpc("get_gcp_sa_key");
  if (keyErr || !keyJson) throw new Error("Cannot read service account key from Vault: " + (keyErr?.message || "empty"));
  const sa = JSON.parse(keyJson as string);
  const token = await getAccessToken(sa, "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly");

  // Backfill override: explicit range applies to BOTH GSC and GA4; else defaults.
  const backfill = isYmd(opts.startDate) && isYmd(opts.endDate);
  const [gscStart, gscEnd] = backfill ? [opts.startDate!, opts.endDate!] : gscWindow();
  const [ga4Start, ga4End] = backfill ? [opts.startDate!, opts.endDate!] : ga4Window();

  // Process wide ranges as a series of bounded windows to keep peak memory in check.
  const gscWindows = chunkRange(gscStart, gscEnd, CHUNK_DAYS);
  const ga4Windows = chunkRange(ga4Start, ga4End, CHUNK_DAYS);

  const results: Record<string, unknown> = { mode: backfill ? "backfill" : "daily", gscRange: [gscStart, gscEnd], ga4Range: [ga4Start, ga4End], chunkDays: CHUNK_DAYS };

  const gscSites: [string, string][] = [];
  if (cfg.GSC_SITE_URL) gscSites.push([cfg.GSC_SITE_URL, "wine-now"]);
  if (cfg.GSC_SITE_URL_LIQ9) gscSites.push([cfg.GSC_SITE_URL_LIQ9, "liq9"]);

  const gscTotal = await runSynced(gscSites, gscWindows, results, "gsc", (url, site, s, e) => syncGSC(token, url, site, s, e));
  if (gscTotal > 0) await logSync("gsc", gscTotal, "completed");

  const gscPagesTotal = await runSynced(gscSites, gscWindows, results, "gsc_pages", (url, site, s, e) => syncGSCPages(token, url, site, s, e));
  if (gscPagesTotal > 0) await logSync("gsc_pages", gscPagesTotal, "completed");

  const ga4Props: [string, string][] = [];
  if (cfg.GA4_PROPERTY_ID) ga4Props.push([cfg.GA4_PROPERTY_ID, "wine-now"]);
  if (cfg.GA4_PROPERTY_ID_LIQ9) ga4Props.push([cfg.GA4_PROPERTY_ID_LIQ9, "liq9"]);

  const ga4Total = await runSynced(ga4Props, ga4Windows, results, "ga4", (pid, site, s, e) => syncGA4(token, pid, site, s, e));
  if (ga4Total > 0) await logSync("ga4", ga4Total, "completed");

  // Detectors run on the daily sync only (skip during a backfill).
  if (!backfill) {
    try { await supabase.rpc("detect_seo_opportunities", { impression_threshold: 500, ctr_threshold: 0.02 }); } catch (_) {}
    try { await supabase.rpc("detect_seo_regressions", { days: 7, position_drop_threshold: 3, ctr_drop_threshold: 0.2 }); } catch (_) {}
  }

  return { status: "success", ...results };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let opts: { startDate?: string; endDate?: string } = {};
  try { opts = await req.json(); } catch { opts = {}; }
  try {
    const result = await main(opts);
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    await logSync("sync", 0, "failed", String(error));
    return new Response(JSON.stringify({ error: String(error), status: "failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
