#!/usr/bin/env node
// CLI: ingest content briefs from a JSON file into the Notion content database.
//
// Usage:
//   node src/cli.mjs <briefs.json> [--dry-run] [--skip-existing]
//
//   <briefs.json>     a single brief object OR an array of briefs
//   --dry-run         validate + map and print payloads; never touch Notion
//   --skip-existing   skip briefs whose Brief ID already exists in the database
//
// Env: NOTION_TOKEN (required unless --dry-run), NOTION_DATABASE_ID (optional).

import { readFile } from "node:fs/promises";
import { ingestBriefs } from "./ingest.mjs";

function parseArgs(argv) {
  const args = { file: null, dryRun: false, skipExisting: false };
  for (const a of argv) {
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--skip-existing") args.skipExisting = true;
    else if (!a.startsWith("--")) args.file = a;
  }
  return args;
}

async function main() {
  const { file, dryRun, skipExisting } = parseArgs(process.argv.slice(2));
  if (!file) {
    console.error("Usage: node src/cli.mjs <briefs.json> [--dry-run] [--skip-existing]");
    process.exit(2);
  }

  const briefs = JSON.parse(await readFile(file, "utf8"));
  const { summary, results } = await ingestBriefs(briefs, { dryRun, skipExisting });

  for (const r of results) {
    const tag = r.status.toUpperCase().padEnd(8);
    const id = r.briefId || "";
    const extra = r.url || (r.errors ? r.errors.join("; ") : r.error || "");
    console.log(`[${tag}] ${id}  ${extra}`);
    if (dryRun && r.properties) {
      console.log(JSON.stringify(r.properties, null, 2));
    }
  }

  console.log(
    `\n${dryRun ? "(dry-run) " : ""}` +
      `total=${summary.total} created=${summary.created} ` +
      `skipped=${summary.skipped} invalid=${summary.invalid} failed=${summary.failed}`,
  );

  if (summary.invalid || summary.failed) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
