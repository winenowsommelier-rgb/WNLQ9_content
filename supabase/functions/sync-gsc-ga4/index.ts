// Supabase Edge Function: Sync Google Search Console + GA4 metrics daily
// Run every 6 AM daily via cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseKey);

interface GSCData {
  product_id: number;
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  avg_position: number;
}

interface GA4Data {
  product_id: number;
  page_path: string;
  users: number;
  sessions: number;
  pageviews: number;
  bounce_rate: number;
  avg_session_duration: number;
  goal_completions: number;
  conversion_rate: number;
}

// Mock GSC API call (replace with real Google Search Console API)
async function fetchGSCData(siteUrl: string): Promise<GSCData[]> {
  // In production, call Google Search Console API
  // For now, return empty array (will be integrated with real GSC)
  console.log(`Fetching GSC data for ${siteUrl}`);
  return [];
}

// Mock GA4 API call (replace with real Google Analytics 4 API)
async function fetchGA4Data(propertyId: string): Promise<GA4Data[]> {
  // In production, call Google Analytics 4 API
  // For now, return empty array (will be integrated with real GA4)
  console.log(`Fetching GA4 data for property ${propertyId}`);
  return [];
}

async function importGSCData(data: GSCData[]) {
  if (data.length === 0) return { imported: 0, updated: 0 };

  const { data: result, error } = await supabase
    .from("seo_gsc_daily")
    .upsert(
      data.map((row) => ({
        ...row,
        date: new Date().toISOString().split("T")[0],
        synced_at: new Date().toISOString(),
      })),
      { onConflict: "product_id,keyword,date" }
    )
    .select();

  if (error) throw error;
  return { imported: data.length, updated: result?.length || 0 };
}

async function importGA4Data(data: GA4Data[]) {
  if (data.length === 0) return { imported: 0, updated: 0 };

  const { data: result, error } = await supabase
    .from("seo_ga4_daily")
    .upsert(
      data.map((row) => ({
        ...row,
        date: new Date().toISOString().split("T")[0],
        synced_at: new Date().toISOString(),
      })),
      { onConflict: "product_id,page_path,date" }
    )
    .select();

  if (error) throw error;
  return { imported: data.length, updated: result?.length || 0 };
}

async function detectOpportunities() {
  // Find keywords with high impressions but low CTR (opportunity to optimize titles/metas)
  const { data, error } = await supabase.rpc("detect_seo_opportunities", {
    impression_threshold: 500,
    ctr_threshold: 0.02,
  });

  if (error) console.error("Error detecting opportunities:", error);
  return data || [];
}

async function detectRegressions() {
  // Find keywords where position dropped >3 or CTR dropped >20% in last 7 days
  const { data, error } = await supabase.rpc("detect_seo_regressions", {
    days: 7,
    position_drop_threshold: 3,
    ctr_drop_threshold: 0.2,
  });

  if (error) console.error("Error detecting regressions:", error);
  return data || [];
}

async function logSync(
  syncType: string,
  imported: number,
  updated: number,
  status: string,
  error?: string
) {
  const { error: logError } = await supabase.from("seo_sync_log").insert({
    sync_type: syncType,
    records_imported: imported,
    records_updated: updated,
    sync_date: new Date().toISOString().split("T")[0],
    completed_at: new Date().toISOString(),
    status,
    error_message: error,
  });

  if (logError) console.error("Error logging sync:", logError);
}

async function main() {
  console.log("Starting SEO GSC/GA4 sync...");

  const siteUrl = Deno.env.get("GSC_SITE_URL") || "https://winenowsommelier.com";
  const ga4PropertyId = Deno.env.get("GA4_PROPERTY_ID") || "";

  try {
    // Fetch data from GSC
    const gscData = await fetchGSCData(siteUrl);
    const gscResult = await importGSCData(gscData);
    await logSync("gsc", gscResult.imported, gscResult.updated, "completed");
    console.log(`GSC: imported ${gscResult.imported}, updated ${gscResult.updated}`);

    // Fetch data from GA4
    const ga4Data = await fetchGA4Data(ga4PropertyId);
    const ga4Result = await importGA4Data(ga4Data);
    await logSync("ga4", ga4Result.imported, ga4Result.updated, "completed");
    console.log(`GA4: imported ${ga4Result.imported}, updated ${ga4Result.updated}`);

    // Detect opportunities
    const opportunities = await detectOpportunities();
    console.log(`Detected ${opportunities.length} SEO opportunities`);

    // Detect regressions
    const regressions = await detectRegressions();
    console.log(`Detected ${regressions.length} potential regressions`);

    return {
      status: "success",
      gsc: gscResult,
      ga4: ga4Result,
      opportunities: opportunities.length,
      regressions: regressions.length,
    };
  } catch (err) {
    console.error("Sync failed:", err);
    await logSync("sync", 0, 0, "failed", String(err));
    throw err;
  }
}

// Deno Deploy handler
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const result = await main();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error), status: "failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
