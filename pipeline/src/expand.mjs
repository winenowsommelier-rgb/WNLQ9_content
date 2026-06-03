// Offline "seed" expansion: turn an authored Notion row (plain-text Content
// TH/EN with <br><br> paragraph breaks + an inline FAQ) into the expansion shape
// the article model expects — WITHOUT calling an LLM. This lets a dry-run render
// real authored copy when ANTHROPIC_API_KEY is absent.
//
// It deliberately does NOT invent the missing depth (extra teaching sections,
// comparison table, expanded FAQ) — that is the LLM's job (llm.expandArticle).
// Instead it carries a loud verify-note so a seed render is never mistaken for a
// finished, Word-Target-depth article.

import { parseSeedContent, splitBilingualTitle } from "./article-model.mjs";

/**
 * @param {object} item   normalized Notion item
 * @param {object} [opts]
 * @param {string} [opts.lang='th']
 * @returns {object} expansion {dek, summary, sections[], table, faq[], productIntro, verifyNotes[]}
 */
export function seedExpansion(item, { lang = "th" } = {}) {
  const source = lang === "en" ? item.contentEN : item.contentTH;
  const { paragraphs, faq } = parseSeedContent(source);
  const { th } = splitBilingualTitle(item.title);

  const summary = item.key || paragraphs[0] || "";
  const dek = item.tension || paragraphs[0] || "";
  const sectionParas = paragraphs.length > 1 ? paragraphs.slice(1) : paragraphs;

  const sections = sectionParas.length
    ? [{ h2: sectionHeading(item, th), paragraphs: sectionParas, list: [], note: "" }]
    : [];

  return {
    dek,
    summary,
    sections,
    table: null,
    faq,
    productIntro: "",
    verifyNotes: [
      "SEED RENDER — body is the authored Notion seed, NOT expanded to Word-Target " +
        "depth. Run with ANTHROPIC_API_KEY (llm.expandArticle) for the full " +
        "Whisky-101-v2-depth article before publishing.",
    ],
  };
}

function sectionHeading(item, th) {
  const map = {
    Education: "ทำความเข้าใจแบบเร็ว ๆ",
    Pairing: "จับคู่ให้อร่อย",
    Travel: "ไกด์ฉบับย่อ",
    Tips: "เคล็ดลับที่ใช้ได้จริง",
    Spotlights: "ไฮไลต์ที่ควรรู้",
  };
  return map[item.category] || "รายละเอียด";
}
