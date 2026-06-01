// GET /api/items -> all content rows from Notion, normalized for the dashboard.

import { createClient } from "../../src/notion.mjs";
import { requireSecret } from "./_auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireSecret(req, res)) return;

  try {
    const items = await createClient().listItems();
    res.status(200).json({ ok: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
