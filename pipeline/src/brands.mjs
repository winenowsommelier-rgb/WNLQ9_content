// Per-brand chrome + canonical config for the article renderer.
//
// Mirrors the hand-authored exemplars in public/content (Wine-Now vs LIQ9):
// brand mark, accent colour, byline persona/avatar, CTA class, footer and the
// catalog deep-link base. Keep these values in lock-step with assets/article.css
// and the CONTENT_PRODUCTION_PLAYBOOK "Brands & chrome" table.

export const BRANDS = {
  "Wine-Now": {
    site: "Wine-Now",
    accent: "#7b1230",
    domain: "https://th.wine-now.com",
    // topbar brand mark
    brandHtml: 'Wine<span class="dot">·</span>Now',
    brandAttr: "",
    navAll: "ไวน์ทั้งหมด",
    navAllHref: "https://th.wine-now.com",
    // hero kicker
    kickerAttr: "",
    // byline
    avClass: "av",
    avText: "WN",
    bylinePersona: "ทีมซอมเมอลิเย่ Wine-Now",
    bylineNote: "คัดสรรและตรวจทานโดยทีมผู้เชี่ยวชาญไวน์ของเรา",
    // schema.org author/publisher
    authorName: "ทีมซอมเมอลิเย่ Wine-Now (Wine-Now Cellar Team)",
    publisher: "Wine-Now",
    // CTA + footer
    ctaClass: "cta",
    ctaAllHref: "https://th.wine-now.com",
    ctaAllLabel: "ดูไวน์ทั้งหมด",
    footerName: "Wine-Now",
    footerHost: "th.wine-now.com",
    // product card deep-link base (catalogsearch ?q=)
    catalogQ: "https://th.wine-now.com/catalogsearch/result/?q=",
  },
  LIQ9: {
    site: "LIQ9",
    accent: "#143a4a",
    domain: "https://th.liq9.com",
    brandHtml: 'LIQ<span class="dot" style="color:#143a4a">9</span>',
    brandAttr: ' style="color:#143a4a"',
    navAll: "สุราทั้งหมด",
    navAllHref: "https://th.liq9.com",
    kickerAttr: ' style="color:#143a4a;background:#e7f0f4"',
    avClass: "av liq",
    avText: "L9",
    bylinePersona: "ทีมบาร์เทนเดอร์ LIQ9",
    bylineNote: "เขียนและตรวจทานโดยทีมผู้เชี่ยวชาญสุราของเรา",
    authorName: "LIQ9 Bartender Desk",
    publisher: "LIQ9",
    ctaClass: "cta liq",
    ctaAllHref: "https://th.liq9.com",
    ctaAllLabel: "ดูสุราทั้งหมด",
    footerName: "LIQ9",
    footerHost: "th.liq9.com",
    catalogQ: "https://th.liq9.com/catalogsearch/result/?q=",
  },
};

/** Resolve a brand config by Site value; defaults to Wine-Now. */
export function brandFor(site) {
  return BRANDS[site] || BRANDS["Wine-Now"];
}
