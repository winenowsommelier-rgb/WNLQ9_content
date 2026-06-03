#!/usr/bin/env node
/**
 * notion-backup.mjs
 *
 * Automated Notion -> git backup for the WNLQ9 content operation.
 *
 * Exports the core content system (Master Topic Ledger, monthly DBs, and the
 * Editorial Production Standard page) to JSON files under notion-backups/ so the
 * whole system survives an accidental Notion deletion.
 *
 * Requires: NOTION_TOKEN (a Notion internal integration token) in the env.
 * The 4 target pages/DBs must be shared with that integration.
 *
 * Usage: NOTION_TOKEN=secret_xxx node scripts/notion-backup.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const RATE_LIMIT_DELAY_MS = 350; // Notion allows ~3 req/sec; stay under it.

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const BACKUP_DIR = join(REPO_ROOT, "notion-backups");

/**
 * Backup targets. IDs are hardcoded here intentionally so the backup is
 * self-contained and does not depend on any external config.
 *
 * type:
 *   "database" -> POST /databases/{id}/query (paginate, collect pages).
 *                 Data-source UUIDs are queried the same way as databases.
 *   "page"     -> GET /blocks/{id}/children, recursively (paginate).
 *
 * The "collection://" prefix sometimes seen in MCP/internal tooling is NOT used
 * by the public REST API; only raw UUIDs are passed here.
 */
const TARGETS = [
  {
    name: "master-topic-ledger",
    type: "database",
    id: "43240f1120df437391017e67a64723a7",
  },
  {
    name: "july-2026-db",
    type: "database",
    // July 2026 monthly DB — database_id (NOT the collection:// data-source id
    // d342f9b8…, which 404s on /databases/{id}/query).
    id: "93ac15a8-bb65-40f7-b357-b8cabd336214",
  },
  {
    name: "june-2026-db",
    type: "database",
    // June 2026 monthly DB — database_id (NOT data-source id 6be4a7bb…).
    id: "786d080f-8da2-4a1e-b84e-161f4e19d56d",
  },
  {
    name: "editorial-standard",
    type: "page",
    id: "3729d75a-e4b5-81a8-83dd-c176804fdbdd",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strip a "collection://" prefix if present and normalize the UUID. The REST API
 * expects a raw id (with or without dashes), never the MCP-internal form.
 */
function normalizeId(rawId) {
  return String(rawId).replace(/^collection:\/\//, "").trim();
}

/**
 * Perform a single authenticated Notion API request with basic 429 handling.
 */
async function notionRequest(method, path, body) {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error(
      "NOTION_TOKEN is not set. Configure the GitHub secret / env var before running."
    );
  }

  const url = `${NOTION_API}${path}`;
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let res = await fetch(url, init);

  // Respect Notion rate-limit responses by honoring Retry-After once.
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || 1;
    await sleep(retryAfter * 1000);
    res = await fetch(url, init);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Notion API ${method} ${path} -> ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Query a database (or data source) fully, following pagination.
 * Returns the array of page objects.
 */
async function queryDatabase(id) {
  const results = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const data = await notionRequest("POST", `/databases/${id}/query`, body);
    if (Array.isArray(data.results)) {
      results.push(...data.results);
    }
    hasMore = Boolean(data.has_more);
    cursor = data.next_cursor || undefined;

    if (hasMore) await sleep(RATE_LIMIT_DELAY_MS);
  }

  return results;
}

/**
 * Fetch all children blocks of a block/page id, paginating. For any child that
 * itself has children, recurse and attach them under `_children`.
 */
async function fetchBlockChildren(id) {
  const blocks = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const qs = new URLSearchParams({ page_size: "100" });
    if (cursor) qs.set("start_cursor", cursor);

    const data = await notionRequest(
      "GET",
      `/blocks/${id}/children?${qs.toString()}`
    );

    const page = Array.isArray(data.results) ? data.results : [];
    for (const block of page) {
      if (block && block.has_children) {
        await sleep(RATE_LIMIT_DELAY_MS);
        block._children = await fetchBlockChildren(block.id);
      }
    }
    blocks.push(...page);

    hasMore = Boolean(data.has_more);
    cursor = data.next_cursor || undefined;

    if (hasMore) await sleep(RATE_LIMIT_DELAY_MS);
  }

  return blocks;
}

/**
 * Count blocks recursively (including nested _children) for the manifest.
 */
function countBlocks(blocks) {
  let total = 0;
  for (const block of blocks) {
    total += 1;
    if (Array.isArray(block._children)) {
      total += countBlocks(block._children);
    }
  }
  return total;
}

async function backupTarget(target) {
  const id = normalizeId(target.id);
  const outPath = join(BACKUP_DIR, `${target.name}.json`);

  if (target.type === "database") {
    const records = await queryDatabase(id);
    const payload = {
      target: target.name,
      id,
      type: target.type,
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records,
    };
    await writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
    return { count: records.length, unit: "records" };
  }

  if (target.type === "page") {
    const blocks = await fetchBlockChildren(id);
    const count = countBlocks(blocks);
    const payload = {
      target: target.name,
      id,
      type: target.type,
      exportedAt: new Date().toISOString(),
      blockCount: count,
      blocks,
    };
    await writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
    return { count, unit: "blocks" };
  }

  throw new Error(`Unknown target type: ${target.type}`);
}

async function main() {
  await mkdir(BACKUP_DIR, { recursive: true });

  const manifest = {
    timestamp: new Date().toISOString(),
    notionVersion: NOTION_VERSION,
    targets: [],
  };

  let hadError = false;

  for (const target of TARGETS) {
    const id = normalizeId(target.id);
    const entry = {
      name: target.name,
      id,
      type: target.type,
      count: 0,
      status: "ok",
    };

    try {
      console.log(`Backing up "${target.name}" (${target.type} ${id})...`);
      const { count, unit } = await backupTarget(target);
      entry.count = count;
      console.log(`  ok: ${count} ${unit}`);
    } catch (err) {
      hadError = true;
      entry.status = "error";
      entry.error = err && err.message ? err.message : String(err);
      console.error(`  error backing up "${target.name}": ${entry.error}`);
    }

    manifest.targets.push(entry);
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  await writeFile(
    join(BACKUP_DIR, "_manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log("\nManifest written to notion-backups/_manifest.json");

  // Exit non-zero if any target failed, but only after all targets ran and the
  // manifest is written, so partial backups are still committed.
  if (hadError) {
    console.error("One or more targets failed. See manifest for details.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
