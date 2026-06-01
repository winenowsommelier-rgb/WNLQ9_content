// POST /api/generate { pageId } -> draft Content EN + TH, move row to Review.
//
// Additional env: ANTHROPIC_API_KEY (optional ANTHROPIC_MODEL).

import { createClient } from "../../src/notion.mjs";
import { generateDrafts } from "../../src/pipeline.mjs";
import { requireSecret } from "./_auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireSecret(req, res)) return;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    if (!body.pageId) {
      res.status(400).json({ ok: false, error: "pageId is required" });
      return;
    }
    const result = await generateDrafts(body.pageId, { notion: createClient() });
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
