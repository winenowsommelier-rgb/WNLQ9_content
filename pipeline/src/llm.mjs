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
