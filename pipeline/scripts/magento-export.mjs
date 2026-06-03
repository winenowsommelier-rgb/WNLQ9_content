#!/usr/bin/env node
// WNLQ9 — convert standalone article pages → Magento-embeddable fragments.
// The live blog is Magento; it needs body-only HTML with SCOPED CSS (no
// <!DOCTYPE>/<html>/<head>), not standalone pages. This produces that.
//
// Modes:
//   --mode scoped  (default) keep OUR design: strip doc wrappers + site topbar,
//                  scope article.css under a .wnlq9-article wrapper, carry JSON-LD.
//   --mode blog    re-skin onto the existing .blog-wrap / Kanit system used by the
//                  current *-MAGENTO-SAFE.html files (base typography from there;
//                  our components — cards/table/FAQ — preserved, scoped).
//
// Usage:
//   node pipeline/scripts/magento-export.mjs [--mode scoped|blog] [--only <slug>] [--out <dir>]
// Default out: pipeline/public/magento/<mode>/. Validates each fragment.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(__dirname, "../public/content");
const CSS_FILE = path.join(CONTENT, "assets/article.css");
const REPO = path.resolve(__dirname, "../..");
const SKIP = new Set(["index.html", "process.html"]);

const args = process.argv.slice(2);
const arg = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const MODE = arg("--mode", "scoped");
const ONLY = arg("--only", null);
const OUT = arg("--out", path.resolve(__dirname, `../public/magento/${MODE}`));

// ---- CSS scoper (brace-aware, handles @media/@supports/@keyframes) --------
function matchBrace(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}") { depth--; if (depth === 0) return i; }
  }
  return s.length - 1;
}
function scopeSelector(sel, scope) {
  const s = sel.trim();
  if (!s) return s;
  if (s === ":root" || s === "html" || s === "body") return scope;
  if (s === "*") return `${scope} *`;
  if (/^(html|body)\s+/.test(s)) return `${scope} ${s.replace(/^(html|body)\s+/, "")}`;
  return `${scope} ${s}`;
}
function scopeCss(css, scope) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let out = "", i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const sel = css.slice(i, open).trim();
    const close = matchBrace(css, open);
    const inner = css.slice(open + 1, close);
    if (/^@(media|supports)/.test(sel)) out += `${sel}{${scopeCss(inner, scope)}}`;
    else if (/^@/.test(sel)) out += `${sel}{${inner}}`; // @keyframes/@font-face: leave inner
    else out += `${sel.split(",").map((x) => scopeSelector(x, scope)).join(",")}{${inner}}`;
    i = close + 1;
  }
  return out;
}

// ---- extract pieces from a standalone article ----------------------------
const grab = (re, s) => (s.match(re) || [])[0] || "";
function pieces(html) {
  return {
    header: grab(/<header class="article">[\s\S]*?<\/header>/, html),
    article: grab(/<article>[\s\S]*?<\/article>/, html),
    footer: grab(/<footer class="site">[\s\S]*?<\/footer>/, html),
    jsonld: [...html.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].map((m) => m[0]).join("\n"),
    site: /th\.liq9\.com/.test(html) ? "LIQ9" : "Wine-Now",
  };
}

// ---- blog-mode base CSS: reuse the existing .blog-wrap/Kanit system --------
function blogBaseCss() {
  for (const f of ["gen-z-wine-trends-MAGENTO-SAFE.html", "18-noble-grapes-MAGENTO-SAFE.html"]) {
    const p = path.join(REPO, f);
    if (fs.existsSync(p)) {
      const m = fs.readFileSync(p, "utf8").match(/<style>([\s\S]*?)<\/style>/);
      if (m) return m[1];
    }
  }
  return "";
}

// ---- build one fragment --------------------------------------------------
function buildFragment(html) {
  const p = pieces(html);
  const inner = `<div class="wrap">\n${p.header}\n${p.article}\n</div>\n${p.footer}`;
  if (MODE === "blog") {
    // re-skin: Kanit/.blog-wrap base typography + our components scoped under .blog-wrap
    const base = blogBaseCss();
    const components = scopeCss(fs.readFileSync(CSS_FILE, "utf8"), ".blog-wrap")
      // drop base element rules that the .blog-* base should own (avoid double base)
      .replace(/\.blog-wrap\{[^}]*\}/g, "");
    return `<style>\n${base}\n/* WNLQ9 components */\n${components}\n</style>\n<div class="blog-wrap">\n${inner}\n</div>\n${p.jsonld}\n`;
  }
  // scoped (default): faithful, our design under .wnlq9-article
  const css = scopeCss(fs.readFileSync(CSS_FILE, "utf8"), ".wnlq9-article");
  return `<style>\n${css}\n</style>\n<div class="wnlq9-article">\n${inner}\n</div>\n${p.jsonld}\n`;
}

// ---- validate a fragment is Magento-safe ---------------------------------
function validate(name, frag) {
  const fails = [];
  if (/<!DOCTYPE|<html[\s>]|<head[\s>]|<body[\s>]/i.test(frag)) fails.push("contains full-doc wrapper");
  if (/href="assets\/article\.css"/.test(frag)) fails.push("external CSS link remains");
  if ((frag.match(/<style>/g) || []).length !== 1) fails.push("expected exactly one <style>");
  if (!/ดื่มอย่างมีความรับผิดชอบ\s*·\s*20\+/.test(frag)) fails.push("missing compliance footer (20+)");
  if (!/application\/ld\+json/.test(frag)) fails.push("missing JSON-LD");
  if (!/<h1[\s>]/.test(frag)) fails.push("missing <h1>");
  return fails;
}

// ---- run -----------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".html") && !SKIP.has(f) && (!ONLY || f === ONLY || f === `${ONLY}.html`));
let bad = 0;
for (const f of files) {
  const html = fs.readFileSync(path.join(CONTENT, f), "utf8");
  const frag = buildFragment(html);
  const fails = validate(f, frag);
  fs.writeFileSync(path.join(OUT, f), frag);
  if (fails.length) { bad++; console.log(`FAIL ${f}: ${fails.join("; ")}`); }
}
console.log(`\nmode=${MODE} | ${files.length} fragment(s) -> ${OUT} | ${bad ? bad + " FAILED" : "all valid"}`);
process.exit(bad ? 1 : 0);
