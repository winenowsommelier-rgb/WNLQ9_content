// Supabase Edge Function: Sync Google Search Console + GA4 metrics (Wine-Now + LIQ9).
// Service-account JWT (key from Vault via get_gcp_sa_key) -> GSC Search Analytics + GA4 runReport.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

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

async function syncGSC(token: string, siteUrl: string, site: string) {
  const end = new Date(); end.setDate(end.getDate() - 3);
  const start = new Date(); start.setDate(start.getDate() - 30);
  const endDate = ymd(end);
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ startDate: ymd(start), endDate, dimensions: ["query"], rowLimit: 1000 }) });
  const body = await res.json();
  if (!res.ok) throw new Error(`GSC ${site} ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  const rows = (body.rows || []).map((r: any) => ({ product_id: null, site, keyword: r.keys?.[0] ?? "", impressions: Math.round(r.impressions || 0), clicks: Math.round(r.clicks || 0), ctr: r.ctr || 0, rank_position: r.position || 0, avg_rank_position: r.position || 0, metric_date: endDate, synced_at: new Date().toISOString() })).filter((r: any) => r.keyword);
  // Guard: never delete existing data for a 0-row API response, or an empty run would wipe a good day.
  if (!rows.length) return 0;
  await supabase.from("seo_gsc_daily").delete().eq("metric_date", endDate).eq("site", site);
  const { error } = await supabase.from("seo_gsc_daily").insert(rows); if (error) throw new Error(`GSC insert ${site}: ${error.message}`);
  return rows.length;
}

async function syncGA4(token: string, propertyId: string, site: string) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  const metricDate = ymd(y);
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }], dimensions: [{ name: "pagePath" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" }, { name: "conversions" }], limit: 1000 }) });
  const body = await res.json();
  if (!res.ok) throw new Error(`GA4 ${site} ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  const rows = (body.rows || []).map((r: any) => { const m = r.metricValues || []; const num = (i: number) => Number(m[i]?.value || 0); const sessions = Math.round(num(1)); const conversions = Math.round(num(5)); return { product_id: null, site, page_path: r.dimensionValues?.[0]?.value ?? "", users: Math.round(num(0)), sessions, pageviews: Math.round(num(2)), bounce_rate: num(3), avg_session_duration: num(4), goal_completions: conversions, conversion_rate: sessions > 0 ? conversions / sessions : 0, metric_date: metricDate, synced_at: new Date().toISOString() }; }).filter((r: any) => r.page_path);
  // Guard: never delete existing data for a 0-row API response, or an empty run would wipe a good day.
  if (!rows.length) return 0;
  await supabase.from("seo_ga4_daily").delete().eq("metric_date", metricDate).eq("site", site);
  const { error } = await supabase.from("seo_ga4_daily").insert(rows); if (error) throw new Error(`GA4 insert ${site}: ${error.message}`);
  return rows.length;
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

async function main() {
  const cfg = await getConfig();
  const { data: keyJson, error: keyErr } = await supabase.rpc("get_gcp_sa_key");
  if (keyErr || !keyJson) throw new Error("Cannot read service account key from Vault: " + (keyErr?.message || "empty"));
  const sa = JSON.parse(keyJson as string);
  const token = await getAccessToken(sa, "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly");

  const results: Record<string, unknown> = {};

  const gscSites: [string, string][] = [];
  if (cfg.GSC_SITE_URL) gscSites.push([cfg.GSC_SITE_URL, "wine-now"]);
  if (cfg.GSC_SITE_URL_LIQ9) gscSites.push([cfg.GSC_SITE_URL_LIQ9, "liq9"]);
  let gscTotal = 0;
  for (const [url, site] of gscSites) {
    try { const n = await syncGSC(token, url, site); gscTotal += n; results[`gsc_${site}`] = n; }
    catch (e) { results[`gsc_${site}_error`] = String(e); await logSync(`gsc_${site}`, 0, "failed", String(e)); }
  }
  if (gscTotal > 0) await logSync("gsc", gscTotal, "completed");

  const ga4Props: [string, string][] = [];
  if (cfg.GA4_PROPERTY_ID) ga4Props.push([cfg.GA4_PROPERTY_ID, "wine-now"]);
  if (cfg.GA4_PROPERTY_ID_LIQ9) ga4Props.push([cfg.GA4_PROPERTY_ID_LIQ9, "liq9"]);
  let ga4Total = 0;
  for (const [pid, site] of ga4Props) {
    try { const n = await syncGA4(token, pid, site); ga4Total += n; results[`ga4_${site}`] = n; }
    catch (e) { results[`ga4_${site}_error`] = String(e); await logSync(`ga4_${site}`, 0, "failed", String(e)); }
  }
  if (ga4Total > 0) await logSync("ga4", ga4Total, "completed");

  try { await supabase.rpc("detect_seo_opportunities", { impression_threshold: 500, ctr_threshold: 0.02 }); } catch (_) {}
  try { await supabase.rpc("detect_seo_regressions", { days: 7, position_drop_threshold: 3, ctr_drop_threshold: 0.2 }); } catch (_) {}

  return { status: "success", ...results };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const result = await main();
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    await logSync("sync", 0, "failed", String(error));
    return new Response(JSON.stringify({ error: String(error), status: "failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
