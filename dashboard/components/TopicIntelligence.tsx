"use client";

import { useMemo, useState } from "react";
import type { Brand, GA4Row } from "@/lib/types";
import { Card, SectionTitle, Pill } from "./ui";
import { BRANDS, guessBrand } from "@/lib/brands";

export function TopicIntelligence({
  ga4,
  onUseTopic,
}: {
  ga4: GA4Row[];
  onUseTopic?: (topic: string, brand: Brand) => void;
}) {
  const [filter, setFilter] = useState<"all" | Brand>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return ga4
      .map((r) => ({ ...r, brand: r.brand ?? guessBrand(`${r.pageTitle} ${r.pagePath}`) }))
      .filter((r) => (filter === "all" ? true : r.brand === filter))
      .filter((r) =>
        q ? r.pageTitle.toLowerCase().includes(q.toLowerCase()) : true,
      )
      .sort((a, b) => b.views - a.views)
      .slice(0, 25);
  }, [ga4, filter, q]);

  const maxViews = rows[0]?.views || 1;

  return (
    <div className="space-y-4">
      <SectionTitle sub="Trending pages from Google Analytics — your strongest topic signals.">
        Topic Intelligence
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <FilterTabs value={filter} onChange={setFilter} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics…"
          className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      <Card className="p-0">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No GA data. Add a CSV in <code>data/sample-ga4-data.csv</code> or
            connect the GA4 API.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <span className="w-6 text-right text-sm font-semibold text-slate-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Pill color={BRANDS[r.brand].color}>
                      {BRANDS[r.brand].emoji}
                    </Pill>
                    <span className="truncate font-medium text-slate-800">
                      {r.pageTitle}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(r.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <div className="text-sm font-bold text-slate-700">
                    {r.views.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">views</div>
                </div>
                {onUseTopic && (
                  <button
                    onClick={() => onUseTopic(r.pageTitle, r.brand)}
                    className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                  >
                    Use
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function FilterTabs({
  value,
  onChange,
}: {
  value: "all" | Brand;
  onChange: (v: "all" | Brand) => void;
}) {
  const tabs: { id: "all" | Brand; label: string }[] = [
    { id: "all", label: "All" },
    { id: "wine-now", label: "🍷 Wine-Now" },
    { id: "liq9", label: "🥃 LIQ9" },
  ];
  return (
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition ${
            value === t.id
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
