// Draft Content EN + Content TH from a brief, using the Anthropic API.
// Dependency-free (native fetch). Requires ANTHROPIC_API_KEY.

import { getConfig } from "./config.mjs";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export class LLMError extends Error {
  constructor(message) {
    super(message);
    this.name = "LLMError";
  }
}

// Stable system prompt — marked cacheable so repeated drafts are cheaper.
const SYSTEM_PROMPT = `You are the senior bilingual content writer for two Thai drinks brands:
- Wine-Now (wine e-commerce, sommelier voice)
- LIQ9 (spirits e-commerce, knowledgeable bartender voice)

You write SEO-aware editorial that is accurate, vivid, and never fluffy.
For each brief you produce TWO versions of the SAME article:
- "en": natural, idiomatic English
- "th": natural Thai (ภาษาไทยที่เป็นธรรมชาติ) — a localization, not a literal translation

Rules:
- Lead with the hook; resolve the brief's TENSION; honor the STORY and CTA.
- Weave the target keyword in naturally (title, intro, one subhead). No stuffing.
- Use short paragraphs and 2-4 subheads (markdown ## ). 500-900 words each.
- Respond with ONE JSON object only, no prose, no code fences:
  {"en": "<markdown>", "th": "<markdown>"}`;

function buildUserPrompt(brief) {
  const lines = [
    `SITE: ${brief.site || "Wine-Now"}`,
    `TYPE: ${brief.type || "Blog"}`,
    `CATEGORY: ${brief.category || ""}`,
    `TITLE: ${brief.title || ""}`,
    `TARGET KEYWORD: ${brief.targetKeyword || ""}`,
    `BRIEF: ${brief.contentBrief || ""}`,
    `STORY: ${brief.story || ""}`,
    `TENSION: ${brief.tension || ""}`,
    `CTA: ${brief.cta || ""}`,
  ];
  return lines.join("\n");
}

/** Extract the {en, th} JSON object from a model text response, tolerating fences. */
export function parseDraftResponse(text) {
  let raw = String(text).trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new LLMError("No JSON object in LLM response");
  let parsed;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new LLMError("LLM response was not valid JSON");
  }
  if (!parsed.en || !parsed.th) throw new LLMError("LLM response missing 'en' or 'th'");
  return { contentEN: String(parsed.en), contentTH: String(parsed.th) };
}

/**
 * @returns {Promise<{contentEN: string, contentTH: string}>}
 */
export async function draftContent(brief, { config = getConfig(), fetchImpl = fetch } = {}) {
  if (!config.anthropicKey) throw new LLMError("Missing ANTHROPIC_API_KEY");

  const res = await fetchImpl(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": config.anthropicKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.anthropicModel,
      max_tokens: 4096,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: buildUserPrompt(brief) }],
    }),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new LLMError(data?.error?.message || `Anthropic API ${res.status}`);

  const out = (data.content || []).map((b) => b.text || "").join("");
  return parseDraftResponse(out);
}

export { buildUserPrompt, SYSTEM_PROMPT };

// --- Full-depth article expansion (Notion seed -> Whisky-101-v2-depth body) --

// Encodes the non-negotiables from the Editorial Standard / playbook. The model
// returns STRUCTURED content (arrays of plain text) — the renderer owns all HTML
// — so it cannot inject markup, and emoji/compliance are enforced downstream.
const EXPAND_SYSTEM = `You are the senior Thai content writer for two Thai drinks brands:
- Wine-Now (wine, sommelier voice) · LIQ9 (spirits, knowledgeable bartender voice).
You EXPAND a short authored seed into a full, ready-to-publish THAI article at
"Whisky 101 v2" depth, hitting the Word Target.

HARD RULES (never break):
- THAI ONLY prose. English keywords inline (e.g. "tannin", "Bourbon") are fine.
- NO FABRICATED FACTS: never invent tax rates, prices, critic scores, vineyard
  names/hours, ABV/PPM, or "#NN bestseller" ranks. If a hard number is needed,
  write around it and insert a literal marker "[VERIFY: what to check]".
- Thai alcohol compliance: NO on-page price; order/enquire via LINE; audience 20+.
  Never name or promote a sale/discount event.
- Honor the brief's KEY/STORY/TENSION and CTA. Weave the target keyword naturally.
- Plain text only — NO emoji, NO markdown headers, NO HTML tags. Use **bold** only
  for inline emphasis inside paragraph/list strings.
- If a Buddhist sales-ban day is indicated, stay secular and non-commercial with
  NO religious reference.

Respond with ONE JSON object only (no prose, no code fences):
{
  "dek": "1-2 sentence hook (Thai)",
  "summary": "สรุปสั้นๆ callout text (Thai, 1-3 sentences)",
  "sections": [{"h2":"Thai heading","paragraphs":["..."],"list":["..."],"note":""}],
  "table": {"head":["..."],"rows":[["..."]]} | null,
  "faq": [{"q":"Thai question","a":"Thai answer"}],
  "productIntro": "1-2 sentence Thai lead-in to the product picks"
}
Aim for 4-6 sections of genuine teaching, >=1 comparison table where it helps, and
a 4-6 item FAQ.`;

function buildExpandPrompt(item, products = []) {
  const picks = products.length
    ? products.map((p) => `- ${p.name} (SKU ${p.sku})`).join("\n")
    : "(no matching in-stock products — do not invent any; the page will route to LINE)";
  return [
    `SITE: ${item.site || ""}`,
    `TYPE: ${item.type || "Blog"}`,
    `CATEGORY: ${item.category || ""}`,
    `TITLE: ${item.title || ""}`,
    `TARGET KEYWORD: ${item.targetKeyword || ""}`,
    `WORD TARGET: ${item.wordTarget || 1000}`,
    `KEY: ${item.key || ""}`,
    `STORY: ${item.story || ""}`,
    `TENSION: ${item.tension || ""}`,
    `CTA: ${item.cta || ""}`,
    `SCHEMA: ${item.schema || ""}`,
    `AUTHORED SEED (Thai, expand & deepen — do not just copy):\n${item.contentTH || ""}`,
    `IN-STOCK PRODUCT PICKS (reference by name in productIntro; never add others):\n${picks}`,
  ].join("\n");
}

/** Parse + minimally validate the expansion JSON. */
export function parseExpansion(text) {
  let raw = String(text).trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new LLMError("No JSON object in expansion response");
  let p;
  try {
    p = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new LLMError("Expansion response was not valid JSON");
  }
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
    productIntro: String(p.productIntro || ""),
    verifyNotes: [],
  };
}

/**
 * Expand a Notion row into a full-depth article body via the Anthropic API.
 * @returns {Promise<object>} expansion (see article-model)
 */
export async function expandArticle(item, { products = [], config = getConfig(), fetchImpl = fetch } = {}) {
  if (!config.anthropicKey) throw new LLMError("Missing ANTHROPIC_API_KEY");

  const res = await fetchImpl(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": config.anthropicKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.anthropicModel,
      max_tokens: 8192,
      system: [{ type: "text", text: EXPAND_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildExpandPrompt(item, products) }],
    }),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new LLMError(data?.error?.message || `Anthropic API ${res.status}`);

  const out = (data.content || []).map((b) => b.text || "").join("");
  return parseExpansion(out);
}

export { buildExpandPrompt, EXPAND_SYSTEM };
