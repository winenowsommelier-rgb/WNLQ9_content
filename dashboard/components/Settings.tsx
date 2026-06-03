"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle } from "./ui";

interface Status {
  notion: boolean;
  slack: boolean;
  seo: boolean; // GA4 + GSC, served from Supabase
}

export function Settings() {
  const [status, setStatus] = useState<Status>({
    notion: false,
    slack: false,
    seo: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/notion").then((r) => r.json()).catch(() => ({})),
      fetch("/api/slack").then((r) => r.json()).catch(() => ({})),
      fetch("/api/data").then((r) => r.json()).catch(() => ({})),
    ]).then(([n, s, d]) => {
      setStatus({
        notion: Boolean(n.configured),
        slack: Boolean(s.configured),
        seo: d.source === "supabase",
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <SectionTitle sub="Connection status. Secrets live in .env.local on the server — never in the browser or git.">
        Settings
      </SectionTitle>

      <Card>
        <h4 className="mb-4 text-sm font-bold text-slate-700">Integrations</h4>
        <div className="space-y-3">
          <Row
            label="Notion"
            desc="Writes briefs to your content database"
            ok={status.notion}
            loading={loading}
            env="NOTION_API_TOKEN, NOTION_DATABASE_ID"
          />
          <Row
            label="Slack"
            desc="Status notifications (brief, HTML, publish)"
            ok={status.slack}
            loading={loading}
            env="SLACK_WEBHOOK_URL"
          />
          <Row
            label="Google Analytics 4"
            desc={
              status.seo
                ? "Live page metrics from Supabase (synced daily)"
                : "Falling back to sample CSV — set Supabase env to go live"
            }
            ok={status.seo}
            loading={loading}
            env="SUPABASE_URL, SUPABASE_ANON_KEY"
          />
          <Row
            label="Google Search Console"
            desc={
              status.seo
                ? "Live keyword metrics from Supabase (synced daily)"
                : "Falling back to sample CSV — set Supabase env to go live"
            }
            ok={status.seo}
            loading={loading}
            env="SUPABASE_URL, SUPABASE_ANON_KEY"
          />
        </div>
      </Card>

      <Card className="bg-slate-50">
        <h4 className="mb-2 text-sm font-bold text-slate-700">
          How to configure
        </h4>
        <ol className="ml-4 list-decimal space-y-1 text-sm text-slate-600">
          <li>
            Open{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">
              dashboard/.env.local
            </code>
          </li>
          <li>Add or update the keys listed above</li>
          <li>
            Restart the dev server:{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">
              npm run dev
            </code>
          </li>
          <li>Reload this page — status dots turn green</li>
        </ol>
      </Card>
    </div>
  );
}

function Row({
  label,
  desc,
  ok,
  loading,
  env,
  pending,
}: {
  label: string;
  desc: string;
  ok: boolean;
  loading: boolean;
  env: string;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
      <div>
        <div className="font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-400">{desc}</div>
        <div className="mt-0.5 font-mono text-[11px] text-slate-400">{env}</div>
      </div>
      <div>
        {loading ? (
          <span className="text-xs text-slate-400">checking…</span>
        ) : pending ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            Week 3
          </span>
        ) : ok ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            ● Connected
          </span>
        ) : (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            ● Not set
          </span>
        )}
      </div>
    </div>
  );
}
