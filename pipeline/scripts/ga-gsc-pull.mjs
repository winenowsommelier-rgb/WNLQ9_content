#!/usr/bin/env node
// WNLQ9 — direct GA4 + GSC pull (free Google APIs) → writes the two CSVs that
// plan-from-csv.mjs scores. This is the automated path; dropping CSVs by hand is
// the zero-creds fallback. Either way the downstream scorer is identical.
//
// Auth: service account (stable for unattended automation — no token expiry /
// no interactive consent). Zero npm deps: JWT signed with Node crypto, REST via
// global fetch (Node >=18). Read-only scopes: analytics.readonly + webmasters.readonly.
//
// USAGE
//   node pipeline/scripts/ga-gsc-pull.mjs --check          # validate config/creds, NO network
//   node pipeline/scripts/ga-gsc-pull.mjs [--days 28]      # pull → pipeline/data/{ga4,gsc}.csv
//   node pipeline/scripts/ga-gsc-pull.mjs --since 2026-05-01 --until 2026-05-31
//   node pipeline/scripts/ga-gsc-pull.mjs --plan           # pull, then run plan-from-csv.mjs
//
// REQUIRED ENV (see pipeline/.env.example) — needed in the environment that RUNS
// this (your server/Vercel, or the Claude Code env once its secrets are set):
//   GA_GSC_SERVICE_ACCOUNT_JSON   (falls back to GOOGLE_SERVICE_ACCOUNT_JSON)
//   GA4_PROPERTY_WN / GA4_PROPERTY_LIQ9     numeric GA4 property IDs
//   GSC_SITE_WN     / GSC_SITE_LIQ9         e.g. "sc-domain:wine-now.com" or "https://th.wine-now.com/"
// Grant the service-account client_email: GA4 property = Viewer, GSC property = user.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const SCOPES =
  "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const dNdaysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const days = Number(val("--days", "28"));
const since = val("--since", dNdaysAgo(days));
const until = val("--until", dNdaysAgo(1)); // GA/GSC lag ~1-2 days

const BRANDS = [
  { key: "wine-now", site: "Wine-Now", ga4: "GA4_PROPERTY_WN", gsc: "GSC_SITE_WN" },
  { key: "liq9", site: "LIQ9", ga4: "GA4_PROPERTY_LIQ9", gsc: "GSC_SITE_LIQ9" },
];

// ---- service account + JWT auth -----------------------------------------
function loadSA() {
  const raw = process.env.GA_GSC_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
  if (!raw) throw new Error("missing GA_GSC_SERVICE_ACCOUNT_JSON (or GOOGLE_SERVICE_ACCOUNT_JSON)");
  if (/^\$\{.*\}$/.test(raw.trim())) throw new Error("service-account env is an unsubstituted ${PLACEHOLDER} — the real secret isn't injected in this environment");
  let sa;
  try { sa = JSON.parse(raw); } catch { throw new Error("service-account JSON is not valid JSON"); }
  if (!sa.client_email || !sa.private_key) throw new Error("service-account JSON missing client_email/private_key");
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return sa;
}
const b64url = (b) => Buffer.from(b).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now }))}`;
  const signer = crypto.createSign("RSA-SHA256"); signer.update(unsigned);
  const assertion = `${unsigned}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

// ---- API calls -----------------------------------------------------------
async function ga4(propertyId, token) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      dateRanges: [{ startDate: since, endDate: until }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }, { name: "averageSessionDuration" }],
      orderBys: [{ desc: true, metric: { metricName: "screenPageViews" } }], limit: "10000",
    }),
  });
  if (!res.ok) throw new Error(`GA4 ${propertyId} ${res.status}: ${await res.text()}`);
  return ((await res.json()).rows || []).map((r) => ({
    page_path: r.dimensionValues[0].value, page_title: r.dimensionValues[1].value,
    views: Number(r.metricValues[0].value), users: Number(r.metricValues[1].value),
    avg_engagement_time: Math.round(Number(r.metricValues[2].value)),
  }));
}
async function gsc(siteUrl, token) {
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ startDate: since, endDate: until, dimensions: ["query"], rowLimit: 5000 }),
  });
  if (!res.ok) throw new Error(`GSC ${siteUrl} ${res.status}: ${await res.text()}`);
  return ((await res.json()).rows || []).map((r) => ({
    keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions,
    ctr: +(r.ctr * 100).toFixed(2), position: +r.position.toFixed(1),
  }));
}

// ---- CSV helpers ---------------------------------------------------------
const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCSV = (cols, rows) => [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";

// ---- main ----------------------------------------------------------------
async function main() {
  const problems = [];
  let sa = null;
  try { sa = loadSA(); } catch (e) { problems.push(String(e.message)); }
  for (const b of BRANDS) {
    if (!process.env[b.ga4]) problems.push(`missing ${b.ga4} (GA4 property id for ${b.site})`);
    if (!process.env[b.gsc]) problems.push(`missing ${b.gsc} (GSC site for ${b.site})`);
  }

  if (has("--check")) {
    console.log("=== ga-gsc-pull --check ===");
    console.log(`window: ${since} → ${until}`);
    console.log(`service account: ${sa ? sa.client_email : "(not loaded)"}`);
    for (const b of BRANDS) console.log(`  ${b.site}: GA4=${process.env[b.ga4] || "—"}  GSC=${process.env[b.gsc] || "—"}`);
    if (problems.length) { console.log("\nNOT READY:"); problems.forEach((p) => console.log(`  ✗ ${p}`)); process.exit(1); }
    console.log("\n✓ config + creds OK. Run without --check to pull.");
    return;
  }
  if (problems.length) { console.error("Cannot pull — missing config:\n  " + problems.join("\n  ") + "\n\n(set these in the RUN environment, or drop CSVs manually — see docs/GA_GSC_PLANNING.md)"); process.exit(1); }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const token = await getAccessToken(sa);
  const ga4Rows = [], gscRows = [];
  for (const b of BRANDS) {
    for (const r of await ga4(process.env[b.ga4], token)) ga4Rows.push(r);
    for (const r of await gsc(process.env[b.gsc], token)) gscRows.push({ keyword: r.keyword, brand: b.key, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
  }
  fs.writeFileSync(path.join(DATA_DIR, "ga4.csv"), toCSV(["page_path", "page_title", "views", "users", "avg_engagement_time"], ga4Rows));
  fs.writeFileSync(path.join(DATA_DIR, "gsc.csv"), toCSV(["keyword", "brand", "clicks", "impressions", "ctr", "position"], gscRows));
  console.log(`wrote pipeline/data/ga4.csv (${ga4Rows.length} rows) + gsc.csv (${gscRows.length} rows) for ${since}→${until}`);

  if (has("--plan")) {
    console.log("\n--- running plan-from-csv.mjs ---");
    console.log(execFileSync("node", [path.join(__dirname, "plan-from-csv.mjs")], { encoding: "utf8" }));
  } else {
    console.log("next: node pipeline/scripts/plan-from-csv.mjs");
  }
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
