// GET/POST /api/sync-plan
// Pull the live Notion content plan and mirror it into Supabase content_plan
// (upsert by notion_page_id), deriving a default product_filter per row.
//
// The Notion database query returns only current (non-archived) rows, so
// deleted plan rows drop out automatically — no stale data.
//
// Runs daily via Vercel Cron (see vercel.json). Auth accepts EITHER the Vercel
// cron header (Authorization: Bearer $CRON_SECRET) OR the dashboard INGEST_SECRET
// (x-ingest-secret / Bearer) for manual runs. Fail-closed.

import { timingSafeEqual } from "node:crypto";
import { createClient } from "../src/notion.mjs";
import { createSupabase } from "../src/supabase.mjs";
import { itemToPlanRow } from "../src/plan-sync.mjs";
import { getConfig } from "../src/config.mjs";

function eq(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function authorized(req, cfg) {
  const bearer = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (cfg.cronSecret && bearer && eq(bearer, cfg.cronSecret)) return true;
  const provided = req.headers["x-ingest-secret"] || bearer;
  if (cfg.ingestSecret && provided && eq(provided, cfg.ingestSecret)) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  const cfg = getConfig();
  if (!cfg.cronSecret && !cfg.ingestSecret) {
    res.status(503).json({ ok: false, error: "Endpoint not configured: set CRON_SECRET or INGEST_SECRET" });
    return;
  }
  if (!authorized(req, cfg)) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const items = await createClient(cfg).listItems({}); // full live plan
    const rows = items.map((it) => itemToPlanRow(it));
    const saved = await createSupabase(cfg).upsert("content_plan", rows, "notion_page_id");
    res.status(200).json({
      ok: true,
      synced: rows.length,
      upserted: Array.isArray(saved) ? saved.length : null,
      at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
