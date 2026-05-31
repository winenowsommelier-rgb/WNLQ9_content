// Supabase Edge Function: Send SEO metrics + alerts to Slack daily
// Run every 7 AM daily (after GSC/GA4 sync completes at 6 AM)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL") || "";

const supabase = createClient(supabaseUrl, supabaseKey);

interface SlackMessage {
  blocks: Array<{
    type: string;
    [key: string]: unknown;
  }>;
}

async function fetchTodaysMetrics() {
  const today = new Date().toISOString().split("T")[0];

  const { data: gscData } = await supabase
    .from("seo_gsc_daily")
    .select("*")
    .eq("date", today)
    .limit(100);

  const { data: ga4Data } = await supabase
    .from("seo_ga4_daily")
    .select("*")
    .eq("date", today)
    .limit(100);

  return { gscData: gscData || [], ga4Data: ga4Data || [] };
}

async function fetchRegressions() {
  const { data } = await supabase
    .from("seo_regression_alerts")
    .select("*")
    .is("alert_sent_at", null)
    .eq("alert_level", "critical")
    .order("created_at", { ascending: false })
    .limit(10);

  return data || [];
}

async function fetchOpportunities() {
  const { data } = await supabase
    .from("seo_opportunities")
    .select("*, products(id, title_en, sku)")
    .is("resolved_at", null)
    .order("priority", { ascending: false })
    .order("detected_at", { ascending: false })
    .limit(5);

  return data || [];
}

async function buildSlackMessage(metrics: {
  gscRecords: number;
  ga4Records: number;
  regressions: unknown[];
  opportunities: unknown[];
}): Promise<SlackMessage> {
  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔍 SEO Daily Report",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Date:* ${new Date().toLocaleDateString()}\n*GSC Metrics:* ${metrics.gscRecords} keywords tracked\n*GA4 Metrics:* ${metrics.ga4Records} pages tracked`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            metrics.regressions.length > 0
              ? `⚠️ *CRITICAL REGRESSIONS:* ${metrics.regressions.length} keywords dropped\n\n${metrics.regressions
                  .slice(0, 3)
                  .map(
                    (r: any) =>
                      `• *${r.keyword}* (${r.regression_type}): ${Math.abs(r.change_percent).toFixed(1)}% drop`
                  )
                  .join("\n")}`
              : "✅ *No critical regressions detected today*",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            metrics.opportunities.length > 0
              ? `💡 *TOP OPPORTUNITIES:* ${metrics.opportunities.length} quick wins found\n\n${metrics.opportunities
                  .slice(0, 3)
                  .map(
                    (o: any) =>
                      `• *${o.keyword}* (${o.products?.title_en || "Unknown"}): ${o.current_impressions} impressions, ${(o.current_ctr * 100).toFixed(2)}% CTR`
                  )
                  .join("\n")}`
              : "No opportunities detected yet",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Updates hourly. View full dashboard → Notion SEO Dashboard",
          },
        ],
      },
    ],
  };
}

async function sendSlackAlert(message: SlackMessage) {
  if (!slackWebhookUrl) {
    console.warn("Slack webhook URL not configured");
    return;
  }

  const response = await fetch(slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.statusText}`);
  }
}

async function markAlertsAsSent() {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("seo_regression_alerts")
    .update({ alert_sent: true, alert_sent_at: now })
    .is("alert_sent_at", null)
    .eq("alert_level", "critical");

  if (error) console.error("Error marking alerts as sent:", error);
}

async function main() {
  console.log("Starting SEO Slack alerts...");

  try {
    // Fetch latest metrics
    const { gscData, ga4Data } = await fetchTodaysMetrics();
    const regressions = await fetchRegressions();
    const opportunities = await fetchOpportunities();

    // Build message
    const message = await buildSlackMessage({
      gscRecords: gscData.length,
      ga4Records: ga4Data.length,
      regressions,
      opportunities,
    });

    // Send to Slack
    await sendSlackAlert(message);

    // Mark critical regressions as sent
    await markAlertsAsSent();

    return {
      status: "success",
      gscRecords: gscData.length,
      ga4Records: ga4Data.length,
      regressions: regressions.length,
      opportunities: opportunities.length,
    };
  } catch (err) {
    console.error("Alert failed:", err);
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
