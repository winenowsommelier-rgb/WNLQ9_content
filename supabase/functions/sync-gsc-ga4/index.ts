// Supabase Edge Function: Sync Google Search Console + GA4 metrics
// Pulls REAL data directly from Google APIs (no Supermetrics in the loop).
//
// 1. Reads the GCP service-account JSON from Supabase Vault (get_vault_secret RPC).
// 2. Reads site + GA4 property config from the seo_config table.
// 3. Mints a Google OAuth2 access token (RS256-signed JWT, jwt-bearer grant).
// 4. Streams GSC Search Analytics (date x query) per page -> insert -> release.
// 5. Streams GA4 runReport (date x pagePath) per page -> insert -> release.
// 6. Delete-then-insert per site+date window (idempotent), logs to seo_sync_log.
//
// Memory-safe: never holds more than one API page (<=25k rows) in memory, so
// large backfills (months) and high-traffic days won't hit WORKER_RESOURCE_LIMIT.
//
// Trigger: POST. Body (optional): { startDate, endDate } | { days:N } | {} (default last 4 days)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

const GSC_PAGE = 25000;
const GA4_PAGE = 50000;
const INSERT_CHUNK = 500;

function fmtDate(d: Date): string { return d.toISOString().slice(0, 10); }
function ga4DateToISO(s: string): string { return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`; }
function b64url(input: string | Uint8Array): string {
  let bin: string;
  if (typeof input === "string") { bin = btoa(unescape(encodeURIComponent(input))); }
  else { let s = ""; for (let i = 0; i < input.length; i++) s += String.fromCharCode(input[i]); bin = btoa(s); }
  return bin.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function pemToPkcs8(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const bin = atob(b64); const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

interface ServiceAccount { client_email: string; private_key: string; }

async function getServiceAccount(): Promise<ServiceAccount> {
  const { data, error } = await supabase.rpc("get_vault_secret", { secret_name: "gcp_sa_key" });
  if (error) throw new Error(`Vault read failed: ${error.message}`);
  if (!data) throw new Error("gcp_sa_key not found in Vault");
  return JSON.parse(data as string);
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = { iss: sa.client_email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToPkcs8(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const jwt = `${unsigned}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(json)}`);
  return json.access_token as string;
}

async function loadConfig(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("seo_config").select("config_key, config_value");
  if (error) throw new Error(`seo_config read failed: ${error.message}`);
  const cfg: Record<string, string> = {};
  for (const row of data ?? []) cfg[row.config_key] = row.config_value;
  return cfg;
}

async function insertRows(table: string, rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + INSERT_CHUNK));
    if (error) throw new Error(`Insert ${table} failed: ${error.message}`);
  }
}

// Streamed GSC: fetch one page -> map -> insert -> release. Returns total inserted.
async function syncGSC(token: string, slug: string, siteUrl: string, startDate: string, endDate: string): Promise<number> {
  await supabase.from("seo_gsc_daily").delete().eq("site", slug).gte("metric_date", startDate).lte("metric_date", endDate);
  let startRow = 0, total = 0;
  while (true) {
    const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["date", "query"], rowLimit: GSC_PAGE, startRow, dataState: "final" }),
    });
    if (!res.ok) throw new Error(`GSC ${siteUrl} ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const raw = json.rows ?? [];
    if (raw.length === 0) break;
    const now = new Date().toISOString();
    const rows = raw.map((r: any) => { const pos = r.position ?? null; return {
      site: slug, product_id: null, keyword: r.keys?.[1] ?? "", metric_date: r.keys?.[0] ?? null,
      impressions: r.impressions ?? 0, clicks: r.clicks ?? 0, ctr: r.ctr ?? 0,
      rank_position: pos, avg_rank_position: pos, synced_at: now }; });
    await insertRows("seo_gsc_daily", rows);
    total += rows.length;
    if (raw.length < GSC_PAGE) break;
    startRow += raw.length;
  }
  return total;
}

// Streamed GA4: paginate with offset/limit -> map -> insert -> release.
async function syncGA4(token: string, slug: string, propertyId: string, startDate: string, endDate: string): Promise<number> {
  await supabase.from("seo_ga4_daily").delete().eq("site", slug).gte("metric_date", startDate).lte("metric_date", endDate);
  let offset = 0, total = 0;
  while (true) {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: "pagePath" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" }, { name: "conversions" }],
        limit: GA4_PAGE, offset, keepEmptyRows: false,
      }),
    });
    if (!res.ok) throw new Error(`GA4 ${propertyId} ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const raw = json.rows ?? [];
    if (raw.length === 0) break;
    const now = new Date().toISOString();
    const rows = raw.map((r: any) => { const dv = r.dimensionValues ?? []; const mv = r.metricValues ?? [];
      const sessions = Number(mv[0]?.value ?? 0); const conversions = Number(mv[5]?.value ?? 0); return {
      site: slug, product_id: null, page_path: dv[1]?.value ?? "", metric_date: ga4DateToISO(dv[0]?.value ?? ""),
      sessions, users: Number(mv[1]?.value ?? 0), pageviews: Number(mv[2]?.value ?? 0),
      bounce_rate: Number(mv[3]?.value ?? 0), avg_session_duration: Number(mv[4]?.value ?? 0),
      goal_completions: conversions, conversion_rate: sessions > 0 ? conversions / sessions : 0, synced_at: now }; });
    await insertRows("seo_ga4_daily", rows);
    total += rows.length;
    if (raw.length < GA4_PAGE) break;
    offset += raw.length;
  }
  return total;
}

async function logSync(syncType: string, imported: number, status: string, errorMessage?: string, notes?: string) {
  await supabase.from("seo_sync_log").insert({
    sync_type: syncType, records_imported: imported, records_updated: 0,
    sync_date: fmtDate(new Date()), completed_at: new Date().toISOString(),
    status, error_message: errorMessage ?? null, notes: notes ?? null,
  });
}

function resolveWindow(body: Record<string, unknown>): { startDate: string; endDate: string } {
  if (typeof body.startDate === "string" && typeof body.endDate === "string") return { startDate: body.startDate, endDate: body.endDate };
  const days = typeof body.days === "number" ? body.days : 4;
  const end = new Date(); const start = new Date(); start.setDate(start.getDate() - days);
  return { startDate: fmtDate(start), endDate: fmtDate(end) };
}

async function main(body: Record<string, unknown>) {
  const { startDate, endDate } = resolveWindow(body);
  const cfg = await loadConfig();
  const sa = await getServiceAccount();
  const token = await getAccessToken(sa);
  // Optional source filter: { source: "gsc" | "ga4" } to run one pipe at a time.
  const only = typeof body.source === "string" ? body.source : null;
  const sites = [
    { slug: "wine-now", gsc: cfg.GSC_SITE_URL, ga4: cfg.GA4_PROPERTY_ID },
    { slug: "liq9", gsc: cfg.GSC_SITE_URL_LIQ9, ga4: cfg.GA4_PROPERTY_ID_LIQ9 },
  ];
  const summary: Record<string, unknown> = { startDate, endDate, sites: {} };
  let gscTotal = 0, ga4Total = 0; const errors: string[] = [];
  for (const s of sites) {
    const siteResult: Record<string, unknown> = {};
    if (s.gsc && only !== "ga4") {
      try { const n = await syncGSC(token, s.slug, s.gsc, startDate, endDate); gscTotal += n; siteResult.gsc = n; }
      catch (e) { errors.push(`GSC ${s.slug}: ${String(e)}`); siteResult.gsc_error = String(e); }
    }
    if (s.ga4 && only !== "gsc") {
      try { const n = await syncGA4(token, s.slug, s.ga4, startDate, endDate); ga4Total += n; siteResult.ga4 = n; }
      catch (e) { errors.push(`GA4 ${s.slug}: ${String(e)}`); siteResult.ga4_error = String(e); }
    }
    (summary.sites as Record<string, unknown>)[s.slug] = siteResult;
  }
  const status = errors.length === 0 ? "completed" : (gscTotal + ga4Total > 0 ? "partial" : "failed");
  await logSync("gsc", gscTotal, status, errors.length ? errors.join(" | ") : undefined, JSON.stringify(summary));
  await logSync("ga4", ga4Total, status, errors.length ? errors.join(" | ") : undefined);
  return { status, gsc_rows: gscTotal, ga4_rows: ga4Total, errors, summary };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  try {
    const result = await main(body);
    return new Response(JSON.stringify(result), { status: result.status === "failed" ? 500 : 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    await logSync("sync", 0, "failed", String(error));
    return new Response(JSON.stringify({ status: "failed", error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
