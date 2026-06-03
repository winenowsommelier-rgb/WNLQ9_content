#!/usr/bin/env node
// Build CSS-inlined, self-contained copies of articles for Google Drive
// delivery. Replaces the shared <link rel="stylesheet" href="assets/article.css">
// with an inline <style> block so the file renders standalone in Drive preview.
//
// Usage:
//   node pipeline/scripts/inline-css.mjs <file.html> [more.html ...]
//   → writes /tmp/drive2/<name>.html and prints a validation line per file.
//
// Validation per file: 0 external css links, exactly one <style>, SKU chips > 0.
// Zero dependencies (Node >=18).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.resolve(__dirname, "../public/content/assets/article.css");
const OUT = "/tmp/drive2";

const css = fs.readFileSync(CSS, "utf8");
fs.mkdirSync(OUT, { recursive: true });

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node inline-css.mjs <file.html> [...]");
  process.exit(2);
}

let bad = false;
for (const f of files) {
  const src = path.isAbsolute(f) ? f : path.resolve(process.cwd(), f);
  const name = path.basename(src);
  let html = fs.readFileSync(src, "utf8");
  const link = /<link rel="stylesheet" href="assets\/article\.css">/;
  if (!link.test(html)) {
    console.log(`SKIP ${name} — no shared-CSS link found`);
    bad = true;
    continue;
  }
  html = html.replace(link, "<style>\n" + css + "\n</style>");
  fs.writeFileSync(path.join(OUT, name), html);
  const extCss = (html.match(/href="assets\/article\.css"/g) || []).length;
  const styleBlocks = (html.match(/<style>/g) || []).length;
  const skuChips = (html.match(/SKU: <b>/g) || []).length;
  // 0-card articles (no matching stock → routed to LINE) are valid by design,
  // so don't require SKU chips here — validate-articles.mjs owns card/SKU rules.
  const ok = extCss === 0 && styleBlocks === 1;
  if (!ok) bad = true;
  console.log(
    `${ok ? "OK  " : "BAD "}${name} | extCss=${extCss} styleBlocks=${styleBlocks} skuChips=${skuChips} bytes=${html.length} -> ${OUT}/${name}`
  );
}
process.exit(bad ? 1 : 0);
