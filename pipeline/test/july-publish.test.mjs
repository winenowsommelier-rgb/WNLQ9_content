import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { publishJuly } from "../src/july-publish.mjs";

const ITEM = {
  id: "pg-test-1",
  briefId: "TEST-1",
  title: "ทดสอบ / Test Row",
  site: "Wine-Now",
  type: "Blog",
  category: "Education",
  status: "Review",
  publishDate: "2026-07-15",
  targetKeyword: "test",
  wordTarget: 900,
  cta: "ถาม LINE",
  schema: "Article + FAQPage",
};
const FEED = [
  { sku: "WSP1140AE", product_name: "Prosecco", brand: "B", category_raw: "Sparkling", country: "Italy", price_thb: 850, units_sold_90d: 40, in_stock: true },
];
const expand = async () => ({
  dek: "d",
  summary: "s",
  sections: [{ h2: "H", paragraphs: ["p"], list: [], note: "" }],
  table: null,
  faq: [{ q: "a", a: "b" }],
  productIntro: "",
  verifyNotes: [],
});

test("dry-run renders to outDir and makes no Notion/Drive calls", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "july-dry-"));
  let touched = false;
  const notion = {
    config: { databaseId: "x" },
    async updateRow() { touched = true; },
    async addLog() { touched = true; },
  };
  const r = await publishJuly({ dryRun: true, items: [ITEM], feed: FEED, expand, notion, cwd, outDir: join(cwd, "out") });
  assert.equal(r.summary.rendered, 1);
  assert.equal(r.summary.published, 0);
  assert.equal(touched, false, "dry-run must not write to Notion");
  assert.equal(readdirSync(join(cwd, "out")).length, 1);
});

test("live publish writeback contract: Brief Ready + Drive file URL only (no Final URL, no Week Theme)", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "july-live-"));
  const calls = [];
  const logs = [];
  const notion = {
    config: { databaseId: "x" },
    async updateRow(id, props) { calls.push({ id, props }); },
    async addLog(id, t) { logs.push(t); },
  };
  const drive = { async uploadHtmlFile({ name }) { return { id: "d1", url: `https://drive.example/${name}` }; } };

  const r = await publishJuly({ dryRun: false, items: [ITEM], feed: FEED, expand, notion, drive, cwd });

  assert.equal(r.summary.published, 1);
  assert.equal(r.summary.failed, 0);
  const props = calls[0].props;
  assert.deepEqual(props["Status"], { select: { name: "Brief Ready" } });
  assert.ok(props["Drive file URL"].url.startsWith("https://drive.example/"));
  assert.ok(!("Final URL" in props), "must not write a predicted Final URL by default");
  assert.ok(!("Week Theme" in props), "July board has no Week Theme");
  assert.match(logs[0], /Brief Ready/);

  // pageId -> file manifest is appended (so /api/approve can also serve it)
  const manifest = JSON.parse(readFileSync(join(cwd, "data", "articles.json"), "utf8"));
  assert.equal(manifest.articles["pg-test-1"], "test-row.html");
  assert.ok(existsSync(join(cwd, "public", "content", "test-row.html")));
});

test("writeFinalUrl opt-in records the predicted canonical", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "july-fu-"));
  const calls = [];
  const notion = { config: { databaseId: "x" }, async updateRow(id, props) { calls.push(props); }, async addLog() {} };
  const drive = { async uploadHtmlFile({ name }) { return { url: `https://drive.example/${name}` }; } };
  await publishJuly({ dryRun: false, items: [ITEM], feed: FEED, expand, notion, drive, cwd, writeFinalUrl: true });
  assert.ok(calls[0]["Final URL"].url.includes("/blog/"), "opt-in should write the canonical");
});
