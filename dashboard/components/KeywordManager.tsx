"use client";

import { useMemo, useState } from "react";
import type { Brand, GSCRow } from "@/lib/types";
import { Card, SectionTitle, Pill } from "./ui";
import { BRANDS, guessBrand } from "@/lib/brands";

type SortKey = "impressions" | "clicks" | "ctr" | "position" | "opportunity";

export function KeywordManager({
  gsc,
  onUseKeyword,
}: {
  gsc: GSCRow[];
  onUseKeyword?: (keyword: string, brand: Brand) => void;
}) {
  const [filter, setFilter] = useState<"all" | Brand>("all");
  const [sort, setSort] = useState<SortKey>("impressions");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const withBrand = gsc
      .map((r) => ({
        ...r,
        brand: r.brand ?? guessBrand(r.query),
        opportunity: Math.round(r.impressions * (1 - r.ctr / 100)),
      }))
      .filter((r) => (filter === "all" ? true : r.brand === filter))
      .filter((r) =>
        q ? r.query.toLowerCase().includes(q.toLowerCase()) : true,
      );
    return withBrand
      .sort((a, b) => {
        if (sort === "position") return a.position - b.position;
        return (b[sort] as number) - (a[sort] as number);
      })
      .slice(0, 30);
  }, [gsc, filter, sort, q]);

  return (
    <div className="space-y-4">
      <SectionTitle sub="Keywords from Google Search Console. 'Opportunity' = impressions you're not yet converting to clicks.">
        Keyword Manager
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <FilterTabs value={filter} onChange={setFilter} />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="impressions">Sort: Impressions</option>
          <option value="clicks">Sort: Clicks</option>
          <option value="ctr">Sort: CTR</option>
          <option value="position">Sort: Position</option>
          <option value="opportunity">Sort: Opportunity</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search keywords…"
          className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      <Card className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No GSC data. Add a CSV in <code>data/sample-gsc-data.csv</code> or
            connect the GSC API.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Keyword</th>
                <th className="px-3 py-3 text-right font-semibold">Impr.</th>
                <th className="px-3 py-3 text-right font-semibold">Clicks</th>
                <th className="px-3 py-3 text-right font-semibold">CTR</th>
                <th className="px-3 py-3 text-right font-semibold">Pos.</th>
                <th className="px-3 py-3 text-right font-semibold">Opp.</th>
                {onUseKeyword && <th className="px-3 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Pill color={BRANDS[r.brand].color}>
                        {BRANDS[r.brand].emoji}
                      </Pill>
                      <span className="font-medium text-slate-800">
                        {r.query}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {r.impressions.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {r.clicks.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {r.ctr.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {r.position.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-indigo-600">
                    {r.opportunity.toLocaleString()}
                  </td>
                  {onUseKeyword && (
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onUseKeyword(r.query, r.brand)}
                        className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                      >
                        Use
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
