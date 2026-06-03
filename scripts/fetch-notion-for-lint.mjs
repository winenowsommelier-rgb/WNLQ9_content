#!/usr/bin/env node
/**
 * fetch-notion-for-lint.mjs
 *
 * Companion to compliance-lint.mjs: pulls live content rows from the Notion
 * monthly production DBs (and optionally the ledger), maps each row to the
 * lint record shape, and writes a JSON array that `compliance-lint.mjs` can
 * consume directly. This lets you run the canonical local linter against live
 * Notion content (and cross-check the compliance-scan edge function).
 *
 * Requires NOTION_TOKEN in the env (same integration as notion-backup.mjs).
 *
 * Usage:
 *   NOTION_TOKEN=ntn_xxx node scripts/fetch-notion-for-lint.mjs [out.json] \
 *     [--statuses=Review,Done,Published]
 *   # then:
 *   node scripts/compliance-lint.mjs out.json
 */

import { writeFile } from "node:fs/promises";
import process from "node:process";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const RATE_LIMIT_DELAY_MS = 350;

// database_ids (NOT collection:// data-source ids — those 404 on this endpoint).
const TARGETS = [
  { name: "july-2026", id: "93ac15a8-bb65-40f7-b357-b8cabd336214" },
  { name: "june-2026", id: "786d080f-8da2-4a1e-b84e-161f4e19d56d" },
  // Ledger has no Content EN/TH fields; uncomment to include title-level checks.
  // { name: "master-topic-ledger", id: "43240f11-20df-4373-9101-7e67a64723a7" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getArg(flag, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit ? hit.slice(flag.length + 1) : fallback;
}

const OUT_PATH = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : "notion-lint-input.json";
const GATE_STATUSES = getArg("--statuses", "Review,Done,Published")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function notionRequest(method, path, body) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set.");
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  let res = await fetch(`${NOTION_API}${path}`, init);
  if (res.status === 429) {
    await sleep((Number(res.headers.get("retry-after")) || 1) * 1000);
    res = await fetch(`${NOTION_API}${path}`, init);
  }
  if (!res.ok) {
    throw new Error(`Notion ${method} ${path} -> ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

async function queryDatabase(id) {
  const results = [];
  let cursor;
  let hasMore = true;
  while (hasMore) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const data = await notionRequest("POST", `/databases/${id}/query`, body);
    if (Array.isArray(data.results)) results.push(...data.results);
    hasMore = Boolean(data.has_more);
    cursor = data.next_cursor || undefined;
    if (hasMore) await sleep(RATE_LIMIT_DELAY_MS);
  }
  return results;
}

const plain = (arr) => (Array.isArray(arr) ? arr.map((r) => r?.plain_text ?? "").join("") : "");

function richText(props, name) {
  const v = props[name];
  return v && v.type === "rich_text" ? plain(v.rich_text) : "";
}
function selectName(props, name) {
  const v = props[name];
  if (!v) return "";
  if (v.type === "select") return v.select?.name ?? "";
  if (v.type === "status") return v.status?.name ?? "";
  return "";
}
function dateStart(props, name) {
  const v = props[name];
  return v && v.type === "date" ? v.date?.start ?? "" : "";
}
function titleText(props) {
  for (const v of Object.values(props)) {
    if (v && v.type === "title") return plain(v.title);
  }
  return "";
}
function status(props) {
  const v = props["Status"];
  if (!v) return "";
  if (v.type === "status") return v.status?.name ?? "";
  if (v.type === "select") return v.select?.name ?? "";
  return "";
}
function splitTitle(t) {
  const i = t.indexOf(" / ");
  return i === -1 ? { th: t, en: "" } : { th: t.slice(0, i), en: t.slice(i + 3) };
}

async function main() {
  const out = [];
  for (const target of TARGETS) {
    const pages = await queryDatabase(target.id);
    for (const page of pages) {
      const props = page.properties || {};
      if (!GATE_STATUSES.includes(status(props))) continue;
      const { th, en } = splitTitle(titleText(props));
      out.push({
        code: richText(props, "Brief ID") || page.id.slice(0, 8),
        target: target.name,
        status: status(props),
        url: page.url,
        title_th: th,
        title_en: en,
        content_en: richText(props, "Content EN"),
        content_th: richText(props, "Content TH"),
        publishDate: dateStart(props, "Publish Date"),
        funnel: selectName(props, "Funnel"),
      });
    }
    await sleep(RATE_LIMIT_DELAY_MS);
  }
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${out.length} record(s) (${GATE_STATUSES.join("/")}) to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exitCode = 1;
});
