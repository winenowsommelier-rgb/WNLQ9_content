import type { Brand, GA4Row, GSCRow } from "./types";

// ============================================================
// Real GSC / GA4 source — Supabase "WNLQ9 SEO Automation"
// ------------------------------------------------------------
// Reads the daily Google Search Console + Analytics 4 metrics that the
// `sync-gsc-ga4` pipeline lands in Postgres, pre-aggregated per brand by the
// `dashboard_gsc_keywords` / `dashboard_ga4_pages` materialized views.
//
// Configure with env (server-side only — never exposed to the browser):
//   SUPABASE_URL        e.g. https://asnarjokyedupsjipzkl.supabase.co
//   SUPABASE_ANON_KEY   anon/publishable key (views are granted to anon)
// ============================================================

const BRANDS: Brand[] = ["wine-now", "liq9"];

// Top-N per brand. Components show 25-30; we pull more so in-app search/sort
// has a useful pool without shipping the full 55k-keyword table to the client.
const GSC_LIMIT = 150;
const GA4_LIMIT = 120;

export function seoSourceConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function restUrl(view: string, params: Record<string, string>): string {
  const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
  const qs = new URLSearchParams(params).toString();
  return `${base}/rest/v1/${view}?${qs}`;
}

async function query<T>(view: string, params: Record<string, string>): Promise<T[]> {
  const key = process.env.SUPABASE_ANON_KEY!;
  const res = await fetch(restUrl(view, params), {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    // The materialized views are the performance layer; keep results live.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase ${view} ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T[];
}

/** Light, Thai-safe prettifier so a page path reads as a topic. */
function pathToTitle(path: string): string {
  if (!path || path === "/") return "Home";
  const last =
    path.replace(/\/+$/, "").split("/").filter(Boolean).pop() ?? path;
  return last.replace(/\.html?$/i, "").replace(/[-_]+/g, " ").trim() || path;
}

interface GscView {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number; // already a percentage
  position: number;
}

interface Ga4View {
  page_path: string;
  users: number;
  sessions: number;
  pageviews: number;
  avg_session_duration: number;
}

async function fetchGscBrand(brand: Brand): Promise<GSCRow[]> {
  const rows = await query<GscView>("dashboard_gsc_keywords", {
    site: `eq.${brand}`,
    select: "keyword,impressions,clicks,ctr,position",
    order: "impressions.desc",
    limit: String(GSC_LIMIT),
  });
  return rows.map((r) => ({
    query: r.keyword,
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
    brand,
  }));
}

async function fetchGa4Brand(brand: Brand): Promise<GA4Row[]> {
  const rows = await query<Ga4View>("dashboard_ga4_pages", {
    site: `eq.${brand}`,
    select: "page_path,users,sessions,pageviews,avg_session_duration",
    order: "pageviews.desc",
    limit: String(GA4_LIMIT),
  });
  return rows.map((r) => ({
    pageTitle: pathToTitle(r.page_path),
    pagePath: r.page_path,
    views: r.pageviews ?? 0,
    users: r.users ?? 0,
    avgEngagementTime: r.avg_session_duration ?? 0,
    brand,
  }));
}

export async function fetchSeoData(): Promise<{ ga4: GA4Row[]; gsc: GSCRow[] }> {
  const [gscByBrand, ga4ByBrand] = await Promise.all([
    Promise.all(BRANDS.map(fetchGscBrand)),
    Promise.all(BRANDS.map(fetchGa4Brand)),
  ]);
  return { gsc: gscByBrand.flat(), ga4: ga4ByBrand.flat() };
}
