"use client";

import { useEffect, useState } from "react";
import type {
  Brand,
  BriefOption,
  ContentBrief,
  GA4Row,
  GSCRow,
} from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { BRANDS } from "@/lib/brands";
import {
  loadBriefs,
  upsertBrief,
  deleteBrief as removeBrief,
  newId,
} from "@/lib/store";
import { Overview } from "@/components/Overview";
import { Calendar } from "@/components/Calendar";
import { TopicIntelligence } from "@/components/TopicIntelligence";
import { KeywordManager } from "@/components/KeywordManager";
import { BriefGenerator } from "@/components/BriefGenerator";
import { BriefEditor } from "@/components/BriefEditor";
import { PublicationTracker } from "@/components/PublicationTracker";
import { Settings } from "@/components/Settings";

type Tab =
  | "overview"
  | "calendar"
  | "topics"
  | "keywords"
  | "generate"
  | "editor"
  | "tracker"
  | "settings";

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "topics", label: "Topics", icon: "📈" },
  { id: "keywords", label: "Keywords", icon: "🔑" },
  { id: "generate", label: "Generate", icon: "✨" },
  { id: "editor", label: "Editor", icon: "✏️" },
  { id: "tracker", label: "Tracker", icon: "🚀" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [briefs, setBriefs] = useState<ContentBrief[]>([]);
  const [ga4, setGa4] = useState<GA4Row[]>([]);
  const [gsc, setGsc] = useState<GSCRow[]>([]);
  const [editing, setEditing] = useState<ContentBrief | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Load briefs (local) + data (API) on mount
  useEffect(() => {
    setBriefs(loadBriefs());
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setGa4(d.ga4 ?? []);
        setGsc(d.gsc ?? []);
      })
      .catch(() => {});
  }, []);

  function startBriefFromOption(
    option: BriefOption,
    brand: Brand,
    date: string,
  ) {
    const brief: ContentBrief = {
      id: newId(),
      brand,
      topic: option.topic,
      key: option.key,
      tension: option.tension,
      story: option.story,
      seoKeyword: option.seoKeyword,
      publishDate: date,
      status: "draft",
      createdAt: new Date("2026-01-01").toISOString(), // stamped on save
    };
    setEditing(brief);
    setSaveMsg(null);
    setTab("editor");
  }

  function startBlankBrief(brand: Brand = "wine-now", prefill?: Partial<ContentBrief>) {
    const brief: ContentBrief = {
      id: newId(),
      brand,
      topic: "",
      key: "",
      tension: "",
      story: "",
      seoKeyword: "",
      publishDate: "",
      status: "draft",
      createdAt: new Date("2026-01-01").toISOString(),
      ...prefill,
    };
    setEditing(brief);
    setSaveMsg(null);
    setTab("editor");
  }

  async function saveBrief() {
    if (!editing) return;
    setSaving(true);
    setSaveMsg(null);

    const toSave: ContentBrief = {
      ...editing,
      status: editing.status === "draft" ? "brief_ready" : editing.status,
    };

    // 1. Local persistence
    const updated = upsertBrief(toSave);
    setBriefs(updated);
    setEditing(toSave);

    // 2. Notion
    let notionOk = false;
    try {
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      const data = await res.json();
      notionOk = Boolean(data.ok);
    } catch {
      notionOk = false;
    }

    // 3. Slack notification
    try {
      await fetch("/api/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "brief_created",
          message: `✅ Brief ready: ${toSave.topic} (${BRANDS[toSave.brand].name}) — ${toSave.publishDate || "no date"} [${STATUS_LABEL[toSave.status]}]`,
        }),
      });
    } catch {
      /* ignore */
    }

    setSaving(false);
    setSaveMsg(
      notionOk
        ? "Saved locally + Notion + Slack ✓"
        : "Saved locally ✓ (Notion not configured — see Settings)",
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="text-lg font-extrabold text-slate-800">
            WNLQ9
          </div>
          <div className="text-xs text-slate-400">Content Dashboard</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === n.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => startBlankBrief()}
          className="mt-4 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + New Brief
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile top nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 md:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                tab === n.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500"
              }`}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-6xl p-5 md:p-8">
          {tab === "overview" && (
            <Overview briefs={briefs} ga4={ga4} gsc={gsc} />
          )}
          {tab === "calendar" && <Calendar briefs={briefs} />}
          {tab === "topics" && (
            <TopicIntelligence
              ga4={ga4}
              onUseTopic={(topic, brand) =>
                startBlankBrief(brand, { topic })
              }
            />
          )}
          {tab === "keywords" && (
            <KeywordManager
              gsc={gsc}
              onUseKeyword={(seoKeyword, brand) =>
                startBlankBrief(brand, { seoKeyword })
              }
            />
          )}
          {tab === "generate" && (
            <BriefGenerator ga4={ga4} gsc={gsc} onPick={startBriefFromOption} />
          )}
          {tab === "editor" &&
            (editing ? (
              <BriefEditor
                brief={editing}
                onChange={setEditing}
                onSave={saveBrief}
                saving={saving}
                saveMessage={saveMsg}
              />
            ) : (
              <EmptyEditor onNew={() => startBlankBrief()} />
            ))}
          {tab === "tracker" && (
            <PublicationTracker
              briefs={briefs}
              onEdit={(b) => {
                setEditing(b);
                setSaveMsg(null);
                setTab("editor");
              }}
              onDelete={(id) => setBriefs(removeBrief(id))}
            />
          )}
          {tab === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
}

function EmptyEditor({ onNew }: { onNew: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="mb-4 text-slate-500">
        No brief open. Generate one or start blank.
      </p>
      <button
        onClick={onNew}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        + New Brief
      </button>
    </div>
  );
}
