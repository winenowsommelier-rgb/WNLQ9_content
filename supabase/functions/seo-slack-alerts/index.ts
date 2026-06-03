// Supabase Edge Function: Send SEO metrics + alerts to Slack daily.
// Runs at 7 AM UTC (after sync-gsc-ga4 completes at 6 AM UTC).
// Queries metric_date = yesterday across Wine Now TH + LIQ9 TH.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

function ymd(d: Date): string { return d.toISOString().split("T")[0]; }

async function getConfig(): Promise<Record<string, string>> {
  const { data } = await supabase.from("seo_config").select("config_key, config_value");
  const cfg: Record<string, string> = {};
  (data || []).forEach((r: any) => (cfg[r.config_key] = r.config_value));
  return cfg;
}

async function fetchMetrics(dateStr: string) {
  const [gscRes, ga4Res] = await Promise.all([
    supabase
      .from("seo_gsc_daily")
      .select("keyword, rank_position, impressions, clicks, ctr, site")
      .eq("metric_date", dateStr)
      .order("impressions", { ascending: false })
      .limit(500),
    supabase
      .from("seo_ga4_daily")
      .select("page_path, sessions, users, bounce_rate, site")
      .eq("metric_date", dateStr)
      .limit(500),
  ]);
  return { gscData: gscRes.data || [], ga4Data: ga4Res.data || [] };
}

async function fetchCriticalRegressions() {
  const { data } = await supabase
    .from("seo_regression_alerts")
    .select("keyword, regression_type, change_percent, site")
    .is("alert_sent_at", null)
    .eq("alert_level", "critical")
    .order("created_at", { ascending: false })
    .limit(10);
  return data || [];
}

async function fetchTopOpportunities() {
  const { data } = await supabase
    .from("seo_opportunities")
    .select("keyword, impressions, ctr, priority, site")
    .is("resolved_at", null)
    .order("priority", { ascending: false })
    .limit(5);
  return data || [];
}

async function markAlertsAsSent() {
  await supabase
    .from("seo_regression_alerts")
    .update({ alert_sent_at: new Date().toISOString() })
    .is("alert_sent_at", null)
    .eq("alert_level", "critical");
}

async function sendSlack(webhookUrl: string, blocks: unknown[]) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Slack ${res.status}: ${err}`);
  }
}

async function main() {
  const cfg = await getConfig();
  const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL") || "";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = ymd(yesterday);

  const { gscData, ga4Data } = await fetchMetrics(dateStr);
  const regressions = await fetchCriticalRegressions();
  const opportunities = await fetchTopOpportunities();

  const totalSessions = ga4Data.reduce((s: number, r: any) => s + (r.sessions || 0), 0);
  const avgPosition = gscData.length > 0
    ? gscData.reduce((s: number, r: any) => s + (r.rank_position || 0), 0) / gscData.length
    : 0;

  const syncedSites = [...new Set(gscData.map((r: any) => r.site as string).filter(Boolean))];
  const sitesLabel = syncedSites.length > 1
    ? "Wine Now TH + LIQ9 TH"
    : syncedSites[0] === cfg.GSC_SITE_URL ? "Wine Now TH" : syncedSites[0] || "—";

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `🍷 SEO Daily Report — ${dateStr}`, emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Sites*\n${sitesLabel}` },
        { type: "mrkdwn", text: `*Avg GSC Position*\n${avgPosition > 0 ? avgPosition.toFixed(1) : "—"}` },
        { type: "mrkdwn", text: `*Keywords Tracked*\n${gscData.length.toLocaleString()}` },
        { type: "mrkdwn", text: `*Organic Sessions*\n${totalSessions.toLocaleString()}` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: regressions.length > 0
          ? `⚠️ *CRITICAL REGRESSIONS (${regressions.length})*\n${
              regressions.slice(0, 3).map((r: any) =>
                `• *${r.keyword}* — ${Math.abs(r.change_percent).toFixed(1)}% ${r.regression_type} drop${r.site ? ` [${r.site}]` : ""}`
              ).join("\n")
            }${regressions.length > 3 ? `\n_…and ${regressions.length - 3} more_` : ""}`
          : "✅ *No critical regressions detected*",
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: opportunities.length > 0
          ? `💡 *TOP OPPORTUNITIES (${opportunities.length})*\n${
              opportunities.slice(0, 3).map((o: any) =>
                `• *${o.keyword}* — ${(o.impressions || 0).toLocaleString()} impressions, ${((o.ctr || 0) * 100).toFixed(2)}% CTR`
              ).join("\n")
            }`
          : "_No open opportunities_",
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📊 <https://seodashboard-rho.vercel.app|View Dashboard>  |  Syncs daily 6 AM UTC`,
        },
      ],
    },
  ];

  if (slackWebhookUrl) {
    await sendSlack(slackWebhookUrl, blocks);
    await markAlertsAsSent();
    console.log(`Slack sent for ${dateStr}: ${gscData.length} GSC, ${ga4Data.length} GA4, ${regressions.length} regressions`);
  } else {
    console.warn("SLACK_WEBHOOK_URL not set — message not sent");
  }

  return {
    status: "success",
    date: dateStr,
    sites: syncedSites,
    gscRecords: gscData.length,
    ga4Records: ga4Data.length,
    regressions: regressions.length,
    opportunities: opportunities.length,
    slackSent: !!slackWebhookUrl,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const result = await main();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error), status: "failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
