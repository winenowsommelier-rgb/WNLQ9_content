#!/usr/bin/env node
// WNLQ9 article QA gate — enforces the CLAUDE.md golden rules on each
// public/content/*.html article so nothing ships broken or non-compliant.
//
// Usage:
//   node pipeline/scripts/validate-articles.mjs [file1.html file2.html ...]
//   (no args → validates every *.html in public/content except index/process)
//
// Exit code 0 = all pass, 1 = at least one FAIL. Zero dependencies (Node >=18).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "../public/content");
const PRODUCTS = path.resolve(__dirname, "../data/products.json");

const feed = JSON.parse(fs.readFileSync(PRODUCTS, "utf8"));
const stockBySku = new Map(feed.products.map((p) => [p.sku, p]));

const SKIP = new Set(["index.html", "process.html"]);

function listFiles() {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".html") && !SKIP.has(f))
    .map((f) => path.join(CONTENT_DIR, f));
}

const argv = process.argv.slice(2);
const files = argv.length
  ? argv.map((f) => (path.isAbsolute(f) ? f : path.resolve(process.cwd(), f)))
  : listFiles();

let hadFail = false;

for (const file of files) {
  const name = path.basename(file);
  const html = fs.readFileSync(file, "utf8");
  const fails = [];
  const warns = [];

  // --- head essentials -----------------------------------------------------
  if (!/family=Sarabun/.test(html)) fails.push("missing Sarabun webfont");
  if (!/<link rel="canonical"/.test(html)) fails.push("missing canonical");
  if (!/property="og:image"/.test(html)) fails.push("missing og:image");
  if (!/name="twitter:card"/.test(html)) fails.push("missing twitter:card");

  // --- three JSON-LD blocks (Article / BreadcrumbList / FAQPage) ------------
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => m[1].trim()
  );
  const types = ld.map((b) => {
    try {
      return JSON.parse(b)["@type"];
    } catch {
      fails.push("invalid JSON-LD block");
      return null;
    }
  });
  for (const t of ["Article", "BreadcrumbList", "FAQPage"]) {
    if (!types.includes(t)) fails.push(`missing JSON-LD ${t}`);
  }

  // --- Article headline === on-page H1 -------------------------------------
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, "").trim();
  let articleHeadline = null;
  for (const b of ld) {
    try {
      const j = JSON.parse(b);
      if (j["@type"] === "Article") articleHeadline = j.headline;
    } catch {}
  }
  if (!h1) fails.push("no <h1>");
  else if (articleHeadline && articleHeadline.trim() !== h1)
    fails.push(`Article.headline != H1\n      headline: ${articleHeadline}\n      h1:       ${h1}`);

  // --- FAQ mirrors on-page accordion ---------------------------------------
  const pageFaq = (html.match(/<details/g) || []).length;
  let faqLd = 0;
  for (const b of ld) {
    try {
      const j = JSON.parse(b);
      if (j["@type"] === "FAQPage") faqLd = (j.mainEntity || []).length;
    } catch {}
  }
  if (faqLd === 0) fails.push("FAQPage has 0 questions");
  if (pageFaq !== faqLd)
    fails.push(`FAQ count mismatch: on-page <details>=${pageFaq} vs FAQPage=${faqLd}`);
  if (faqLd < 4) warns.push(`FAQ has only ${faqLd} items (playbook wants 4-6)`);

  // --- product cards: real, in-stock SKUs + visible chip --------------------
  const cardSkus = [...html.matchAll(/data-sku="([^"]+)"/g)].map((m) => m[1]);
  for (const sku of cardSkus) {
    const p = stockBySku.get(sku);
    if (!p) fails.push(`SKU ${sku} not in product feed`);
    else if (p.in_stock !== true) fails.push(`SKU ${sku} not in_stock`);
    const chip = new RegExp(`SKU: <b>${sku}</b>`);
    if (!chip.test(html)) fails.push(`SKU ${sku} missing visible chip`);
  }
  // soft badges only — no "#NN" rank claims
  if (/badge[^>]*>[^<]*#\d/.test(html)) fails.push("ranked badge (#NN) found — soft badges only");

  // --- compliance ----------------------------------------------------------
  if (cardSkus.length > 0) {
    if (!/~฿/.test(html)) fails.push("product cards present but no ~฿ approximate price");
    if (!/LINE/.test(html)) fails.push("no LINE order/enquiry routing");
  }
  if (!/ดื่มอย่างมีความรับผิดชอบ\s*·\s*20\+/.test(html))
    fails.push("missing footer 'ดื่มอย่างมีความรับผิดชอบ · 20+'");
  if (!/byline/.test(html)) fails.push("missing E-E-A-T byline");

  // --- CLS guard: 16/9 placeholder/image -----------------------------------
  if (!/figph|aspect-ratio:16\/9/.test(html)) warns.push("no .figph / 16:9 figure found");

  // --- summary callout near top --------------------------------------------
  if (!/สรุปสั้นๆ/.test(html)) warns.push("missing 'สรุปสั้นๆ' summary callout");

  // --- report --------------------------------------------------------------
  if (fails.length) {
    hadFail = true;
    console.log(`[31mFAIL[0m ${name}`);
    for (const f of fails) console.log(`   ✗ ${f}`);
    for (const w of warns) console.log(`   ⚠ ${w}`);
  } else {
    console.log(`[32mPASS[0m ${name}  (cards=${cardSkus.length}, faq=${faqLd})`);
    for (const w of warns) console.log(`   ⚠ ${w}`);
  }
}

console.log(`\n${files.length} file(s) checked — ${hadFail ? "SOME FAILED" : "all passed"}.`);
process.exit(hadFail ? 1 : 0);
