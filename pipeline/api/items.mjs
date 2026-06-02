// GET /api/items -> content rows from Notion, normalized for the dashboard.
// Optional filters (server-side, so we only fetch the rows we need):
//   ?day=2            exact Day
//   ?dayFrom=1&dayTo=7  inclusive Day range (e.g. week 1)
//   ?site=Wine-Now    "Wine-Now" | "LIQ9"
//   ?status=Review    Status select value
// No filters -> all rows, sorted by Day ascending.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "../src/notion.mjs";
import { requireSecret } from "./_auth.mjs";

const num = (v) => (v === undefined || v === "" ? undefined : Number(v));

// pageId -> full-HTML file manifest (same source /api/approve uploads from).
// Lets the dashboard know a row can be approved straight to Drive even when it
// has no generated EN/TH drafts.
async function loadManifest() {
  try {
    const raw = await readFile(join(process.cwd(), "data", "articles.json"), "utf8");
    return JSON.parse(raw)?.articles || {};
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireSecret(req, res)) return;

  try {
    const q = req.query || {};
    const [items, manifest] = await Promise.all([
      createClient().listItems({
        day: num(q.day),
        dayFrom: num(q.dayFrom),
        dayTo: num(q.dayTo),
        site: q.site || undefined,
        status: q.status || undefined,
      }),
      loadManifest(),
    ]);
    // hasHtml = a self-contained article file exists for this row, so it can be
    // approved → Drive without generated drafts.
    for (const it of items) it.hasHtml = Boolean(manifest[it.id]);
    res.status(200).json({ ok: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
