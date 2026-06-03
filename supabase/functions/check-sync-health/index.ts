// Supabase Edge Function: Check sync health and alert via Slack if stale.
// Called by cron (GET, no auth) once per day at 09:00 UTC.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const verbose = url.searchParams.get("verbose") === "true";

  try {
    // Find the most recent completed sync row within the last 36 hours
    const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

    const { data: rows, error: queryErr } = await supabase
      .from("seo_sync_log")
      .select("sync_type, records_imported, status, completed_at")
      .eq("status", "completed")
      .gte("completed_at", cutoff)
      .order("completed_at", { ascending: false })
      .limit(1);

    if (queryErr) throw new Error("seo_sync_log query failed: " + queryErr.message);

    const latest = rows && rows.length > 0 ? rows[0] : null;

    const noRecentSync = !latest;
    const zeroRecords = latest && latest.records_imported === 0;
    const isUnhealthy = noRecentSync || zeroRecords;

    // Compute hours since last sync for the alert message
    let hoursSince: number | null = null;
    if (latest) {
      hoursSince = Math.round(
        (Date.now() - new Date(latest.completed_at).getTime()) / (1000 * 60 * 60),
      );
    }

    // Get Slack webhook
    const { data: webhookUrl, error: webhookErr } = await supabase.rpc("get_slack_webhook");
    const slackUrl = webhookErr ? null : (webhookUrl as string | null);

    let alertSent = false;

    if (isUnhealthy && slackUrl) {
      const recordsInfo = latest ? latest.records_imported : 0;
      const timeInfo = noRecentSync
        ? "more than 36 hours ago"
        : `${hoursSince}h ago`;

      const message = `:warning: SEO sync health alert: last successful sync was ${timeInfo} with ${recordsInfo} records. Check sync-gsc-ga4 function.`;

      const slackRes = await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });

      alertSent = slackRes.ok;
    } else if (!isUnhealthy && verbose && slackUrl) {
      const dateStr = latest!.completed_at;
      const message = `:white_check_mark: SEO sync healthy: last completed ${dateStr}, ${latest!.records_imported} records imported.`;

      const slackRes = await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });

      alertSent = slackRes.ok;
    }

    const responsePayload = {
      status: isUnhealthy ? "unhealthy" : "healthy",
      last_sync_at: latest?.completed_at ?? null,
      records_imported: latest?.records_imported ?? null,
      hours_since_last_sync: hoursSince,
      alert_sent: alertSent,
      reason: noRecentSync
        ? "no completed sync in last 36 hours"
        : zeroRecords
        ? "latest completed sync imported 0 records"
        : "ok",
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
