// GA4 (Data API) + Google Search Console (Search Analytics) pull, plus the pure
// join helpers that turn both into one per-URL record set (merged.json) for
// scoring. Dependency-free: auth via google-auth.mjs, requests via fetch.
//
// GA4 gives demand-side engagement (screenPageViews, sessions, engagedSessions,
// conversions); GSC gives search-side signal per page (clicks, impressions,
// ctr, position) and per query (for keyword mining). We key everything on the
// canonical live URL so it joins 1:1 onto the Notion board's `Final URL`.
import { createGoogleAuth, GA4_SCOPE, GSC_SCOPE } from "./google-auth.mjs";
import { getConfig } from "./config.mjs";

const GA4_DATA_BASE = "https://analyticsdata.googleapis.com/v1beta";
const GSC_BASE = "https://www.googleapis.com/webmasters/v3";

export class GaGscError extends Error {
  constructor(message) {
    super(message);
    this.name = "GaGscError";
  }
}

// --- Pure helpers (unit-tested) -------------------------------------------

/** Strip protocol-relative noise; lower-case host; drop trailing slash on dirs. */
export function normalizeUrl(input) {
  if (!input) return "";
  let s = String(input).trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try {
    u = new URL(s);
  } catch {
    return String(input).trim();
  }
  const host = u.hostname.toLowerCase();
  let path = u.pathname || "/";
  // Keep file paths (…/foo.html) intact; only trim a trailing slash off dirs.
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return `https://${host}${path}`;
}

/** Build the canonical URL from a GA4 (hostName, pagePath) pair. */
export function ga4Url(hostName, pagePath) {
  const path = (pagePath || "/").split("?")[0].split("#")[0];
  return normalizeUrl(`https://${hostName}${path}`);
}

function round(n, dp = 2) {
  if (n == null || Number.isNaN(n)) return null;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Merge GA4 rows + GSC page rows + GSC query rows into one record per URL.
 * @param {{ga4?: Array, gscPages?: Array, gscQueries?: Array}} parts
 *   ga4:        [{ url, views, sessions, engagedSessions, conversions }]
 *   gscPages:   [{ url, clicks, impressions, ctr, position }]
 *   gscQueries: [{ url, query, clicks, impressions, ctr, position }]
 * @returns {Array} merged per-URL records (sorted by impressions desc)
 */
export function mergeGaGsc({ ga4 = [], gscPages = [], gscQueries = [] } = {}) {
  const byUrl = new Map();
  const ensure = (url) => {
    const key = normalizeUrl(url);
    if (!byUrl.has(key)) {
      byUrl.set(key, {
        url: key,
        host: safeHost(key),
        path: safePath(key),
        views: 0,
        sessions: 0,
        engagedSessions: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0,
        ctr: null,
        position: null,
        topQueries: [],
      });
    }
    return byUrl.get(key);
  };

  for (const r of ga4) {
    const rec = ensure(r.url);
    rec.views += num(r.views);
    rec.sessions += num(r.sessions);
    rec.engagedSessions += num(r.engagedSessions);
    rec.conversions += num(r.conversions);
  }
  for (const r of gscPages) {
    const rec = ensure(r.url);
    rec.clicks += num(r.clicks);
    rec.impressions += num(r.impressions);
    rec.ctr = round(r.ctr, 4);
    rec.position = round(r.position, 1);
  }
  // Attach up to 5 top queries per URL (by clicks then impressions).
  const qByUrl = new Map();
  for (const q of gscQueries) {
    const key = normalizeUrl(q.url);
    if (!qByUrl.has(key)) qByUrl.set(key, []);
    qByUrl.get(key).push({
      query: q.query,
      clicks: num(q.clicks),
      impressions: num(q.impressions),
      position: round(q.position, 1),
    });
  }
  for (const [key, list] of qByUrl) {
    list.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    ensure(key).topQueries = list.slice(0, 5);
  }

  return [...byUrl.values()].sort((a, b) => b.impressions - a.impressions || b.views - a.views);
}

/**
 * Aggregate GSC query rows across pages into ranked keyword opportunities for
 * new-brief mining: queries with demand (impressions) but weak position/CTR.
 */
export function mineQueries(gscQueries = [], { minImpressions = 50 } = {}) {
  const byQuery = new Map();
  for (const q of gscQueries) {
    const key = (q.query || "").trim();
    if (!key) continue;
    if (!byQuery.has(key)) {
      byQuery.set(key, { query: key, clicks: 0, impressions: 0, posWeighted: 0, pages: new Set() });
    }
    const agg = byQuery.get(key);
    agg.clicks += num(q.clicks);
    agg.impressions += num(q.impressions);
    agg.posWeighted += num(q.position) * Math.max(1, num(q.impressions));
    if (q.url) agg.pages.add(normalizeUrl(q.url));
  }
  return [...byQuery.values()]
    .filter((q) => q.impressions >= minImpressions)
    .map((q) => ({
      query: q.query,
      clicks: q.clicks,
      impressions: q.impressions,
      ctr: q.impressions ? round(q.clicks / q.impressions, 4) : 0,
      position: q.impressions ? round(q.posWeighted / q.impressions, 1) : null,
      pages: q.pages.size,
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function safeHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
function safePath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

// --- Live client ----------------------------------------------------------

/**
 * @param {{config?: object, fetchImpl?: typeof fetch}} [opts]
 */
export function createGaGscClient({ config = getConfig(), fetchImpl = fetch } = {}) {
  const auth = createGoogleAuth({ config, scopes: [GA4_SCOPE, GSC_SCOPE], fetchImpl });

  async function authedJson(url, { method = "GET", body } = {}) {
    const token = await auth.getAccessToken();
    const res = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || data?.error_description || `HTTP ${res.status}`;
      throw new GaGscError(`${method} ${url} -> ${msg}`);
    }
    return data;
  }

  return {
    /**
     * Read-only reachability probe for --check. Confirms the SA can see every
     * configured GA4 property and GSC site WITHOUT pulling report data.
     * @returns {Promise<{ga4: object[], gsc: object[], ok: boolean}>}
     */
    async checkAccess({ ga4Properties = config.ga4Properties, gscSites = config.gscSites } = {}) {
      const ga4 = [];
      for (const property of ga4Properties) {
        try {
          await authedJson(`${GA4_DATA_BASE}/${property}/metadata`);
          ga4.push({ property, ok: true });
        } catch (e) {
          ga4.push({ property, ok: false, error: e.message });
        }
      }
      // One sites.list call tells us every site the SA can reach.
      let verified = [];
      let listError = null;
      try {
        const data = await authedJson(`${GSC_BASE}/sites`);
        verified = (data.siteEntry || []).map((s) => s.siteUrl);
      } catch (e) {
        listError = e.message;
      }
      const gsc = gscSites.map((site) => ({
        site,
        ok: listError ? false : verified.includes(site),
        ...(listError ? { error: listError } : {}),
      }));
      const ok = ga4.every((g) => g.ok) && gsc.every((g) => g.ok) && ga4.length > 0 && gsc.length > 0;
      return { ga4, gsc, ok };
    },

    /** GA4 screenPageViews + sessions + engagedSessions + conversions by host/path. */
    async pullGa4({ property, startDate, endDate }) {
      const body = {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "hostName" }, { name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "sessions" },
          { name: "engagedSessions" },
          { name: "conversions" },
        ],
        limit: 100000,
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      };
      const data = await authedJson(`${GA4_DATA_BASE}/${property}:runReport`, { method: "POST", body });
      return (data.rows || []).map((row) => {
        const [host, path] = row.dimensionValues.map((d) => d.value);
        const [views, sessions, engaged, conversions] = row.metricValues.map((m) => Number(m.value));
        return { url: ga4Url(host, path), views, sessions, engagedSessions: engaged, conversions };
      });
    },

    /** GSC Search Analytics. dimensions ["page"] for per-URL, ["page","query"] for mining. */
    async pullGsc({ site, startDate, endDate, dimensions = ["page"], rowLimit = 25000 }) {
      const body = { startDate, endDate, dimensions, rowLimit, dataState: "final" };
      const data = await authedJson(
        `${GSC_BASE}/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
        { method: "POST", body },
      );
      return (data.rows || []).map((row) => {
        const out = { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };
        dimensions.forEach((dim, i) => {
          if (dim === "page") out.url = row.keys[i];
          else out[dim] = row.keys[i];
        });
        return out;
      });
    },
  };
}
