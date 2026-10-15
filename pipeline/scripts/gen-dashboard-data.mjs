#!/usr/bin/env node
// Generates browser-ready JSON for Mission Control (pipeline/public/index.html)
// from the repo's sources of truth. Runnable from anywhere:
//   node pipeline/scripts/gen-dashboard-data.mjs
//   (or, from pipeline/)  npm run data
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // repo root
const p = (...s) => join(ROOT, ...s);
const OUT = p('pipeline', 'public', 'data');
mkdirSync(OUT, { recursive: true });

// ---- tiny RFC-4180-ish CSV parser (handles quoted fields, commas, newlines) ----
function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift().map(h => h.trim());
  return rows.filter(r => r.some(c => c.trim() !== '')).map(r =>
    Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const splitTitle = (t = '') => { const [th, en] = t.split('|').map(s => s.trim()); return { th: th || t, en: en || '' }; };

// ---- TOPICS (3 libraries normalized to one shape) ----
const topics = [];
const std = (file, brand) => {
  if (!existsSync(file)) return;
  for (const r of parseCSV(readFileSync(file, 'utf8'))) {
    const { th, en } = splitTitle(r['Topic Title (Thai | EN)']);
    topics.push({ source: brand, brand, topicTH: th, topicEN: en,
      type: r['Content Type'] || '', primaryKeyword: r['Primary Keyword'] || '',
      intent: r['Search Intent'] || '', persona: r['Buyer Persona'] || '',
      category: r['Category'] || '', seasonality: r['Seasonality'] || '',
      volume: r['Est. Search Volume'] || '', aeo: r['AI Citation Opportunity'] || '',
      notes: r['Notes'] || '' });
  }
};
std(p('wine-now-topic-library.csv'), 'Wine-Now');
std(p('liq9-topic-library.csv'), 'LIQ9');
if (existsSync(p('viral-seo-boosters.csv'))) {
  for (const r of parseCSV(readFileSync(p('viral-seo-boosters.csv'), 'utf8'))) {
    const { th, en } = splitTitle(r['Topic Title (Thai | EN)']);
    topics.push({ source: 'Viral', brand: r['Brand Focus'] || 'Both', topicTH: th, topicEN: en,
      type: r['Content Type'] || '', primaryKeyword: r['Primary Keyword'] || '',
      intent: r['SEO Power Angle'] || '', persona: '',
      category: r['Viral Hook'] || '', seasonality: '',
      volume: r['Search Volume'] || '', aeo: r['AI Citation Value'] || '',
      notes: r['Production Notes'] || '' });
  }
}
const bySource = topics.reduce((a, t) => (a[t.source] = (a[t.source] || 0) + 1, a), {});
writeFileSync(join(OUT, 'topics.json'), JSON.stringify({
  generated_at: new Date().toISOString(), count: topics.length, bySource, topics }, null, 2));

// ---- PRODUCTS (copy + derive Wine-Now/LIQ9 from category) ----
const WINE = /(red|white|champ|rosé|rose|sparkl|orange|wine|moscato|riesling|prosecco|cava)/i;
const prod = JSON.parse(readFileSync(p('pipeline', 'data', 'products.json'), 'utf8'));
prod.products = prod.products.map(x => ({ ...x,
  brand_site: WINE.test(x.category_raw || '') ? 'Wine-Now' : 'LIQ9' }));
prod.brand_site_counts = prod.products.reduce((a, x) => (a[x.brand_site] = (a[x.brand_site] || 0) + 1, a), {});
writeFileSync(join(OUT, 'products.json'), JSON.stringify(prod, null, 2));

// ---- CONTENT INDEX (scan public/content/*.html) ----
const dir = p('pipeline', 'public', 'content');
const pick = (re, s) => { const m = s.match(re); return m ? m[1].trim() : null; };
const arts = readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html').map(f => {
  const html = readFileSync(join(dir, f), 'utf8');
  const title = pick(/<title>([\s\S]*?)<\/title>/i, html);
  const h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html)?.replace(/<[^>]+>/g, '').trim() || null;
  const brand = /^liq9[-_]/i.test(f) ? 'LIQ9' : 'Wine-Now';
  const dayM = f.match(/day[-_]?(\d+)/i);
  return { file: f, brand, day: dayM ? Number(dayM[1]) : null, h1,
    title: title?.split('|')[0].trim() || h1 || f };
}).sort((a, b) => a.brand.localeCompare(b.brand) || ((a.day ?? 999) - (b.day ?? 999)));
const byBrand = arts.reduce((a, r) => (a[r.brand] = (a[r.brand] || 0) + 1, a), {});
writeFileSync(join(OUT, 'content-index.json'), JSON.stringify({
  generated_at: new Date().toISOString(), count: arts.length, byBrand, articles: arts }, null, 2));

console.log('topics.json   :', topics.length, 'topics', bySource);
console.log('products.json :', prod.count, 'SKUs', prod.brand_site_counts);
console.log('content-index :', arts.length, 'articles', byBrand);
