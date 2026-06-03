#!/usr/bin/env node
// WNLQ9 — regenerate pipeline/data/content-index.json from the article HTML.
// A reproducible content index for PLANNING (GA/GSC join, orphan detection,
// cluster work) + the dashboard. Pure metadata: reads each
// public/content/*.html and derives a stable record. No network.
//
// NOTE: this does NOT touch pipeline/data/articles.json — that file is the
// /api/approve page-id→file map and has a different purpose.
//
// Usage: node pipeline/scripts/build-articles-manifest.mjs [--check]
//   --check : print what WOULD be written + counts, don't write the file.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "../public/content");
const OUT = path.resolve(__dirname, "../data/content-index.json");
const SKIP = new Set(["index.html", "process.html"]);

const slugFromUrl = (u) => (u.split("?")[0].split("/").pop() || "").replace(/\.html$/, "");
const firstMatch = (re, s) => (s.match(re) || [])[1] || "";

function recordFor(file) {
  const html = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const fileSlug = file.replace(/\.html$/, "");
  const canonical = firstMatch(/<link rel="canonical" href="([^"]+)"/, html);
  const site = /th\.liq9\.com/.test(html) ? "LIQ9" : "Wine-Now";
  const title = firstMatch(/<h1[^>]*>([\s\S]*?)<\/h1>/, html).replace(/<[^>]+>/g, "").trim();
  // Article JSON-LD headline (should equal title; QA gate enforces it)
  let headline = "";
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      if (j["@type"] === "Article" && j.headline) headline = j.headline;
    } catch {}
  }
  const dayMatch = fileSlug.match(/day(\d+)/);
  const cards = [...html.matchAll(/data-sku="([^"]+)"/g)].map((m) => m[1]);
  const faq = (html.match(/<details/g) || []).length;
  // internal sibling links (unique), excluding self
  const links = [
    ...new Set(
      [...html.matchAll(/href="([a-z0-9][a-zA-Z0-9_-]+\.html)"/g)].map((m) => m[1].replace(/\.html$/, "")),
    ),
  ].filter((s) => s !== fileSlug);
  return {
    fileSlug,
    urlKey: canonical ? slugFromUrl(canonical) : fileSlug, // live-URL join key (GA4/GSC)
    site,
    day: dayMatch ? Number(dayMatch[1]) : null,
    title,
    headlineMatchesH1: headline === title,
    canonical,
    cards,
    cardCount: cards.length,
    faqCount: faq,
    internalLinks: links,
  };
}

const files = fs
  .readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith(".html") && !SKIP.has(f))
  .sort();

const records = files.map(recordFor);

// derive inbound link counts (by fileSlug) for an at-a-glance orphan view
const inbound = Object.fromEntries(records.map((r) => [r.fileSlug, 0]));
for (const r of records) for (const l of r.internalLinks) if (l in inbound) inbound[l]++;
for (const r of records) r.inboundLinks = inbound[r.fileSlug];

const manifest = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: "pipeline/public/content/*.html",
  count: records.length,
  articles: records,
};

if (process.argv.includes("--check")) {
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
  const prevN = prev ? (Array.isArray(prev) ? prev.length : prev.count || (prev.articles || []).length) : 0;
  const orphans = records.filter((r) => r.inboundLinks === 0).length;
  console.log(`would write ${OUT}`);
  console.log(`  articles: ${records.length} (was ${prevN})`);
  console.log(`  orphans (0 inbound): ${orphans}`);
  console.log(`  headline!=H1: ${records.filter((r) => !r.headlineMatchesH1).length}`);
  process.exit(0);
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote ${OUT} — ${records.length} articles (${records.filter((r) => r.inboundLinks === 0).length} orphans).`);
