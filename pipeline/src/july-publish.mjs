// July → pipeline publish driver (Drive-handoff model).
//
// Flow per Notion row (Status = Review) in the July database:
//   pick real in-stock products  ->  expand to full-depth Thai body (LLM, or an
//   offline seed when no key)  ->  build the article model  ->  render Magento-safe
//   HTML  ->  (live) inline CSS + upload to the Drive folder + write the link &
//   Status back to Notion. Thai-only by default; set PUBLISH_LANGS=th,en for EN too.
//
// Everything is injectable (items, feed, expander, notion, drive) so the whole
// pipeline runs offline in tests and in a no-secrets dry-run.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getConfig, schemaProfileFor, DATABASES } from "./config.mjs";
import { brandFor } from "./brands.mjs";
import { buildArticleModel } from "./article-model.mjs";
import { renderArticle } from "./render-article.mjs";
import { pickProducts, loadFeed } from "./products.mjs";
import { seedExpansion } from "./expand.mjs";
import { loadExpansion } from "./expansion-store.mjs";
import { expandArticle } from "./llm.mjs";
import { briefToNotionProperties } from "./mapping.mjs";
import { inlineStylesheet } from "./htmldoc.mjs";

/**
 * Choose the expander, in priority order:
 *   1. authored expansion file  (data/expansions/<BriefID>.json) — full depth, no API key
 *   2. ANTHROPIC_API_KEY        (llm.expandArticle) — full depth via the API
 *   3. offline seed             (seedExpansion) — authored Notion seed + verify-note
 */
export function defaultExpander(config = getConfig(), { cwd = process.cwd() } = {}) {
  return async (item, { products = [], lang = "th" } = {}) => {
    const authored = await loadExpansion(item, { cwd, lang });
    if (authored) return authored;
    if (config.anthropicKey) return expandArticle(item, { products, config });
    return seedExpansion(item, { lang });
  };
}

/**
 * Render one row to HTML for a single language.
 * @returns {Promise<{ model: object, html: string, verifyList: string[], lang: string }>}
 */
export async function renderRow(item, { feed = [], expand, lang = "th", banDays = [] } = {}) {
  const brand = brandFor(item.site);
  const { cards } = pickProducts(item, feed);
  const expansion = await expand(item, { products: cards, lang });
  const model = buildArticleModel(item, { brand, expansion, products: cards, lang, banDays });
  const html = renderArticle(model);
  return { model, html, verifyList: model.verifyList, lang };
}

async function readCss(cwd) {
  try {
    return await readFile(join(cwd, "public", "content", "assets", "article.css"), "utf8");
  } catch {
    return "";
  }
}

/**
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun=true]  render only — never touch Notion/Drive
 * @param {object[]} [opts.items]       items to render (else fetched from Notion)
 * @param {object[]} [opts.feed]        product feed (else data/products.json)
 * @param {string}  [opts.status='Review']
 * @param {number}  [opts.limit]
 * @param {string}  [opts.outDir]       where dry-run HTML is written
 * @param {string[]}[opts.langs]        languages (else config.publishLangs)
 * @param {string}  [opts.statusAfter='Brief Ready']  status to set on live publish
 * @param {string[]}[opts.banDays]
 * @param {object}  [opts.notion] [opts.drive] [opts.expand]
 * @param {string}  [opts.cwd=process.cwd()]
 */
export async function publishJuly(opts = {}) {
  const config = { ...getConfig(), databaseId: DATABASES.july.id, ...(opts.config || {}) };
  const profile = schemaProfileFor(config.databaseId);
  const cwd = opts.cwd || process.cwd();
  const dryRun = opts.dryRun !== false;
  const status = opts.status || "Review";
  const statusAfter = opts.statusAfter || "Brief Ready";
  const langs = opts.langs || config.publishLangs || ["th"];
  const banDays = opts.banDays || [];
  const outDir = opts.outDir || join(cwd, "out", "july-dry");
  const expand = opts.expand || defaultExpander(config, { cwd });

  const feed = opts.feed || (await loadFeed(cwd).catch(() => []));

  let items = opts.items;
  if (!items) {
    const { createClient } = await import("./notion.mjs");
    const notion = opts.notion || createClient(config);
    items = await notion.listItems({ status });
  }
  if (opts.limit) items = items.slice(0, opts.limit);

  const results = [];
  const verifyList = [];
  const summary = { rows: items.length, rendered: 0, published: 0, skipped: 0, failed: 0, langs };

  const css = dryRun ? "" : await readCss(cwd);
  const contentDir = join(cwd, "public", "content");
  if (dryRun) await mkdir(outDir, { recursive: true });

  for (const item of items) {
    for (const lang of langs) {
      try {
        const { model, html, verifyList: vl } = await renderRow(item, { feed, expand, lang, banDays });
        const fileName = lang === "th" ? `${model.slug}.html` : `${model.slug}.${lang}.html`;
        verifyList.push(...vl.map((v) => `[${item.title}] ${v}`));

        if (dryRun) {
          await writeFile(join(outDir, fileName), html, "utf8");
          summary.rendered++;
          results.push({ pageId: item.id, lang, slug: model.slug, file: join(outDir, fileName), status: "rendered", verify: vl.length });
          continue;
        }

        // --- Live publish: write repo file, inline CSS, upload, write back ---
        await mkdir(contentDir, { recursive: true });
        await writeFile(join(contentDir, fileName), html, "utf8");
        const selfContained = css ? inlineStylesheet(html, css) : html;

        const drive = opts.drive || (await defaultDrive(config));
        const { url } = await drive.uploadHtmlFile({ name: fileName, html: selfContained });

        const { createClient } = await import("./notion.mjs");
        const notion = opts.notion || createClient(config);
        // Only Thai (canonical) drives the Notion Status + Drive link writeback.
        if (lang === "th") {
          await notion.updateRow(
            item.id,
            briefToNotionProperties({ url, finalUrl: model.canonical, status: statusAfter }, { hasWeekTheme: profile.hasWeekTheme }),
          );
          await notion.addLog(item.id, `Rendered + uploaded (${fileName}) — Status ${statusAfter}: ${url}`);
        }
        await appendManifest(cwd, item.id, fileName);
        summary.published++;
        results.push({ pageId: item.id, lang, slug: model.slug, file: fileName, driveUrl: url, status: "published", verify: vl.length });
      } catch (err) {
        summary.failed++;
        results.push({ pageId: item.id, lang, status: "failed", error: err.message });
      }
    }
  }

  return { summary, results, verifyList };
}

async function defaultDrive(config) {
  const { createDriveClient } = await import("./drive.mjs");
  return createDriveClient({ config });
}

/** Append a pageId -> file mapping to data/articles.json (used by /api/approve). */
async function appendManifest(cwd, pageId, file) {
  const path = join(cwd, "data", "articles.json");
  let json = { articles: {} };
  try {
    json = JSON.parse(await readFile(path, "utf8"));
  } catch {
    /* start fresh */
  }
  json.articles = json.articles || {};
  json.articles[pageId] = file;
  await writeFile(path, JSON.stringify(json, null, 2) + "\n", "utf8");
}
