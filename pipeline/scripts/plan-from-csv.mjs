#!/usr/bin/env node
// WNLQ9 — content planning from GA4 + GSC CSV exports (no API, no creds).
// Mirrors the dashboard's CSV-ingest model (dashboard/lib/csv.ts): you export
// GA4 + GSC CSVs from your own GA/GSC, drop them in, and this joins them onto
// the content index and scores each article + surfaces keyword opportunities.
//
// Usage:
//   node pipeline/scripts/plan-from-csv.mjs [--ga4 path] [--gsc path]
// Defaults: pipeline/data/ga4.csv + pipeline/data/gsc.csv; if absent, falls
// back to dashboard/data/sample-*.csv (clearly flagged as SAMPLE).
// Writes /tmp/ga-gsc/plan.json and prints a planning summary. Zero deps.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const INDEX = path.resolve(__dirname, "../data/content-index.json");
const OUT_DIR = "/tmp/ga-gsc";

// ---- tiny CSV (quoted-field aware) + header-tolerant pick (à la lib/csv.ts) --
function parseCSV(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((x) => x !== "")) rows.push(row); }
  return rows;
}
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function header(r) { const h = {}; r.forEach((k, i) => (h[norm(k)] = i)); return h; }
function pick(h, ...names) { for (const n of names) { const k = norm(n); if (k in h) return h[k]; } return -1; }
const num = (v) => { if (!v) return 0; const n = parseFloat(String(v).replace(/[%,$\s]/g, "")); return Number.isFinite(n) ? n : 0; };

function parseGA4(text) {
  const rows = parseCSV(text); if (rows.length < 2) return [];
  const h = header(rows[0]);
  const iPath = pick(h, "pagepath", "page path", "path", "url");
  const iTitle = pick(h, "pagetitle", "page title", "title", "page");
  const iViews = pick(h, "views", "pageviews", "screenpageviews", "screen page views");
  const iUsers = pick(h, "users", "totalusers", "activeusers");
  const iEng = pick(h, "avgengagementtime", "averageengagementtime", "engagement", "avgsessionduration");
  return rows.slice(1).map((r) => ({
    pagePath: (iPath >= 0 ? r[iPath] : "") || "",
    pageTitle: (iTitle >= 0 ? r[iTitle] : "") || "",
    views: num(r[iViews]), users: num(r[iUsers]), eng: num(r[iEng]),
  }));
}
function parseGSC(text) {
  const rows = parseCSV(text); if (rows.length < 2) return [];
  const h = header(rows[0]);
  const iQ = pick(h, "query", "top queries", "keyword", "queries");
  const iBrand = pick(h, "brand");
  const iPage = pick(h, "page", "landing page", "url");
  const iClicks = pick(h, "clicks"), iImpr = pick(h, "impressions");
  const iCtr = pick(h, "ctr", "click through rate"), iPos = pick(h, "position", "avg position", "average position");
  return rows.slice(1).map((r) => ({
    query: (iQ >= 0 ? r[iQ] : "") || "", brand: (iBrand >= 0 ? r[iBrand] : "") || "",
    page: (iPage >= 0 ? r[iPage] : "") || "",
    clicks: num(r[iClicks]), impressions: num(r[iImpr]), ctr: num(r[iCtr]), position: num(r[iPos]),
  }));
}

// ---- inputs --------------------------------------------------------------
const args = process.argv.slice(2);
const argv = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
function resolveInput(flag, defName, sampleName) {
  const explicit = argv(flag, null);
  if (explicit) return { path: explicit, sample: false };
  const def = path.resolve(__dirname, "../data", defName);
  if (fs.existsSync(def)) return { path: def, sample: false };
  return { path: path.resolve(ROOT, "dashboard/data", sampleName), sample: true };
}
const ga4In = resolveInput("--ga4", "ga4.csv", "sample-ga4-data.csv");
const gscIn = resolveInput("--gsc", "gsc.csv", "sample-gsc-data.csv");

if (!fs.existsSync(INDEX)) { console.error(`missing ${INDEX} — run build-articles-manifest.mjs first`); process.exit(1); }
const index = JSON.parse(fs.readFileSync(INDEX, "utf8")).articles;
const byKey = Object.fromEntries(index.map((a) => [a.urlKey, a]));

const pathKey = (p) => (p.split("?")[0].replace(/\/+$/, "").split("/").pop() || "").replace(/\.html$/, "");
const ga4 = parseGA4(fs.readFileSync(ga4In.path, "utf8"));
const gsc = parseGSC(fs.readFileSync(gscIn.path, "utf8"));

// ---- join GA4 → articles + score ----------------------------------------
const perf = index.map((a) => ({ ...a, views: 0, users: 0, eng: 0, ga4Matched: false }));
const perfByKey = Object.fromEntries(perf.map((p) => [p.urlKey, p]));
for (const g of ga4) {
  const k = pathKey(g.pagePath);
  if (perfByKey[k]) { const p = perfByKey[k]; p.views += g.views; p.users += g.users; p.eng = Math.max(p.eng, g.eng); p.ga4Matched = true; }
}
const viewsArr = perf.filter((p) => p.ga4Matched).map((p) => p.views).sort((a, b) => a - b);
const pct = (arr, q) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(q * arr.length))] : 0);
const P75 = pct(viewsArr, 0.75), P25 = pct(viewsArr, 0.25);
for (const p of perf) {
  if (!p.ga4Matched) p.bucket = "no-traffic-data";
  else if (p.views >= P75) p.bucket = "win/scale";
  else if (p.views <= P25) p.bucket = "thin";
  else p.bucket = "mid";
  p.orphan = p.inboundLinks === 0;
  p.priorityLink = p.orphan && p.views > 0; // orphan capturing real traffic = fix links first
}

// ---- GSC opportunities ---------------------------------------------------
const imprArr = gsc.map((r) => r.impressions).sort((a, b) => a - b);
const imprMed = pct(imprArr, 0.5);
// Striking-distance / low-CTR gate on solid volume (median) — those are queries
// you already rank for. New-topic DISCOVERY wants breadth, so use a lower floor
// (P25, min 50) or real emerging topics hide behind the median.
const newTopicFloor = Math.max(pct(imprArr, 0.25), 50);
const strikingDistance = gsc.filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= imprMed)
  .sort((a, b) => b.impressions - a.impressions);
const lowCtr = gsc.filter((r) => r.impressions >= imprMed && r.ctr < 2 && r.position <= 10)
  .sort((a, b) => b.impressions - a.impressions);
// new-topic candidates: query tokens not covered by any article title (loose)
const titleBlob = index.map((a) => a.title.toLowerCase()).join("  ");
const newTopics = gsc.filter((r) => {
  const toks = r.query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const covered = toks.filter((t) => titleBlob.includes(t)).length;
  return r.impressions >= newTopicFloor && covered / Math.max(1, toks.length) < 0.34;
}).sort((a, b) => b.impressions - a.impressions);

// ---- output --------------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });
const plan = {
  generatedAt: new Date().toISOString().slice(0, 10),
  inputs: { ga4: ga4In.path, gsc: gscIn.path, sampleData: ga4In.sample || gscIn.sample },
  performance: perf.map(({ fileSlug, urlKey, site, title, views, users, eng, ga4Matched, bucket, inboundLinks, orphan, priorityLink }) =>
    ({ fileSlug, urlKey, site, title, views, users, eng, ga4Matched, bucket, inboundLinks, orphan, priorityLink })),
  opportunities: { strikingDistance: strikingDistance.slice(0, 25), lowCtr: lowCtr.slice(0, 25), newTopics: newTopics.slice(0, 25) },
};
fs.writeFileSync(`${OUT_DIR}/plan.json`, JSON.stringify(plan, null, 2));

// ---- console summary -----------------------------------------------------
const c = (n) => perf.filter((p) => p.bucket === n).length;
if (ga4In.sample || gscIn.sample) console.log("⚠️  using SAMPLE CSVs (drop real exports at pipeline/data/ga4.csv + gsc.csv)\n");
console.log(`GA4 rows: ${ga4.length} | GSC rows: ${gsc.length} | articles indexed: ${index.length}`);
console.log(`buckets: win/scale=${c("win/scale")} mid=${c("mid")} thin=${c("thin")} no-traffic-data=${c("no-traffic-data")}`);
const prio = perf.filter((p) => p.priorityLink).sort((a, b) => b.views - a.views);
console.log(`\n# ORPHANS capturing real traffic (fix internal links FIRST) — ${prio.length}`);
prio.slice(0, 12).forEach((p) => console.log(`  ${String(p.views).padStart(6)} views  ${p.site.padEnd(8)} ${p.fileSlug}`));
console.log(`\n# STRIKING DISTANCE keywords (pos 4-20, decent impressions) — top 10`);
strikingDistance.slice(0, 10).forEach((r) => console.log(`  pos ${String(r.position).padStart(4)}  impr ${String(r.impressions).padStart(6)}  [${r.brand || "?"}]  ${r.query}`));
console.log(`\n# NEW-TOPIC candidates (impressions, no covering article) — top 10`);
newTopics.slice(0, 10).forEach((r) => console.log(`  impr ${String(r.impressions).padStart(6)}  [${r.brand || "?"}]  ${r.query}`));
console.log(`\nwrote ${OUT_DIR}/plan.json`);
