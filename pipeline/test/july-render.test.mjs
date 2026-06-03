import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeBrief } from "../src/validate.mjs";
import { briefToNotionProperties } from "../src/mapping.mjs";
import { schemaProfileFor, parseLangs, DATABASES } from "../src/config.mjs";
import { brandFor } from "../src/brands.mjs";
import { pickProducts } from "../src/products.mjs";
import {
  splitBilingualTitle,
  stripEmoji,
  deriveSlug,
  parseSeedContent,
  buildJsonLd,
  buildArticleModel,
} from "../src/article-model.mjs";
import { renderArticle } from "../src/render-article.mjs";
import { seedExpansion } from "../src/expand.mjs";
import { normalizeExpansion, loadExpansion } from "../src/expansion-store.mjs";

const julyProfile = schemaProfileFor(DATABASES.july.id);

// --- config / validate / mapping adapters -----------------------------------

test("July month validates and Week Theme is not derived on the July profile", () => {
  const { ok, value } = normalizeBrief(
    { title: "X / Y", site: "Wine-Now", category: "Education", month: "July 2026" },
    { profile: julyProfile },
  );
  assert.equal(ok, true);
  assert.equal(value.month, "July 2026");
  assert.equal(value.weekTheme, undefined);
});

test("mapping omits Week Theme for July but writes editorial columns", () => {
  const props = briefToNotionProperties(
    {
      title: "X",
      site: "LIQ9",
      category: "Education",
      author: "LIQ9 Bartender Desk",
      priority: "Hero",
      intent: "Informational",
      funnel: "TOFU",
      evergreen: "Evergreen",
      wordTarget: 1100,
      schema: "Article + FAQPage",
      status: "Brief Ready",
    },
    { hasWeekTheme: false },
  );
  assert.ok(!("Week Theme" in props));
  assert.deepEqual(props["Author"], { select: { name: "LIQ9 Bartender Desk" } });
  assert.deepEqual(props["Priority"], { select: { name: "Hero" } });
  assert.deepEqual(props["Funnel"], { select: { name: "TOFU" } });
  assert.deepEqual(props["Word Target"], { number: 1100 });
  assert.equal(props["Schema"].rich_text[0].text.content, "Article + FAQPage");
});

test("June board still derives + emits Week Theme (explicit June profile)", () => {
  const juneProfile = DATABASES.june;
  const { value } = normalizeBrief(
    { title: "X", site: "Wine-Now", category: "Education" },
    { profile: juneProfile },
  );
  const props = briefToNotionProperties(value, { hasWeekTheme: juneProfile.hasWeekTheme });
  assert.deepEqual(props["Week Theme"], { select: { name: "W1 Education" } });
});

test("default profile drops Week Theme (retired going forward)", () => {
  const { value } = normalizeBrief({ title: "X", site: "Wine-Now", category: "Education" });
  const props = briefToNotionProperties(value, { hasWeekTheme: false });
  assert.ok(!("Week Theme" in props));
});

test("parseLangs defaults to th and dedupes", () => {
  assert.deepEqual(parseLangs(undefined), ["th"]);
  assert.deepEqual(parseLangs("th, en, th"), ["th", "en"]);
});

// --- text helpers -----------------------------------------------------------

test("splitBilingualTitle splits on first ' / ' only", () => {
  assert.deepEqual(
    splitBilingualTitle("Champagne 101: รู้จัก / Champagne 101: Understanding"),
    { th: "Champagne 101: รู้จัก", en: "Champagne 101: Understanding" },
  );
  assert.deepEqual(splitBilingualTitle("ไม่มีอังกฤษ"), { th: "ไม่มีอังกฤษ", en: "" });
});

test("stripEmoji removes emoji from published text", () => {
  assert.equal(stripEmoji("ดื่ม 🍷 ให้สนุก ✨"), "ดื่ม ให้สนุก");
});

test("deriveSlug prefers the English title", () => {
  assert.equal(
    deriveSlug({ title: "x / Champagne 101: Understanding Sparkling Wine" }, { en: "Champagne 101: Understanding Sparkling Wine", th: "x" }),
    "champagne-101-understanding-sparkling-wine",
  );
});

test("parseSeedContent splits <br><br> paragraphs and an inline FAQ", () => {
  const { paragraphs, faq } = parseSeedContent(
    "ย่อหน้าแรก<br><br>ย่อหน้าสอง<br><br>คำถามที่พบบ่อย<br>ถาม: A? ตอบ: B.<br>ถาม: C? ตอบ: D.",
  );
  assert.deepEqual(paragraphs, ["ย่อหน้าแรก", "ย่อหน้าสอง"]);
  assert.deepEqual(faq, [{ q: "A?", a: "B." }, { q: "C?", a: "D." }]);
});

// --- products ---------------------------------------------------------------

const FEED = [
  { sku: "WSP5780AD", product_name: "Dom Perignon 2015", brand: "Dom Perignon", category_raw: "Sparkling", country: "France", region: "Champagne", price_thb: 9737, units_sold_90d: 8, in_stock: true, bestseller_rank: 12 },
  { sku: "WSP1140AE", product_name: "Prosecco Extra Dry", brand: "Bottega", category_raw: "Sparkling", country: "Italy", region: "Veneto", price_thb: 850, units_sold_90d: 40, in_stock: true, bestseller_rank: 3 },
  { sku: "WRW0282AD", product_name: "Some Red Wine", brand: "X", category_raw: "Red Wine", country: "Chile", region: null, price_thb: 411, units_sold_90d: 99, in_stock: true, bestseller_rank: 1 },
  { sku: "LWH0364CN", product_name: "Macallan 18", brand: "The Macallan", category_raw: "Whisky", country: "Scotland", region: null, price_thb: 20738, units_sold_90d: 12, in_stock: true, bestseller_rank: 62 },
  { sku: "WSPOOS", product_name: "Out Of Stock Bubbly", brand: "Z", category_raw: "Sparkling", country: "Spain", region: null, price_thb: 700, units_sold_90d: 200, in_stock: false, bestseller_rank: 2 },
];

test("pickProducts returns only in-stock SKUs matching the topic + site", () => {
  const { cards } = pickProducts(
    { site: "Wine-Now", title: "Champagne 101", targetKeyword: "champagne คือ" },
    FEED,
  );
  const skus = cards.map((c) => c.sku);
  assert.ok(skus.includes("WSP5780AD") && skus.includes("WSP1140AE"));
  assert.ok(!skus.includes("WRW0282AD")); // not sparkling
  assert.ok(!skus.includes("LWH0364CN")); // wrong site (spirit)
  assert.ok(!skus.includes("WSPOOS")); // out of stock
  // ranked by units sold desc, never exposes bestseller_rank
  assert.equal(cards[0].sku, "WSP1140AE");
  for (const c of cards) assert.ok(!("bestseller_rank" in c));
});

test("pickProducts ships 0 cards when a topic filter matches nothing (route to LINE)", () => {
  const { cards } = pickProducts(
    { site: "LIQ9", title: "Tequila 101", targetKeyword: "tequila คือ" },
    FEED,
  );
  assert.deepEqual(cards, []);
});

// --- JSON-LD ----------------------------------------------------------------

test("buildJsonLd: Article headline == h1; FAQPage when faq present", () => {
  const blocks = buildJsonLd({
    brand: brandFor("Wine-Now"),
    h1: "Champagne 101",
    lang: "th",
    datePublished: "2026-07-15",
    keywords: "champagne",
    category: "Education",
    faq: [{ q: "A", a: "B" }],
    products: [],
    schemaField: "Article + FAQPage",
    blogUrl: "https://th.wine-now.com/blog",
  });
  const types = blocks.map((b) => b["@type"]);
  assert.deepEqual(types, ["Article", "BreadcrumbList", "FAQPage"]);
  assert.equal(blocks[0].headline, "Champagne 101");
});

// --- full render ------------------------------------------------------------

const ROW = {
  id: "page-1",
  title: "Champagne 101: รู้จักแชมเปญ 🍾 / Champagne 101: Understanding Sparkling Wine",
  site: "Wine-Now",
  type: "Blog",
  category: "Education",
  status: "Review",
  publishDate: "2026-07-15",
  targetKeyword: "champagne คือ",
  wordTarget: 1100,
  key: "Champagne = สปาร์กลิงจากแคว้น Champagne",
  tension: "สปาร์กลิงทุกตัวไม่ใช่ Champagne",
  cta: "อยากได้ฟองที่ใช่? ถามทาง LINE",
  schema: "Article + FAQPage",
  contentTH: "ตอบสั้น ๆ: Champagne ใช้ได้เฉพาะแคว้น Champagne.<br><br>ตระกูลสปาร์กลิง: Champagne, Prosecco, Cava.<br><br>คำถามที่พบบ่อย<br>ถาม: Prosecco กับ Champagne ต่างไหม? ตอบ: ต่างแหล่งและวิธีผลิต.",
};

test("renderArticle produces a compliant, Magento-safe Thai page", () => {
  const expansion = seedExpansion(ROW, { lang: "th" });
  const { cards } = pickProducts(ROW, FEED);
  const model = buildArticleModel(ROW, { brand: brandFor("Wine-Now"), expansion, products: cards, lang: "th" });
  const html = renderArticle(model);

  // No emoji anywhere in the output (plain-text rule).
  assert.ok(!/🍾/.test(html));
  // Compliance + chrome.
  assert.ok(html.includes("ดื่มอย่างมีความรับผิดชอบ · 20+"));
  assert.ok(html.includes('<link rel="stylesheet" href="assets/article.css">'));
  assert.ok(html.includes("Sarabun"));
  assert.ok(html.includes('rel="canonical"'));
  assert.ok(html.includes("สอบถามราคา/สั่งซื้อทาง LINE"));
  // Real SKU card with data-sku + visible chip.
  assert.ok(/data-sku="WSP1140AE"/.test(html));
  assert.ok(/SKU: <b>WSP1140AE<\/b>/.test(html));
  // No on-page exact-final price phrasing — only approximate ~฿.
  assert.ok(html.includes("~฿"));
  // FAQ rendered + mirrored in JSON-LD.
  assert.ok(html.includes('<h2 id="faq">'));
  assert.ok(html.includes('"@type":"FAQPage"'));
  // Article headline matches H1 (no emoji).
  assert.ok(html.includes("<h1>Champagne 101: รู้จักแชมเปญ</h1>"));
  assert.ok(html.includes('"headline":"Champagne 101: รู้จักแชมเปญ"'));
  // Seed render carries the verify-note.
  assert.ok(model.verifyList.some((v) => /SEED RENDER/.test(v)));
});

test("authored expansion files load by Brief ID and have no seed verify-note", async () => {
  const exp = await loadExpansion({ briefId: "JUL-E1" });
  assert.ok(exp, "expected data/expansions/JUL-E1.json to load");
  assert.ok(exp.sections.length >= 5, "hero article should be full-depth");
  assert.ok(exp.table && exp.table.rows.length >= 4);
  assert.ok(exp.faq.length >= 4);
  assert.equal(exp.verifyNotes.length, 0); // authored = not a seed render
});

test("normalizeExpansion coerces a partial object into the canonical shape", () => {
  const e = normalizeExpansion({ summary: "x", sections: [{ h2: "H" }], faq: [{ q: "a", a: "b" }] });
  assert.equal(e.sections[0].paragraphs.length, 0);
  assert.equal(e.table, null);
  assert.deepEqual(e.faq, [{ q: "a", a: "b" }]);
});

test("a full render from an authored expansion is deeper than the seed", async () => {
  const exp = await loadExpansion({ briefId: "JUL-E1" });
  const model = buildArticleModel({ ...ROW, site: "LIQ9", briefId: "JUL-E1" }, {
    brand: brandFor("LIQ9"),
    expansion: exp,
    products: [],
    lang: "th",
  });
  const html = renderArticle(model);
  assert.ok(model.sections.length >= 5);
  assert.ok(html.includes("<table>")); // comparison table rendered
  assert.ok(!model.verifyList.some((v) => /SEED RENDER/.test(v)));
});

test("HowTo JSON-LD is emitted when the Schema field asks for it", () => {
  const blocks = buildJsonLd({
    brand: brandFor("LIQ9"),
    h1: "G&T",
    lang: "th",
    datePublished: "2026-07-16",
    faq: [],
    products: [],
    howto: { name: "ทำ G&T", steps: ["ใส่น้ำแข็ง", "รินจิน", "เติมโทนิก"] },
    schemaField: "Article + HowTo + FAQPage",
    blogUrl: "https://th.liq9.com/blog",
  });
  const howto = blocks.find((b) => b["@type"] === "HowTo");
  assert.ok(howto, "expected a HowTo block");
  assert.equal(howto.step.length, 3);
  assert.equal(howto.step[0]["@type"], "HowToStep");
});

test("HowTo is NOT emitted when the Schema field doesn't ask for it", () => {
  const blocks = buildJsonLd({
    brand: brandFor("LIQ9"),
    h1: "x",
    lang: "th",
    datePublished: "2026-07-16",
    faq: [],
    products: [],
    howto: { name: "x", steps: ["a"] },
    schemaField: "Article + FAQPage",
    blogUrl: "https://th.liq9.com/blog",
  });
  assert.ok(!blocks.some((b) => b["@type"] === "HowTo"));
});

test("ban-day render is secular + non-commercial (no CTA, no product cards)", () => {
  const expansion = seedExpansion(ROW, { lang: "th" });
  const { cards } = pickProducts(ROW, FEED);
  const model = buildArticleModel(ROW, {
    brand: brandFor("Wine-Now"),
    expansion,
    products: cards,
    lang: "th",
    banDays: ["2026-07-15"],
  });
  const html = renderArticle(model);
  assert.equal(model.products.length, 0);
  assert.equal(model.cta, null);
  assert.ok(!/class="product-card"/.test(html));
  assert.ok(model.verifyList.some((v) => /sales-ban day/.test(v)));
});
