// Vercel serverless function: POST a brief (JSON) -> create a Notion content row.
//
// Required env: NOTION_TOKEN, INGEST_SECRET.  Optional: NOTION_DATABASE_ID.

import { ingestBrief } from "../../src/ingest.mjs";
import { requireSecret } from "./_auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireSecret(req, res)) return;

  try {
    const brief =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const skipExisting = req.query?.skipExisting !== "false"; // default on
    const result = await ingestBrief(brief, { skipExisting });

    if (result.status === "invalid") {
      res.status(400).json({ ok: false, ...result });
      return;
    }
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
