import type { Brand } from "./types";

export interface BrandConfig {
  id: Brand;
  name: string;
  focus: string;
  color: string;
  colorDark: string;
  altBg: string;
  siteUrl: string;
  lineHandle: string;
  emoji: string;
}

export const BRANDS: Record<Brand, BrandConfig> = {
  "wine-now": {
    id: "wine-now",
    name: "Wine-Now",
    focus: "Wine",
    color: "#8b0000",
    colorDark: "#6d0000",
    altBg: "#f9f6f2",
    siteUrl: "https://th.wine-now.com/",
    lineHandle: "@wine-now",
    emoji: "🍷",
  },
  liq9: {
    id: "liq9",
    name: "LIQ9",
    focus: "Whisky, Liquor, Spirits, Cocktails",
    color: "#1b1464",
    colorDark: "#110d42",
    altBg: "#f4f5fa",
    siteUrl: "https://th.liq9.com/",
    lineHandle: "@liq9",
    emoji: "🥃",
  },
};

export const BRAND_LIST: BrandConfig[] = Object.values(BRANDS);

export function brandFor(id: Brand): BrandConfig {
  return BRANDS[id];
}

/** Heuristic: decide which brand a GA page / GSC query most likely belongs to. */
const WINE_HINTS = [
  "wine",
  "rosé",
  "rose",
  "champagne",
  "cabernet",
  "merlot",
  "pinot",
  "chardonnay",
  "sauvignon",
  "riesling",
  "prosecco",
  "bordeaux",
  "burgundy",
  "ไวน์",
];
const LIQ_HINTS = [
  "whisky",
  "whiskey",
  "gin",
  "vodka",
  "rum",
  "tequila",
  "cognac",
  "brandy",
  "cocktail",
  "spirit",
  "sake",
  "liqueur",
  "เหล้า",
  "วิสกี้",
  "ค็อกเทล",
];

export function guessBrand(text: string): Brand {
  const t = text.toLowerCase();
  const wine = WINE_HINTS.filter((h) => t.includes(h)).length;
  const liq = LIQ_HINTS.filter((h) => t.includes(h)).length;
  return liq > wine ? "liq9" : "wine-now";
}
