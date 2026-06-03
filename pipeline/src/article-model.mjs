// Build the structured "article model" a Notion row + its expansion + product
// picks resolve to. The model is the single input to render-article.mjs, so all
// content decisions (title split, emoji strip, slug, JSON-LD, compliance,
// verify-list) live here and are unit-testable without producing HTML.

import { slugify } from "./validate.mjs";

// --- Text helpers -----------------------------------------------------------

// Emoji + pictographs + variation selectors + ZWJ. PUBLISHED text must be plain
// (Magento renders emoji inconsistently), so we strip them everywhere.
const EMOJI_RE =
  /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2122}\u{2139}]/gu;

/** Remove emoji/pictographs and collapse the whitespace they leave behind. */
export function stripEmoji(text) {
  return String(text ?? "")
    .replace(EMOJI_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Split a bilingual "ไทย / English" title into its two native halves. Splits on
 * the first " / " separator only (so slashes inside either half survive).
 */
export function splitBilingualTitle(title) {
  const s = String(title ?? "").trim();
  const i = s.indexOf(" / ");
  if (i === -1) return { th: s, en: "" };
  return { th: s.slice(0, i).trim(), en: s.slice(i + 3).trim() };
}

/** Derive a url-safe slug, preferring the EN title, then keyword, then TH. */
export function deriveSlug(item, { en, th } = {}) {
  if (item.slug) return slugify(item.slug);
  const basis = en || item.targetKeyword || th || item.title || "";
  // Keep ascii words/numbers — Thai-only basis falls back to the keyword.
  const ascii = basis.replace(/[^\x00-\x7F]+/g, " ").trim();
  return slugify(ascii || item.targetKeyword || item.briefId || "article");
}

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** Format an ISO date as Thai "15 ก.ค. 2026" (Buddhist-era omitted by house style). */
export function formatThaiDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${THAI_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** ISO yyyy-mm-dd (date only) from an ISO date/datetime. */
export function isoDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** Estimate reading minutes from word target or rendered text length. */
export function readingMinutes({ wordTarget, charCount } = {}) {
  if (Number.isFinite(Number(wordTarget)) && Number(wordTarget) > 0) {
    return Math.max(3, Math.round(Number(wordTarget) / 200));
  }
  if (charCount) return Math.max(2, Math.round(charCount / 350));
  return 4;
}

// --- Seed parsing (offline fallback) ---------------------------------------

const BR_SPLIT = /(?:<br\s*\/?>\s*){2,}/i;
const ONE_BR = /<br\s*\/?>/gi;

/**
 * Parse an authored Content TH/EN field (plain text with <br><br> paragraph
 * breaks + an inline FAQ block) into paragraphs + faq. Used by the offline seed
 * expansion so a dry-run renders real authored copy when no LLM is available.
 */
export function parseSeedContent(text) {
  const blocks = String(text ?? "")
    .split(BR_SPLIT)
    .map((b) => b.replace(ONE_BR, "\n").trim())
    .filter(Boolean);

  const paragraphs = [];
  const faq = [];
  let inFaq = false;

  for (const block of blocks) {
    if (/^(คำถามที่พบบ่อย|faq)\b/i.test(block.trim())) {
      inFaq = true;
      const rest = block.replace(/^(คำถามที่พบบ่อย|faq)\s*/i, "").trim();
      if (rest) collectQa(rest, faq);
      continue;
    }
    if (inFaq || /(^|\n)\s*(ถาม:|q:)/i.test(block)) {
      inFaq = true;
      collectQa(block, faq);
      continue;
    }
    paragraphs.push(block.replace(/\n+/g, " ").trim());
  }
  return { paragraphs, faq };
}

function collectQa(block, faq) {
  // Q/A pairs on separate lines: "ถาม: ... ตอบ: ..." or "Q: ... A: ...".
  const re = /(?:ถาม:|q:)\s*([\s\S]*?)\s*(?:ตอบ:|a:)\s*([\s\S]*?)(?=(?:ถาม:|q:)|$)/gi;
  let m;
  while ((m = re.exec(block)) !== null) {
    const q = m[1].replace(/\s+/g, " ").trim();
    const a = m[2].replace(/\s+/g, " ").trim();
    if (q && a) faq.push({ q, a });
  }
}

// --- JSON-LD ----------------------------------------------------------------

/**
 * Build the JSON-LD blocks. Article + BreadcrumbList are always present
 * (playbook requirement); FAQPage is added when there are FAQ items; ItemList
 * when the row's Schema field asks for it (or products exist). The Article
 * headline is ALWAYS the on-page H1 — no overpromising.
 */
export function buildJsonLd({ brand, h1, lang, datePublished, keywords, category, faq, products, howto, schemaField, blogUrl }) {
  const wants = (token) => new RegExp(token, "i").test(String(schemaField || ""));
  const blocks = [];

  blocks.push({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: h1,
    inLanguage: lang,
    datePublished,
    dateModified: datePublished,
    author: { "@type": "Organization", name: brand.authorName, url: brand.domain },
    publisher: { "@type": "Organization", name: brand.publisher, url: brand.domain },
    ...(keywords ? { keywords } : {}),
  });

  blocks.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: brand.domain },
      { "@type": "ListItem", position: 2, name: "บทความ", item: blogUrl },
      { "@type": "ListItem", position: 3, name: h1 },
    ],
  });

  if (faq && faq.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  if (howto && howto.steps && howto.steps.length && wants("howto")) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: howto.name || h1,
      step: howto.steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        text: typeof s === "string" ? s : s.text || "",
      })),
    });
  }

  if (products && products.length && (wants("itemlist") || wants("product"))) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
      })),
    });
  }

  return blocks;
}

// --- Assemble ---------------------------------------------------------------

/**
 * @param {object} item        normalized Notion item
 * @param {object} opts
 * @param {object} opts.brand  brand config (brands.brandFor)
 * @param {object} opts.expansion {dek, summary, sections[], table?, faq[], productIntro?, verifyNotes?}
 * @param {object[]} opts.products  product cards (products.pickProducts)
 * @param {string} [opts.lang='th']
 * @param {string[]} [opts.banDays] ISO dates that are Buddhist alcohol sales-ban days
 * @returns {object} article model
 */
export function buildArticleModel(item, { brand, expansion, products = [], lang = "th", banDays = [] } = {}) {
  const verifyList = [...(expansion?.verifyNotes || [])];
  const { th, en } = splitBilingualTitle(item.title);
  const headline = stripEmoji(lang === "en" && en ? en : th);
  const slug = deriveSlug(item, { en, th });
  const blogUrl = `${brand.domain}/blog`;
  const canonical = `${blogUrl}/${slug}.html`;
  const ogImage = `${brand.domain}/blog/og/${slug}.jpg`;
  const datePublished = isoDate(item.publishDate) || isoDate(new Date().toISOString());

  // Buddhist sales-ban day: secular + non-commercial, no religious reference.
  // We can't ship a hardcoded religious calendar (dates shift yearly) — flag it.
  const onBanDay = banDays.includes(isoDate(item.publishDate));
  if (onBanDay) {
    verifyList.push(
      `Publish Date ${isoDate(item.publishDate)} flagged as a sales-ban day — ` +
        `rendered secular/non-commercial (CTA & price suppressed). VERIFY the ban-day calendar.`,
    );
  }

  const faq = (expansion?.faq || []).map((f) => ({
    q: stripEmoji(f.q),
    a: stripEmoji(f.a),
  }));

  // Optional HowTo (for cocktail/recipe rows whose Schema asks for it).
  const howtoModel = expansion?.howto
    ? {
        name: stripEmoji(expansion.howto.name || ""),
        steps: (expansion.howto.steps || [])
          .map((s) => stripEmoji(typeof s === "string" ? s : s.text || ""))
          .filter(Boolean),
      }
    : null;

  const sections = (expansion?.sections || []).map((s) => ({
    h2: stripEmoji(s.h2 || ""),
    paragraphs: (s.paragraphs || []).map(stripEmoji).filter(Boolean),
    list: (s.list || []).map(stripEmoji).filter(Boolean),
    note: s.note ? stripEmoji(s.note) : "",
  }));

  // On a ban day we suppress commercial CTA + product cards entirely.
  const showCommerce = !onBanDay;
  const cards = showCommerce ? products : [];

  // Verify-list: surface any [VERIFY] markers left in the body.
  for (const s of sections) {
    for (const p of [...s.paragraphs, ...s.list, s.note]) {
      if (/\[VERIFY[^\]]*\]/i.test(p)) verifyList.push(`Unresolved [VERIFY] in "${s.h2}": ${p.slice(0, 80)}…`);
    }
  }

  return {
    site: brand.site,
    brand,
    lang,
    slug,
    canonical,
    ogImage,
    blogUrl,
    titleTh: th,
    titleEn: en,
    h1: headline,
    // <title> may be longer/SEO-tuned; headline (Article + H1) stays in lock-step.
    pageTitle: `${headline} | ${brand.publisher}`,
    description: stripEmoji(expansion?.dek || item.key || headline),
    kicker: stripEmoji([item.type, item.category].filter(Boolean).join(" · ")),
    dek: stripEmoji(expansion?.dek || item.tension || ""),
    summary: stripEmoji(expansion?.summary || ""),
    meta: {
      dateText: formatThaiDate(item.publishDate),
      readText: `~${readingMinutes({ wordTarget: item.wordTarget })} นาที`,
      categoryText: [item.category, item.type ? `(${item.type})` : ""].filter(Boolean).join(" "),
    },
    sections,
    table: expansion?.table || null,
    faq,
    productIntro: showCommerce ? stripEmoji(expansion?.productIntro || "") : "",
    products: cards,
    cta: showCommerce
      ? { heading: stripEmoji(deriveCtaHeading(item)), body: stripEmoji(item.cta || "") }
      : null,
    onBanDay,
    datePublished,
    keywords: item.targetKeyword || "",
    jsonld: buildJsonLd({
      brand,
      h1: headline,
      lang,
      datePublished,
      keywords: item.targetKeyword || "",
      category: item.category,
      faq,
      products: cards,
      howto: howtoModel,
      schemaField: item.schema,
      blogUrl,
    }),
    verifyList,
  };
}

function deriveCtaHeading(item) {
  return item.site === "LIQ9" ? "อยากได้คำแนะนำเพิ่ม?" : "อยากได้คำแนะนำเพิ่ม?";
}
