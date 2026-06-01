// Vercel serverless function: POST a brief (JSON) -> create a Notion content row.
//
// Deploy target: a Vercel project rooted at pipeline/dashboard.
// Required env vars in Vercel:
//   NOTION_TOKEN    Notion integration secret (server-side only)
//   INGEST_SECRET   shared secret that callers must present (fail-closed)
// Optional: NOTION_DATABASE_ID
//
// The handler reuses the shared ingest core so the Dashboard and the CLI behave
// identically.

import { timingSafeEqual } from "node:crypto";
import { ingestBrief } from "../../src/ingest.mjs";

// Constant-time comparison that also tolerates differing lengths.
function secretsMatch(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  // Fail closed: without a configured secret the endpoint refuses to write,
  // so an unprotected deploy can't be abused to spam the production database.
  const expected = process.env.INGEST_SECRET;
  if (!expected) {
    res.status(503).json({ ok: false, error: "Endpoint not configured: set INGEST_SECRET" });
    return;
  }

  const provided =
    req.headers["x-ingest-secret"] ||
    (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (!provided || !secretsMatch(provided, expected)) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
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
