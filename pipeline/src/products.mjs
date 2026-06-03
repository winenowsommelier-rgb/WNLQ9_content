// Pick real, in-stock product cards for an article from the BI product feed.
//
// SKU rule (CONTENT_PRODUCTION_PLAYBOOK §3): every card carries a real, in-stock
// SKU from the feed. We derive the topic filter from the row with the same
// heuristic the Supabase sync uses (plan-sync.buildProductFilter), keep only
// in-stock items for the row's Site, and rank by recent units sold. If a topic
// filter is present but nothing matches, we return ZERO cards (caller routes to
// LINE) — we never invent a product. Bestseller RANK is never surfaced (soft
// badges only): ranks drift and become wrong.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildProductFilter } from "./plan-sync.mjs";

// Spirit categories (LIQ9). Anything else in the feed is treated as wine.
const SPIRIT_CATEGORIES = [
  "whisky", "whiskey", "scotch", "bourbon", "vodka", "gin", "rum", "tequila",
  "brandy", "cognac", "sake", "shochu", "liqueur", "spirit",
];

const lc = (s) => String(s || "").toLowerCase();

/** Classify a feed row as a spirit (LIQ9) vs wine (Wine-Now). */
export function isSpirit(product) {
  const cat = lc(product.category_raw);
  return SPIRIT_CATEGORIES.some((t) => cat.includes(t));
}

function siteOf(product) {
  return isSpirit(product) ? "LIQ9" : "Wine-Now";
}

// Wine style token -> matchers against category_raw / product_name.
const STYLE_TOKENS = {
  sparkling: ["sparkling", "champagne", "prosecco", "cava", "crémant", "cremant"],
  rose: ["rosé", "rose"],
  dessert: ["dessert", "sweet", "port", "sauternes", "ice wine"],
  white: ["white"],
  red: ["red"],
};

function matchesFilter(product, filter) {
  const hay = `${lc(product.product_name)} ${lc(product.brand)} ${lc(product.category_raw)} ${lc(product.region)}`;
  if (filter.name && !hay.includes(lc(filter.name))) return false;
  if (filter.grape && !hay.includes(lc(filter.grape))) return false;
  if (filter.styles && filter.styles.length) {
    const ok = filter.styles.some((style) => {
      const tokens = STYLE_TOKENS[lc(style)] || [lc(style)];
      return tokens.some((t) => hay.includes(t));
    });
    if (!ok) return false;
  }
  return true;
}

/** Format an approximate price chip per the compliance rule (~฿, never exact-final). */
export function formatPrice(thb) {
  if (thb == null || !Number.isFinite(Number(thb))) return null;
  return `~฿${Number(thb).toLocaleString("en-US")}`;
}

/**
 * Select product cards for a row.
 * @param {object} item   normalized Notion item (site, title, targetKeyword, key)
 * @param {object[]} feed product feed rows
 * @param {object} [opts]
 * @param {number} [opts.limit=3]
 * @returns {{cards: object[], filter: object, matched: number}}
 */
export function pickProducts(item = {}, feed = [], { limit = 3 } = {}) {
  const filter = buildProductFilter(item);
  const filterHasKeys = Object.keys(filter).length > 0;

  const inStockForSite = feed.filter(
    (p) => p.in_stock === true && siteOf(p) === (item.site || "Wine-Now"),
  );

  let matched = filterHasKeys
    ? inStockForSite.filter((p) => matchesFilter(p, filter))
    : inStockForSite;

  // A topic filter that matches nothing => ship 0 cards (route to LINE), per the
  // SKU rule. Only fall back to "popular in-stock" when no filter was derivable.
  if (filterHasKeys && matched.length === 0) {
    return { cards: [], filter, matched: 0 };
  }

  matched = [...matched].sort(
    (a, b) => (b.units_sold_90d || 0) - (a.units_sold_90d || 0),
  );

  const cards = matched.slice(0, limit).map((p) => toCard(p, item));
  return { cards, filter, matched: matched.length };
}

function toCard(p, item) {
  const place = [p.country, p.region].filter(Boolean).join(" · ");
  const desc = [place, p.category_raw].filter(Boolean).join(" · ");
  return {
    sku: p.sku,
    name: p.product_name,
    brand: p.brand || null,
    desc,
    price: formatPrice(p.price_thb),
    priceThb: p.price_thb ?? null,
    // Soft badges only — NEVER a numeric bestseller rank.
    badges: [item.category || "แนะนำ", p.category_raw].filter(Boolean),
    catalogUrl: catalogUrl(item.site, p),
  };
}

function catalogUrl(site, p) {
  const base =
    site === "LIQ9"
      ? "https://th.liq9.com/catalogsearch/result/?q="
      : "https://th.wine-now.com/catalogsearch/result/?q=";
  return base + encodeURIComponent(p.product_name || p.brand || p.sku);
}

/** Load the committed product-feed snapshot (data/products.json). */
export async function loadFeed(cwd = process.cwd()) {
  const raw = await readFile(join(cwd, "data", "products.json"), "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.products || [];
}
