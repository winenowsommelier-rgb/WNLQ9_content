#!/usr/bin/env node
// ============================================================
// ga-gsc-from-supabase.mjs — credential-free GA4/GSC data for the planner
// ------------------------------------------------------------
// Pulls the real Google Search Console + Analytics 4 metrics that the
// `sync-gsc-ga4` Supabase pipeline already lands daily (project
// "WNLQ9 SEO Automation"), pre-aggregated per brand by the
// dashboard_gsc_keywords / dashboard_ga4_pages materialized views, and writes
// them to the CSV contract the planner consumes:
//
//   pipeline/data/gsc.csv  ->  keyword,brand,impressions,clicks,ctr,position,search_intent
//   pipeline/data/ga4.csv  ->  page_path,page_title,views,users,bounce_rate,device_category,traffic_source
//
// This replaces the direct Google-API pull (ga-gsc-pull.mjs): no service
// account, no GA4_PROPERTY_IDS / GSC_SITES env, no GOOGLE_SERVICE_ACCOUNT_JSON.
// The Supabase anon key is RLS-safe (the views expose only aggregated metrics),
// so this runs anywhere with zero secrets.
//
// Usage:
//   node pipeline/scripts/ga-gsc-from-supabase.mjs --check     # health + counts, exit 0/1
//   node pipeline/scripts/ga-gsc-from-supabase.mjs --write     # write the two CSVs (default)
//   node pipeline/scripts/ga-gsc-from-supabase.mjs --print     # print a summary, write nothing
//   flags: --limit=N (rows per brand, default 5000)
//
// Env overrides (optional): SUPABASE_URL, SUPABASE_ANON_KEY
// ============================================================

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://asnarjokyedupsjipzkl.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbmFyam9reWVkdXBzamlwemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTgzNjMsImV4cCI6MjA5NTc5NDM2M30.sST_AGx6Vax-zEdTm_igXqcrrv_gm4ZMsxUHOi1tx1I";

const BRANDS = ["wine-now", "liq9"];

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "data");

function parseArgs(argv) {
  const args = { mode: "write", limit: 5000 };
  for (const a of argv) {
    if (a === "--check") args.mode = "check";
    else if (a === "--write") args.mode = "write";
    else if (a === "--print") args.mode = "print";
    else if (a.startsWith("--limit=")) args.limit = Number(a.slice(8)) || args.limit;
  }
  return args;
}

function restUrl(view, params) {
  const base = SUPABASE_URL.replace(/\/$/, "");
  const qs = new URLSearchParams(params).toString();
  return `${base}/rest/v1/${view}?${qs}`;
}

async function fetchView(view, params, { head = false } = {}) {
  const res = await fetch(restUrl(view, params), {
    method: head ? "HEAD" : "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(head ? { Prefer: "count=exact" } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${view} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  if (head) {
    // content-range looks like "*/55710"
    const cr = res.headers.get("content-range") || "";
    return Number(cr.split("/")[1] || 0);
  }
  return res.json();
}

async function countRows(view, brand) {
  return fetchView(view, { site: `eq.${brand}`, select: "site", limit: "1" }, { head: true });
}

async function fetchGsc(brand, limit) {
  const rows = await fetchView("dashboard_gsc_keywords", {
    site: `eq.${brand}`,
    select: "keyword,impressions,clicks,ctr,position",
    order: "impressions.desc",
    limit: String(limit),
  });
  return rows.map((r) => ({
    keyword: r.keyword,
    brand,
    impressions: r.impressions ?? 0,
    clicks: r.clicks ?? 0,
    ctr: r.ctr ?? 0, // already a percentage
    position: r.position ?? 0,
    search_intent: "",
  }));
}

async function fetchGa4(brand, limit) {
  const rows = await fetchView("dashboard_ga4_pages", {
    site: `eq.${brand}`,
    select: "page_path,users,pageviews,bounce_rate",
    order: "pageviews.desc",
    limit: String(limit),
  });
  return rows.map((r) => ({
    page_path: r.page_path,
    page_title: pathToTitle(r.page_path),
    views: r.pageviews ?? 0,
    users: r.users ?? 0,
    bounce_rate: round1((r.bounce_rate ?? 0) * 100), // fraction -> percentage
    device_category: "",
    traffic_source: "",
  }));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function pathToTitle(path) {
  if (!path || path === "/") return "Home";
  const last = path.replace(/\/+$/, "").split("/").filter(Boolean).pop() ?? path;
  return last.replace(/\.html?$/i, "").replace(/[-_]+/g, " ").trim() || path;
}

function toCsv(headers, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => esc(row[h])).join(","));
  return lines.join("\n") + "\n";
}

const GSC_HEADERS = ["keyword", "brand", "impressions", "clicks", "ctr", "position", "search_intent"];
const GA4_HEADERS = ["page_path", "page_title", "views", "users", "bounce_rate", "device_category", "traffic_source"];

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.mode === "check") {
    try {
      const counts = {};
      for (const brand of BRANDS) {
        counts[brand] = {
          gsc: await countRows("dashboard_gsc_keywords", brand),
          ga4: await countRows("dashboard_ga4_pages", brand),
        };
      }
      console.log("✅ Supabase GA4/GSC source reachable (no credentials needed).");
      for (const brand of BRANDS) {
        console.log(`   ${brand}: ${counts[brand].gsc} keywords (GSC), ${counts[brand].ga4} pages (GA4)`);
      }
      const total = BRANDS.reduce((a, b) => a + counts[b].gsc + counts[b].ga4, 0);
      if (total === 0) {
        console.error("⚠️  Reachable but zero rows — check the sync.");
        process.exit(1);
      }
      process.exit(0);
    } catch (err) {
      console.error("❌ Supabase GA4/GSC source check failed:", err.message);
      process.exit(1);
    }
  }

  // write / print
  const gsc = (await Promise.all(BRANDS.map((b) => fetchGsc(b, args.limit)))).flat();
  const ga4 = (await Promise.all(BRANDS.map((b) => fetchGa4(b, args.limit)))).flat();

  if (args.mode === "print") {
    console.log(`GSC: ${gsc.length} rows | GA4: ${ga4.length} rows`);
    console.log("GSC sample:", gsc[0]);
    console.log("GA4 sample:", ga4[0]);
    return;
  }

  await mkdir(DATA_DIR, { recursive: true });
  const gscPath = resolve(DATA_DIR, "gsc.csv");
  const ga4Path = resolve(DATA_DIR, "ga4.csv");
  await writeFile(gscPath, toCsv(GSC_HEADERS, gsc));
  await writeFile(ga4Path, toCsv(GA4_HEADERS, ga4));
  console.log(`Wrote ${gsc.length} GSC rows -> ${gscPath}`);
  console.log(`Wrote ${ga4.length} GA4 rows -> ${ga4Path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
