#!/usr/bin/env node
// GA4 + Search Console pull / merge / score for the WNLQ9 content board.
//
// Usage:
//   node pipeline/scripts/ga-gsc-pull.mjs --check     reachability probe (no data pulled)
//   node pipeline/scripts/ga-gsc-pull.mjs --pull      pull GA4+GSC -> data/ga-gsc/*.json
//   node pipeline/scripts/ga-gsc-pull.mjs --score     join merged.json to board -> scored.json
//   node pipeline/scripts/ga-gsc-pull.mjs             (no flag) = --pull then --score
//   flags: --days N (lookback, default GA_GSC_LOOKBACK_DAYS or 28)
//
// Env (see pipeline/.env.example): GOOGLE_SERVICE_ACCOUNT_JSON, GA4_PROPERTY_IDS,
// GSC_SITES. --score also uses NOTION_TOKEN if present (else a local board
// snapshot built from canonical URLs in public/content/*.html).
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getConfig } from "../src/config.mjs";
import { createGaGscClient, mergeGaGsc, mineQueries } from "../src/ga-gsc.mjs";
import { scoreAll } from "../src/scoring.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PIPELINE_DIR = join(__dirname, "..");
const OUT_DIR = join(PIPELINE_DIR, "data", "ga-gsc");
const CONTENT_DIR = join(PIPELINE_DIR, "public", "content");

function parseArgs(argv) {
  const args = { check: false, pull: false, score: false, days: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--check") args.check = true;
    else if (a === "--pull") args.pull = true;
    else if (a === "--score") args.score = true;
    else if (a === "--days") args.days = Number(argv[++i]);
  }
  // Default (no action flag) = full pull + score.
  if (!args.check && !args.pull && !args.score) {
    args.pull = true;
    args.score = true;
  }
  return args;
}

/** YYYY-MM-DD `days` ago / today (UTC). */
function dateRange(days) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end), days };
}

async function writeJson(name, data) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, name);
  await writeFile(path, JSON.stringify(data, null, 2) + "\n");
  return path;
}

// --- --check ---------------------------------------------------------------
async function runCheck(config) {
  requireConfig(config);
  const client = createGaGscClient({ config });
  const result = await client.checkAccess();
  console.log("GA4 properties:");
  for (const g of result.ga4) console.log(`  ${g.ok ? "✅" : "❌"} ${g.property}${g.error ? "  — " + g.error : ""}`);
  console.log("Search Console sites:");
  for (const g of result.gsc) console.log(`  ${g.ok ? "✅" : "❌"} ${g.site}${g.error ? "  — " + g.error : ""}`);
  console.log(result.ok ? "\n🟢 green — ready to pull" : "\n🔴 not ready — fix the ❌ rows above");
  return result.ok;
}

// --- --pull ----------------------------------------------------------------
async function runPull(config, days) {
  requireConfig(config);
  const range = dateRange(days);
  const client = createGaGscClient({ config });

  const ga4 = [];
  for (const property of config.ga4Properties) {
    const rows = await client.pullGa4({ property, ...range });
    console.log(`GA4 ${property}: ${rows.length} pages`);
    ga4.push(...rows);
  }

  const gscPages = [];
  const gscQueries = [];
  for (const site of config.gscSites) {
    const pages = await client.pullGsc({ site, ...range, dimensions: ["page"] });
    const queries = await client.pullGsc({ site, ...range, dimensions: ["page", "query"] });
    console.log(`GSC ${site}: ${pages.length} pages, ${queries.length} page×query rows`);
    gscPages.push(...pages);
    gscQueries.push(...queries);
  }

  const merged = mergeGaGsc({ ga4, gscPages, gscQueries });
  const queries = mineQueries(gscQueries);

  await writeJson("ga4.json", { generatedAt: new Date().toISOString(), range, rows: ga4 });
  await writeJson("gsc-pages.json", { generatedAt: new Date().toISOString(), range, rows: gscPages });
  await writeJson("gsc-queries.json", { generatedAt: new Date().toISOString(), range, rows: gscQueries });
  await writeJson("merged.json", { generatedAt: new Date().toISOString(), range, records: merged });
  await writeJson("queries.json", { generatedAt: new Date().toISOString(), range, queries });

  console.log(`\nWrote ${merged.length} merged URL records + ${queries.length} keyword opportunities to data/ga-gsc/`);
  return { merged, queries };
}

// --- --score ---------------------------------------------------------------
async function loadBoardRows(config) {
  // Prefer the live Notion board; fall back to a local canonical-URL snapshot.
  if (config.token) {
    try {
      const { createClient } = await import("../src/notion.mjs");
      const notion = createClient(config);
      const items = await notion.listItems({ pageSize: 100 });
      console.log(`Board: ${items.length} rows from Notion`);
      return items;
    } catch (e) {
      console.warn(`Notion fetch failed (${e.message}); using local canonical snapshot`);
    }
  }
  return loadLocalBoard();
}

/** Build a minimal board from canonical URLs + <title> in public/content. */
async function loadLocalBoard() {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".html") && f !== "index.html");
  const rows = [];
  for (const f of files) {
    const html = await readFile(join(CONTENT_DIR, f), "utf8");
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
    if (!canonical) continue;
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || f;
    rows.push({ id: f, finalUrl: canonical, title, file: f });
  }
  console.log(`Board: ${rows.length} rows from local canonical snapshot`);
  return rows;
}

async function runScore(config) {
  let merged;
  try {
    merged = JSON.parse(await readFile(join(OUT_DIR, "merged.json"), "utf8")).records;
  } catch {
    console.error("No data/ga-gsc/merged.json — run --pull first.");
    return false;
  }
  const boardRows = await loadBoardRows(config);
  const { scored, unmatchedBoard, buckets } = scoreAll(merged, boardRows);

  await writeJson("scored.json", {
    generatedAt: new Date().toISOString(),
    buckets,
    scored,
    unmatchedBoard: unmatchedBoard.map((r) => ({ id: r.id, title: r.title, finalUrl: r.finalUrl || r.url || null })),
  });

  console.log("\nBuckets:", JSON.stringify(buckets));
  console.log("Top opportunities:");
  for (const s of scored.slice(0, 10)) {
    console.log(`  [${s.bucket.padEnd(17)}] score=${String(s.score).padStart(6)}  ${s.url}`);
  }
  if (unmatchedBoard.length) {
    console.log(`\n${unmatchedBoard.length} board rows have no live data yet (planned / unpublished).`);
  }
  return true;
}

function requireConfig(config) {
  const missing = [];
  if (!config.googleServiceAccount) missing.push("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!config.ga4Properties.length) missing.push("GA4_PROPERTY_IDS");
  if (!config.gscSites.length) missing.push("GSC_SITES");
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")} (see pipeline/.env.example)`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const days = args.days || config.gaGscLookbackDays;

  try {
    if (args.check) {
      const ok = await runCheck(config);
      process.exit(ok ? 0 : 1);
    }
    if (args.pull) await runPull(config, days);
    if (args.score) {
      const ok = await runScore(config);
      process.exit(ok ? 0 : 1);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

main();
