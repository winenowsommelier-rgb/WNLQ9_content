#!/usr/bin/env node
// CLI: render / publish the July content from Notion through main's pipeline.
//
// Usage:
//   node src/july-cli.mjs --dry-run [--items rows.json] [--limit N] [--out DIR]
//   node src/july-cli.mjs --publish [--limit N] [--status Review]
//
//   --dry-run         render HTML to --out only; never touch Notion/Drive (default)
//   --publish         live: upload to Drive + write Status/links back to Notion
//   --items <file>    render from a local items JSON (offline) instead of Notion
//   --limit <n>       cap the number of rows
//   --out <dir>       dry-run output dir (default ./out/july-dry)
//   --status <s>      Notion Status to select (default "Review")
//
// Env: NOTION_TOKEN (+ NOTION_DATABASE_ID defaults to July), ANTHROPIC_API_KEY
//      (full-depth expansion; falls back to offline seed when absent),
//      WNLQ9_BI_API_KEY, GOOGLE_SERVICE_ACCOUNT_JSON + DRIVE_FOLDER_ID (publish),
//      PUBLISH_LANGS ("th" | "th,en").

import { readFile } from "node:fs/promises";
import { publishJuly } from "./july-publish.mjs";

function parseArgs(argv) {
  const a = { dryRun: true, items: null, limit: 0, out: null, status: "Review" };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--publish") a.dryRun = false;
    else if (x === "--dry-run") a.dryRun = true;
    else if (x === "--items") a.items = argv[++i];
    else if (x === "--limit") a.limit = Number(argv[++i]) || 0;
    else if (x === "--out") a.out = argv[++i];
    else if (x === "--status") a.status = argv[++i];
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const items = args.items ? JSON.parse(await readFile(args.items, "utf8")) : undefined;

  const { summary, results, verifyList } = await publishJuly({
    dryRun: args.dryRun,
    items,
    limit: args.limit || undefined,
    outDir: args.out || undefined,
    status: args.status,
  });

  for (const r of results) {
    const tag = String(r.status).toUpperCase().padEnd(9);
    const extra = r.error || r.driveUrl || r.file || "";
    console.log(`[${tag}] ${r.slug || r.pageId} (${r.lang})  ${extra}`);
  }

  if (verifyList.length) {
    console.log(`\n--- VERIFY LIST (${verifyList.length}) ---`);
    for (const v of verifyList) console.log(`  • ${v}`);
  }

  console.log(
    `\n${args.dryRun ? "(dry-run) " : ""}rows=${summary.rows} ` +
      `rendered=${summary.rendered} published=${summary.published} failed=${summary.failed} ` +
      `langs=${summary.langs.join(",")}`,
  );
  if (summary.failed) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
