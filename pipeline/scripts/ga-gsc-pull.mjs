#!/usr/bin/env node
// WNLQ9 — pull real GA4 + Google Search Console data for content planning.
//
// DIRECT Google APIs (no Supermetrics). Zero npm deps: signs a service-account
// JWT with Node's built-in crypto and calls the REST endpoints with global fetch
// (Node >=18). Output is normalized per article *slug* so it joins straight onto
// the Notion board (see docs/GA_GSC_PLANNING.md for the join + workflow).
//
// USAGE
//   node pipeline/scripts/ga-gsc-pull.mjs --check        # validate env+creds, NO network
//   node pipeline/scripts/ga-gsc-pull.mjs --index        # build slug→{title,site} from HTML, NO network
//   node pipeline/scripts/ga-gsc-pull.mjs [--days 28]    # pull GA4+GSC, write /tmp/ga-gsc/*.json
//   node pipeline/scripts/ga-gsc-pull.mjs --since 2026-05-01 --until 2026-05-31
//
// REQUIRED ENV (see pipeline/.env.example)
//   GA_GSC_SERVICE_ACCOUNT_JSON   service-account JSON (falls back to GOOGLE_SERVICE_ACCOUNT_JSON)
//   GA4_PROPERTY_WN / GA4_PROPERTY_LIQ9     numeric GA4 property IDs (digits only)
//   GSC_SITE_WN     / GSC_SITE_LIQ9         GSC property, e.g. "sc-domain:wine-now.com" or "https://th.wine-now.com/"
// The service account's client_email must be granted: GA4 property = Viewer,
// GSC property = Restricted/Full user. Scopes used (read-only):
//   analytics.readonly + webmasters.readonly

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "../public/content");
const OUT_DIR = "/tmp/ga-gsc";

const SCOPES =
  "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly";

// ---- args ----------------------------------------------------------------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

function dateNDaysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}
const days = Number(val("--days", "28"));
const since = val("--since", dateNDaysAgo(days));
const until = val("--until", dateNDaysAgo(1)); // GA/GSC data lags ~1-2 days

const BRANDS = [
  { key: "wn", site: "Wine-Now", host: "th.wine-now.com", ga4: "GA4_PROPERTY_WN", gsc: "GSC_SITE_WN" },
  { key: "liq9", site: "LIQ9", host: "th.liq9.com", ga4: "GA4_PROPERTY_LIQ9", gsc: "GSC_SITE_LIQ9" },
];

// ---- slug index (no network) --------------------------------------------
// Keyed by the LIVE-URL basename (canonical), because GA4 pagePath and GSC page
// report the published URL — NOT the repo filename. Legacy files carry a
// "dayN-" filename prefix that is stripped in the canonical/live URL, so
// file `day1-most-expensive-wines-2026.html` joins on key `most-expensive-wines-2026`.
const slugFromPath = (p) => (p.split("?")[0].split("/").pop() || "").replace(/\.html$/, "");

function buildIndex() {
  const idx = {};
  for (const f of fs.readdirSync(CONTENT_DIR)) {
    if (!f.endsWith(".html") || f === "index.html" || f === "process.html") continue;
    const html = fs.readFileSync(path.join(CONTENT_DIR, f), "utf8");
    const fileSlug = f.replace(/\.html$/, "");
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, "").trim() || "";
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || "";
    const urlKey = canonical ? slugFromPath(canonical) : fileSlug; // <- join key (live URL)
    const site = /th\.liq9\.com/.test(html) ? "LIQ9" : "Wine-Now";
    idx[urlKey] = { urlKey, fileSlug, title: h1, site, canonical, file: f };
  }
  return idx;
}

// ---- service account + auth ---------------------------------------------
function loadSA() {
  const raw = process.env.GA_GSC_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
  if (!raw) throw new Error("missing GA_GSC_SERVICE_ACCOUNT_JSON (or GOOGLE_SERVICE_ACCOUNT_JSON)");
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error("service-account JSON is not valid JSON");
  }
  if (!sa.client_email || !sa.private_key) throw new Error("service-account JSON missing client_email/private_key");
  // tolerate single-line keys with escaped newlines
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return sa;
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = { iss: sa.client_email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

// ---- API calls -----------------------------------------------------------
async function ga4(propertyId, token) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      dateRanges: [{ startDate: since, endDate: until }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "engagedSessions" },
        { name: "averageSessionDuration" },
        { name: "conversions" },
      ],
      orderBys: [{ desc: true, metric: { metricName: "screenPageViews" } }],
      limit: "10000",
    }),
  });
  if (!res.ok) throw new Error(`GA4 ${propertyId} ${res.status}: ${await res.text()}`);
  const j = await res.json();
  const out = {};
  for (const row of j.rows || []) {
    const slug = slugFromPath(row.dimensionValues[0].value);
    if (!slug) continue;
    const m = row.metricValues.map((x) => Number(x.value));
    out[slug] = { views: m[0], sessions: m[1], engagedSessions: m[2], avgSessionSec: Math.round(m[3]), conversions: m[4] };
  }
  return out;
}

async function gsc(siteUrl, token) {
  const enc = encodeURIComponent(siteUrl);
  const call = (body) =>
    fetch(`https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`GSC ${siteUrl} ${r.status}: ${await r.text()}`);
      return r.json();
    });
  // per-page totals
  const pageRes = await call({ startDate: since, endDate: until, dimensions: ["page"], rowLimit: 5000 });
  // top queries per page (for keyword opportunities)
  const qRes = await call({ startDate: since, endDate: until, dimensions: ["page", "query"], rowLimit: 25000 });
  const byPage = {};
  for (const row of pageRes.rows || []) {
    const slug = slugFromPath(row.keys[0]);
    if (!slug) continue;
    byPage[slug] = { clicks: row.clicks, impressions: row.impressions, ctr: +(row.ctr * 100).toFixed(2), position: +row.position.toFixed(1), topQueries: [] };
  }
  for (const row of qRes.rows || []) {
    const slug = slugFromPath(row.keys[0]);
    if (!byPage[slug]) continue;
    if (byPage[slug].topQueries.length < 10)
      byPage[slug].topQueries.push({ q: row.keys[1], clicks: row.clicks, impressions: row.impressions, position: +row.position.toFixed(1) });
  }
  return byPage;
}

// ---- modes ---------------------------------------------------------------
async function main() {
  if (has("--index")) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const idx = buildIndex();
    fs.writeFileSync(`${OUT_DIR}/slug-index.json`, JSON.stringify(idx, null, 2));
    console.log(`slug index: ${Object.keys(idx).length} articles -> ${OUT_DIR}/slug-index.json`);
    return;
  }

  // config presence check (used by --check and the real run)
  const problems = [];
  let sa = null;
  try {
    sa = loadSA();
  } catch (e) {
    problems.push(String(e.message));
  }
  for (const b of BRANDS) {
    if (!process.env[b.ga4]) problems.push(`missing ${b.ga4} (GA4 property id for ${b.site})`);
    if (!process.env[b.gsc]) problems.push(`missing ${b.gsc} (GSC site for ${b.site})`);
  }

  if (has("--check")) {
    console.log("=== ga-gsc-pull --check ===");
    console.log(`date window: ${since} → ${until}`);
    console.log(`service account: ${sa ? sa.client_email : "(NOT LOADED)"}`);
    for (const b of BRANDS)
      console.log(`  ${b.site}: GA4=${process.env[b.ga4] || "—"}  GSC=${process.env[b.gsc] || "—"}`);
    console.log(`content dir: ${fs.existsSync(CONTENT_DIR) ? Object.keys(buildIndex()).length + " articles" : "MISSING"}`);
    if (problems.length) {
      console.log("\nNOT READY — set these before the real run:");
      for (const p of problems) console.log(`  ✗ ${p}`);
      process.exit(1);
    }
    console.log("\n✓ config + creds parse OK. Ready to pull (re-run without --check).");
    return;
  }

  if (problems.length) {
    console.error("Cannot pull — missing config:\n  " + problems.join("\n  "));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const idx = buildIndex();
  const token = await getAccessToken(sa);
  const merged = {};
  for (const b of BRANDS) {
    const ga = await ga4(process.env[b.ga4], token);
    const gs = await gsc(process.env[b.gsc], token);
    fs.writeFileSync(`${OUT_DIR}/ga4-${b.key}.json`, JSON.stringify(ga, null, 2));
    fs.writeFileSync(`${OUT_DIR}/gsc-${b.key}.json`, JSON.stringify(gs, null, 2));
    const slugs = new Set([...Object.keys(ga), ...Object.keys(gs)]);
    for (const slug of slugs) {
      merged[slug] = {
        slug,
        site: idx[slug]?.site || b.site,
        title: idx[slug]?.title || "",
        onSite: Boolean(idx[slug]),
        ga4: ga[slug] || null,
        gsc: gs[slug] || null,
      };
    }
  }
  fs.writeFileSync(`${OUT_DIR}/merged.json`, JSON.stringify(Object.values(merged), null, 2));
  console.log(
    `wrote ${OUT_DIR}/ga4-*.json, gsc-*.json, merged.json (${Object.keys(merged).length} slugs, ${since}→${until})`
  );
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
