// Build a content-safe product feed for article generation.
//
// Source: the public WNLQ9 marketing-data repo (raw GitHub, no auth).
//   - bestsellers.json  (90-day top sellers: name, brand, category, country, price, units, stock)
//   - must_move.json    (overstock SKUs the business wants to move)
//
// We deliberately EXCLUDE revenue_thb / margin_thb (business-internal) and never
// touch winback.json (customer PII). Output keeps only what content needs:
//   sku, product_name, brand, category, country, price_thb, units_sold, in_stock, must_move
//
// NOTE: the upstream `category` field has known errors (e.g. Dom Perignon tagged
// "Orange Wine", Champagne tagged "White Wine"). Writers must classify by wine
// knowledge, not blindly trust `category`. We pass it through as `category_raw`
// to make that explicit.
//
// Usage: node scripts/build-product-feed.mjs  -> writes pipeline/data/products.json

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAW = "https://raw.githubusercontent.com/winenowsommelier-rgb/wnlq9-marketing-data-/main/marketing";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../pipeline/data/products.json");

const clean = (s) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : s);

async function getJson(name) {
  const res = await fetch(`${RAW}/${name}.json`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
}

const main = async () => {
  const [best, move] = await Promise.all([getJson("bestsellers"), getJson("must_move")]);

  const moveSkus = new Set((move.data || []).map((r) => r.sku));

  const products = (best.data || []).map((r) => ({
    sku: r.sku,
    product_name: clean(r.product_name),
    brand: clean(r.brand),
    category_raw: r.category, // upstream label — may be wrong, see header note
    country: r.country || null,
    region: r.region || null,
    price_thb: r.avg_unit_price_thb != null ? Math.round(r.avg_unit_price_thb) : null,
    units_sold_90d: r.units_sold ?? null,
    in_stock: r.in_stock ?? null,
    must_move: moveSkus.has(r.sku),
  }));

  // popularity rank by units (desc) among in-stock items, for easy "best-seller" picks
  const ranked = [...products]
    .filter((p) => p.in_stock)
    .sort((a, b) => (b.units_sold_90d || 0) - (a.units_sold_90d || 0));
  ranked.forEach((p, i) => (p.bestseller_rank = i + 1));

  const feed = {
    generated_at: new Date().toISOString(),
    source: "wnlq9-marketing-data (bestsellers + must_move), revenue/margin & PII excluded",
    window_days: best.window_days ?? 90,
    count: products.length,
    products,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(feed, null, 2) + "\n");
  console.log(`Wrote ${products.length} products -> ${OUT} (${products.filter((p) => p.must_move).length} flagged must_move)`);
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
