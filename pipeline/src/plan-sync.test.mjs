import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProductFilter, itemToPlanRow } from "./plan-sync.mjs";

test("Wine-Now grape topic -> grape filter", () => {
  assert.deepEqual(
    buildProductFilter({ site: "Wine-Now", title: "Pinot Noir 101: ไวน์แดงเบา", targetKeyword: "pinot noir คือ" }),
    { grape: "Pinot Noir" },
  );
  assert.deepEqual(
    buildProductFilter({ site: "Wine-Now", title: "Cabernet Sauvignon 101", targetKeyword: "cabernet sauvignon คือ" }),
    { grape: "Cabernet" },
  );
});

test("Wine-Now style topic (no grape) -> wine_style filter", () => {
  assert.deepEqual(
    buildProductFilter({ site: "Wine-Now", title: "Champagne vs Prosecco vs Cava", targetKeyword: "champagne vs prosecco" }),
    { styles: ["sparkling"] },
  );
  assert.deepEqual(
    buildProductFilter({ site: "Wine-Now", title: "White Wines for Summer", targetKeyword: "white wine summer" }),
    { styles: ["white"] },
  );
});

test("LIQ9 spirit topic -> spirit_type filter", () => {
  assert.deepEqual(
    buildProductFilter({ site: "LIQ9", title: "Whisky 101: Scotch vs Bourbon", targetKeyword: "whisky scotch bourbon" }),
    { styles: ["Whisky"] },
  );
  assert.deepEqual(
    buildProductFilter({ site: "LIQ9", title: "Buy Gin Online Thailand", targetKeyword: "buy gin online" }),
    { styles: ["Gin"] },
  );
});

test("brand-led topic pins name (name alone narrows the picks)", () => {
  // No whisky token in the title/keyword, so name is enough — pick_products
  // already narrows to Macallan bottles; an explicit style would be redundant.
  assert.deepEqual(
    buildProductFilter({ site: "LIQ9", title: "Macallan คู่มือ: รุ่นไหนน่าดื่ม", targetKeyword: "macallan รุ่น" }),
    { name: "Macallan" },
  );
  // When a topic does name the spirit, both pin and style apply.
  assert.deepEqual(
    buildProductFilter({ site: "LIQ9", title: "Glenfiddich vs other Scotch whisky", targetKeyword: "glenfiddich scotch" }),
    { name: "Glenfiddich", styles: ["Whisky"] },
  );
});

test("unmatched topic -> empty filter (falls back to site-only picks)", () => {
  assert.deepEqual(
    buildProductFilter({ site: "Wine-Now", title: "ภาษีสรรพสามิต 2026", targetKeyword: "ภาษีไวน์ 2026" }),
    {},
  );
});

test("itemToPlanRow maps Notion item -> content_plan columns", () => {
  const row = itemToPlanRow(
    {
      id: "page-1",
      day: 7,
      publishDate: "2026-06-07",
      site: "Wine-Now",
      type: "Blog",
      category: "Education",
      title: "Cabernet Sauvignon 101",
      targetKeyword: "cabernet sauvignon คือ",
      key: "grape pillar",
      contentBrief: "brief",
      funnel: "TOFU",
      intent: "Informational",
      schema: "Article + FAQPage",
      wordTarget: 1200,
      evergreen: "Evergreen",
      author: "Wine-Now Sommelier Desk",
      status: "Review",
      finalUrl: null,
      driveUrl: null,
    },
    new Date("2026-06-02T00:00:00Z"),
  );
  assert.equal(row.notion_page_id, "page-1");
  assert.equal(row.day, 7);
  assert.equal(row.word_target, 1200);
  assert.equal(row.author, "Wine-Now Sommelier Desk");
  assert.deepEqual(row.product_filter, { grape: "Cabernet" });
  assert.equal(row.synced_at, "2026-06-02T00:00:00.000Z");
});
