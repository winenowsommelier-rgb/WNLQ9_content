// Shared auth guard for the dashboard API. Fail-closed: every endpoint refuses
// to act unless INGEST_SECRET is configured and the caller presents it.
// (Files prefixed with "_" are not routed as endpoints by Vercel.)

import { timingSafeEqual } from "node:crypto";

function secretsMatch(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * @returns {boolean} true if authorized; otherwise it has already written the
 * 503/401 response and the caller should return.
 */
export function requireSecret(req, res) {
  const expected = process.env.INGEST_SECRET;
  if (!expected) {
    res.status(503).json({ ok: false, error: "Endpoint not configured: set INGEST_SECRET" });
    return false;
  }
  const provided =
    req.headers["x-ingest-secret"] ||
    (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (!provided || !secretsMatch(provided, expected)) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return false;
  }
  return true;
}
