// GET /api/log?pageId=... -> activity log (Notion page comments), oldest first.

import { createClient } from "../../src/notion.mjs";
import { requireSecret } from "./_auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireSecret(req, res)) return;

  const pageId = req.query?.pageId;
  if (!pageId) {
    res.status(400).json({ ok: false, error: "pageId is required" });
    return;
  }

  try {
    const log = await createClient().getLog(pageId);
    res.status(200).json({ ok: true, log });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
