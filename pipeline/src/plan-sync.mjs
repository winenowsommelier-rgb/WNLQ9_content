// Map normalized Notion items (from notion.pageToItem) into Supabase
// content_plan rows, and derive a default `product_filter` — the pick_products()
// args — from each row's topic. Pure functions, unit-tested in plan-sync.test.mjs.
//
// product_filter is only a *starting* default: editors can refine it per row
// (e.g. set a price ceiling or a specific grape) and the sync preserves intent
// because it only overwrites the heuristic value on each run. Keys map 1:1 onto
// pick_products(): { grape, styles[], name, food, country, price_min, price_max }.

// Grape tokens (lowercase, EN/known) -> canonical grape (ILIKE'd vs grape_variety).
const GRAPES = [
  ["pinot noir", "Pinot Noir"],
  ["pinot grigio", "Pinot Grigio"],
  ["pinot gris", "Pinot Gris"],
  ["cabernet", "Cabernet"],
  ["chardonnay", "Chardonnay"],
  ["sauvignon blanc", "Sauvignon Blanc"],
  ["merlot", "Merlot"],
  ["shiraz", "Shiraz"],
  ["syrah", "Syrah"],
  ["riesling", "Riesling"],
  ["malbec", "Malbec"],
  ["carménère", "Carmenere"],
  ["carmenere", "Carmenere"],
  ["moscato", "Moscato"],
  ["nebbiolo", "Nebbiolo"],
  ["sangiovese", "Sangiovese"],
  ["tempranillo", "Tempranillo"],
  ["grenache", "Grenache"],
];

// Wine style tokens (EN + TH) -> v_content_products.wine_style values.
const WINE_STYLES = [
  [["sparkling", "champagne", "prosecco", "cava", "สปาร์คกลิง", "แชมเปญ", "โพรเซกโก"], "sparkling"],
  [["rosé", "rose", "โรเซ่"], "rose"],
  [["dessert wine", "sweet wine", "late harvest", "ไวน์หวาน"], "dessert"],
  [["white wine", "white", "ขาว"], "white"],
  [["red wine", "red", "แดง"], "red"],
];

// Spirit tokens (EN + TH) -> v_content_products.spirit_type values.
const SPIRIT_STYLES = [
  [["whisky", "whiskey", "scotch", "bourbon", "single malt", "วิสกี้", "สก็อต", "เบอร์บอน"], "Whisky"],
  [["tequila", "เตกีล่า", "เตกิล่า"], "Tequila"],
  [["gin", "จิน"], "Gin"],
  [["rum", "รัม"], "Rum"],
  [["vodka", "วอดก้า"], "Vodka"],
  [["brandy", "cognac", "บรั่นดี", "คอนญัก", "คอนยัค"], "Brandy"],
  [["sake", "shochu", "สาเก", "โชจู"], "Sake/Shochu"],
  [["liqueur", "aperol", "campari", "ลิเคียว"], "Liqueur"],
];

// Brand-led topics worth pinning by name (matched vs name/brand via ILIKE).
const BRANDS = [
  "Macallan", "Hibiki", "Suntory", "Glenfiddich", "Lagavulin", "Dalmore",
  "Penfolds", "Mondavi", "Torbreck", "Bottega", "Glaetzer", "Cloudy Bay",
];

const hasAny = (text, keys) => keys.some((k) => text.includes(k));

/**
 * Derive default pick_products() args from a plan item's topic.
 * @param {{site?:string,title?:string,targetKeyword?:string,key?:string}} item
 * @returns {object} product_filter
 */
export function buildProductFilter(item = {}) {
  const text = `${item.title || ""} ${item.targetKeyword || ""} ${item.key || ""}`.toLowerCase();
  const filter = {};

  const brand = BRANDS.find((b) => text.includes(b.toLowerCase()));
  if (brand) filter.name = brand;

  if (item.site === "Wine-Now") {
    const grape = GRAPES.find(([token]) => text.includes(token));
    if (grape) {
      filter.grape = grape[1];
    } else {
      const style = WINE_STYLES.find(([keys]) => hasAny(text, keys));
      if (style) filter.styles = [style[1]];
    }
  } else if (item.site === "LIQ9") {
    const style = SPIRIT_STYLES.find(([keys]) => hasAny(text, keys));
    if (style) filter.styles = [style[1]];
  }

  return filter;
}

/** Map a normalized Notion item into a content_plan row. */
export function itemToPlanRow(item, now = new Date()) {
  return {
    notion_page_id: item.id,
    day: item.day ?? null,
    publish_date: item.publishDate ?? null,
    site: item.site ?? null,
    type: item.type ?? null,
    category: item.category ?? null,
    title: item.title ?? null,
    target_keyword: item.targetKeyword ?? null,
    key: item.key ?? null,
    tension: item.tension ?? null,
    story: item.story ?? null,
    cta: item.cta ?? null,
    content_brief: item.contentBrief ?? null,
    funnel: item.funnel ?? null,
    intent: item.intent ?? null,
    schema: item.schema ?? null,
    word_target: item.wordTarget ?? null,
    evergreen: item.evergreen ?? null,
    author: item.author ?? null,
    status: item.status ?? null,
    final_url: item.finalUrl ?? null,
    url: item.driveUrl ?? null,
    product_filter: buildProductFilter(item),
    synced_at: now.toISOString(),
  };
}
