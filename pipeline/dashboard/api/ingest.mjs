// Vercel serverless function: POST a brief (JSON) -> create a Notion content row.
//
// Deploy target: a Vercel project rooted at pipeline/dashboard.
// Required env var in Vercel: NOTION_TOKEN  (optional: NOTION_DATABASE_ID).
//
// The handler reuses the shared ingest core so the Dashboard and the CLI behave
// identically.

import { ingestBrief } from "../../src/ingest.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    // Vercel parses JSON bodies automatically; fall back for raw bodies.
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
