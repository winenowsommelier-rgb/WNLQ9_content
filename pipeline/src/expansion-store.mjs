// File-based expansion store: full-depth article bodies authored ahead of time
// (by an editor or an in-the-loop model like Opus) and committed to the repo as
// data/expansions/<BriefID>.json. This is the no-API-key path to full-depth
// output — the expanded body is version-controlled and reviewable in git, and
// takes priority over the runtime LLM call.
//
// File shape mirrors llm.parseExpansion:
//   { dek, summary, sections:[{h2,paragraphs[],list?[],note?}], table?:{head[],rows[][]},
//     faq:[{q,a}], productIntro?, verifyNotes?[] }

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Coerce a raw authored object into the canonical expansion shape. */
export function normalizeExpansion(p = {}) {
  return {
    dek: String(p.dek || ""),
    summary: String(p.summary || ""),
    sections: Array.isArray(p.sections)
      ? p.sections.map((s) => ({
          h2: String(s.h2 || ""),
          paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs.map(String) : [],
          list: Array.isArray(s.list) ? s.list.map(String) : [],
          note: String(s.note || ""),
        }))
      : [],
    table:
      p.table && Array.isArray(p.table.head) && Array.isArray(p.table.rows)
        ? { head: p.table.head.map(String), rows: p.table.rows.map((r) => r.map(String)) }
        : null,
    faq: Array.isArray(p.faq)
      ? p.faq.map((f) => ({ q: String(f.q || ""), a: String(f.a || "") })).filter((f) => f.q && f.a)
      : [],
    howto:
      p.howto && Array.isArray(p.howto.steps)
        ? { name: String(p.howto.name || ""), steps: p.howto.steps.map((s) => (typeof s === "string" ? s : String(s.text || ""))) }
        : null,
    recipe:
      p.recipe && Array.isArray(p.recipe.steps)
        ? {
            name: String(p.recipe.name || ""),
            ingredients: Array.isArray(p.recipe.ingredients) ? p.recipe.ingredients.map(String) : [],
            steps: p.recipe.steps.map((s) => (typeof s === "string" ? s : String(s.text || ""))),
          }
        : null,
    productIntro: String(p.productIntro || ""),
    verifyNotes: Array.isArray(p.verifyNotes) ? p.verifyNotes.map(String) : [],
  };
}

/**
 * Load an authored expansion for a row, keyed by Brief ID (preferred) then page
 * id. Returns null when none exists (caller falls back to LLM, then seed).
 * @param {object} item   normalized Notion item
 * @param {object} [opts] { cwd, dir, lang }
 */
export async function loadExpansion(item, { cwd = process.cwd(), dir, lang = "th" } = {}) {
  const baseDir = dir || join(cwd, "data", "expansions");
  // Allow an EN variant file (<BriefID>.en.json); TH is the default name.
  const suffix = lang && lang !== "th" ? `.${lang}` : "";
  const keys = [item.briefId, item.id].filter(Boolean);
  for (const k of keys) {
    try {
      const raw = await readFile(join(baseDir, `${k}${suffix}.json`), "utf8");
      return normalizeExpansion(JSON.parse(raw));
    } catch {
      /* try next key */
    }
  }
  return null;
}
