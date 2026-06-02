#!/usr/bin/env node
/**
 * BI snapshot bridge for the WNLQ9 content operation.
 *
 * Why this exists: the Claude Code web environment's sandbox has no outbound
 * internet, so content sessions cannot call the BI API directly. GitHub Actions
 * runners DO have egress, so this script (run in CI, or locally) pulls the BI
 * marts and writes JSON + a human/agent-readable summary into
 * docs/wnlq9/bi-snapshot/ . Content sessions then read those committed files for
 * real numbers without needing network access.
 *
 * Usage:  WNLQ9_API_KEY=... node scripts/bi-snapshot.mjs
 * Requires Node 18+ (global fetch). Zero dependencies.
 *
 * Rules honored: values are THB; never publish on-page price (BI price is for
 * internal planning / LINE replies only). Cite the endpoint when using numbers.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://wnlq9-bi-api.vercel.app";
const KEY = process.env.WNLQ9_API_KEY;
const OUT = fileURLToPath(new URL("../docs/wnlq9/bi-snapshot/", import.meta.url));

// Endpoints to capture. Documented marketing endpoints + a few core marts.
// Each is independent: one failure won't abort the rest.
const TARGETS = [
  { name: "marts", path: "/marts" },
  { name: "bestsellers_90d", path: "/marketing/bestsellers?days=90&limit=25" },
  { name: "bestsellers_30d", path: "/marketing/bestsellers?days=30&limit=25" },
  { name: "must_move", path: "/marketing/must-move?limit=50" },
  { name: "winback_at_risk", path: "/marketing/winback?segment=At+Risk" },
  { name: "forecast_vs_actual", path: "/marketing/forecast-vs-actual?months_back=6" },
  { name: "sales_monthly", path: "/marts/sales_monthly?limit=5000" },
  { name: "inventory_status", path: "/marts/inventory_status?limit=5000" },
  { name: "rfm_snapshot", path: "/marts/rfm_snapshot?limit=5000" },
];

if (!KEY) {
  console.error(
    "ERROR: WNLQ9_API_KEY is not set.\n" +
      "Set it as an env var (local) or GitHub Actions secret. See docs/wnlq9/08-SECRETS-AND-ACCESS.md."
  );
  process.exit(1);
}

async function get(path) {
  const res = await fetch(BASE + path, {
    headers: { "X-API-Key": KEY, Accept: "application/json" },
  });
  const body = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 401
        ? " (401: key rotated/invalid)"
        : res.status === 403
        ? " (403: host not allowlisted / egress blocked)"
        : "";
    throw new Error(`HTTP ${res.status}${hint}: ${path} :: ${body.slice(0, 200)}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    return body; // non-JSON; store raw
  }
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.results)) return data.results;
  return null;
}

const run = async () => {
  await mkdir(OUT, { recursive: true });
  const stamp = new Date().toISOString();
  const manifest = { generated_at: stamp, base: BASE, results: {} };
  const summaryLines = [
    "# BI snapshot (auto-generated)",
    "",
    `- Generated: ${stamp}`,
    `- Source: ${BASE} (values in THB; data refreshes daily)`,
    "- Do NOT publish on-page price; BI price is internal planning only.",
    "- Cite the endpoint when using a number.",
    "",
  ];

  for (const t of TARGETS) {
    try {
      const data = await get(t.path);
      await writeFile(OUT + t.name + ".json", JSON.stringify(data, null, 2));
      const arr = asArray(data);
      manifest.results[t.name] = { path: t.path, ok: true, rows: arr ? arr.length : null };
      summaryLines.push(`- OK  ${t.name}  (${t.path})  rows=${arr ? arr.length : "n/a"}`);
      console.log(`OK  ${t.name}  rows=${arr ? arr.length : "n/a"}`);
    } catch (e) {
      manifest.results[t.name] = { path: t.path, ok: false, error: String(e.message || e) };
      summaryLines.push(`- ERR ${t.name}  (${t.path})  ${String(e.message || e)}`);
      console.error(`ERR ${t.name}: ${e.message || e}`);
    }
  }

  // Quick bestsellers table for fast human/agent reading.
  const best = asArray(
    JSON.parse(await readSafe(OUT + "bestsellers_90d.json"))
  );
  if (best && best.length) {
    summaryLines.push("", "## Top sellers (90d) — quick view", "");
    summaryLines.push("| # | SKU / name | revenue (THB) |", "|---|---|---|");
    best.slice(0, 10).forEach((r, i) => {
      const name = r.name || r.sku || r.product || r.title || JSON.stringify(r).slice(0, 40);
      const rev = r.revenue ?? r.revenue_thb ?? r.total_revenue ?? r.sales ?? "";
      summaryLines.push(`| ${i + 1} | ${name} | ${rev} |`);
    });
  }

  await writeFile(OUT + "_manifest.json", JSON.stringify(manifest, null, 2));
  await writeFile(OUT + "SUMMARY.md", summaryLines.join("\n") + "\n");

  const okCount = Object.values(manifest.results).filter((r) => r.ok).length;
  console.log(`\nWrote ${okCount}/${TARGETS.length} datasets to docs/wnlq9/bi-snapshot/`);
  // Don't fail the whole job if some optional marts 404; only fail if everything failed.
  if (okCount === 0) process.exit(2);
};

async function readSafe(p) {
  try {
    const { readFile } = await import("node:fs/promises");
    return await readFile(p, "utf8");
  } catch {
    return "null";
  }
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
