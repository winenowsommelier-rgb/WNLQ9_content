// GET /api/items -> content rows from Notion, normalized for the dashboard.
// Optional filters (server-side, so we only fetch the rows we need):
//   ?day=2            exact Day
//   ?dayFrom=1&dayTo=7  inclusive Day range (e.g. week 1)
//   ?site=Wine-Now    "Wine-Now" | "LIQ9"
//   ?status=Review    Status select value
// No filters -> all rows, sorted by Day ascending.

import { createClient } from "../src/notion.mjs";
import { requireSecret } from "./_auth.mjs";

const num = (v) => (v === undefined || v === "" ? undefined : Number(v));

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireSecret(req, res)) return;

  try {
    const q = req.query || {};
    const items = await createClient().listItems({
      day: num(q.day),
      dayFrom: num(q.dayFrom),
      dayTo: num(q.dayTo),
      site: q.site || undefined,
      status: q.status || undefined,
    });
    res.status(200).json({ ok: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
