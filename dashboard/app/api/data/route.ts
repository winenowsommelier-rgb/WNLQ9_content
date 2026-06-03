import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseGA4, parseGSC } from "@/lib/csv";
import { fetchSeoData, seoSourceConfigured } from "@/lib/seo-source";

export const dynamic = "force-dynamic";

/**
 * GET /api/data
 * Returns GA4 + GSC data for the dashboard.
 *
 * Primary source: the real Google Search Console + Analytics 4 metrics synced
 * into Supabase ("WNLQ9 SEO Automation"), pre-aggregated per brand. Set
 * SUPABASE_URL + SUPABASE_ANON_KEY to enable.
 *
 * Fallback: the bundled sample CSVs (used only when Supabase env is absent).
 */
export async function GET() {
  if (seoSourceConfigured()) {
    try {
      const { ga4, gsc } = await fetchSeoData();
      return NextResponse.json({ ga4, gsc, source: "supabase" });
    } catch (err) {
      // Surface the failure but degrade to sample data so the UI still renders.
      const sample = await loadSampleData();
      return NextResponse.json({
        ...sample,
        source: "sample-csv",
        warning: `Supabase fetch failed, served sample data: ${(err as Error).message}`,
      });
    }
  }

  try {
    const sample = await loadSampleData();
    return NextResponse.json({ ...sample, source: "sample-csv" });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, ga4: [], gsc: [] },
      { status: 500 },
    );
  }
}

async function loadSampleData() {
  const dir = path.join(process.cwd(), "data");
  const [gaText, gscText] = await Promise.all([
    readFile(path.join(dir, "sample-ga4-data.csv"), "utf8").catch(() => ""),
    readFile(path.join(dir, "sample-gsc-data.csv"), "utf8").catch(() => ""),
  ]);
  return { ga4: parseGA4(gaText), gsc: parseGSC(gscText) };
}
