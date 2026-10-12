#!/usr/bin/env node
// Turn a Drive folder listing into the June Drive-URL sweep plan.
//
// Why this exists: the upload agent re-uploads files (Drive MCP can't overwrite),
// so each slug accrues duplicate ids. This script picks the NEWEST id per slug,
// joins it to the stable slug->Notion-page-id map, and prints:
//   1) the Notion updates to apply (page id -> newest Drive url)
//   2) the stale duplicate ids to delete by hand
//   3) any anomalies (broken/tiny files, slugs with no map entry, missing slugs)
//
// Usage:
//   1. Re-scan the folder once the upload agent has STOPPED:
//        search_files  parentId = '1G8YX_IsFvv9VrvFiHT-HsPElerYv9AZM'  (pageSize 100)
//   2. Save that tool's JSON (the object with a "files" array) to /tmp/scan.json
//   3. node docs/notion-drive-sweep-plan.mjs /tmp/scan.json
//
// Then apply the printed Notion updates via notion-update-page
// ({ "Drive file URL": "<url>" } — no userDefined: prefix), and give the user
// the printed delete list for the Drive UI.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const MAP = JSON.parse(readFileSync(join(__dir, "notion-drive-sweep-map.json"), "utf8"));
const SLUG2PAGE = { ...MAP.wine_now, ...MAP.liq9 };

const TINY_BYTES = 5000; // anything under this is almost certainly a broken upload

const scanPath = process.argv[2];
if (!scanPath) { console.error("usage: node notion-drive-sweep-plan.mjs <scan.json>"); process.exit(1); }
const scan = JSON.parse(readFileSync(scanPath, "utf8"));
const files = scan.files || scan; // accept either {files:[...]} or a bare array

// slug = filename without .html; tolerate the day4 "-FINAL" suffix.
const slugOf = (title) => title.replace(/\.html$/i, "").replace(/-FINAL$/i, "");

const bySlug = new Map();
for (const f of files) {
  const slug = slugOf(f.title);
  if (!bySlug.has(slug)) bySlug.set(slug, []);
  bySlug.get(slug).push(f);
}

const updates = [];   // { slug, pageId, url, bytes }
const deletes = [];   // { slug, id, bytes, reason }
const anomalies = [];

for (const [slug, copies] of bySlug) {
  copies.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime)); // newest first
  // newest non-tiny copy is the keeper; tiny newest is suspicious -> flag and fall back
  let keeper = copies.find((c) => Number(c.fileSize) >= TINY_BYTES) || copies[0];
  if (Number(keeper.fileSize) < TINY_BYTES) anomalies.push(`TINY keeper ${slug} ${keeper.id} ${keeper.fileSize}B`);

  const pageId = SLUG2PAGE[slug];
  if (!pageId) { anomalies.push(`NO MAP ENTRY for slug "${slug}" (file ${keeper.id})`); }
  else updates.push({ slug, pageId, url: `https://drive.google.com/file/d/${keeper.id}/view`, bytes: keeper.fileSize });

  for (const c of copies) if (c.id !== keeper.id) {
    deletes.push({ slug, id: c.id, bytes: c.fileSize, reason: Number(c.fileSize) < TINY_BYTES ? "BROKEN/tiny" : "older dup" });
  }
}

const missing = Object.keys(SLUG2PAGE).filter((s) => !bySlug.has(s));

console.log(`# Sweep plan — ${updates.length}/52 slugs resolved, ${deletes.length} stale copies to delete\n`);
console.log(`## 1) Notion updates (apply via notion-update-page, prop "Drive file URL")`);
for (const u of updates) console.log(`${u.slug}\t${u.pageId}\t${u.url}\t(${u.bytes}B)`);
console.log(`\n## 2) Delete by hand in Drive (${deletes.length})`);
for (const d of deletes) console.log(`${d.reason}\t${d.slug}\t${d.id}\t(${d.bytes}B)`);
console.log(`\n## 3) Anomalies (${anomalies.length})`);
for (const a of anomalies) console.log(a);
if (missing.length) console.log(`\n## 4) Mapped slugs with NO file in folder (${missing.length})\n${missing.join("\n")}`);
