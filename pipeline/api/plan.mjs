// GET /api/plan?from=1&to=7&site=Wine-Now&picks=4
// Returns content_plan rows in the Day range, each with its top in-stock product
// picks attached — joined at query time via the plan_with_picks() RPC.
//
//   ?from / ?to   inclusive Day bounds (omit for the whole plan)
//   ?site         "Wine-Now" | "LIQ9"
//   ?picks        suggestions per row (default 4)

import { createSupabase } from "../src/supabase.mjs";
import { requireSecret } from "./_auth.mjs";

const num = (v, fallback) => (v === undefined || v === "" ? fallback : Number(v));

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireSecret(req, res)) return;

  try {
    const q = req.query || {};
    const rows = await createSupabase().rpc("plan_with_picks", {
      p_day_from: num(q.from, null),
      p_day_to: num(q.to, null),
      p_site: q.site || null,
      p_picks: num(q.picks, 4),
    });
    res.status(200).json({ ok: true, count: Array.isArray(rows) ? rows.length : 0, rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
