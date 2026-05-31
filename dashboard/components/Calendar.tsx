"use client";

import { useState } from "react";
import type { ContentBrief } from "@/lib/types";
import { Card, SectionTitle, StatusBadge } from "./ui";
import { BRANDS } from "@/lib/brands";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({ briefs }: { briefs: ContentBrief[] }) {
  // Derive an initial month from the briefs (or fall back to the first brief).
  const seed = briefs[0]?.publishDate;
  const [year, month] = useMonthState(seed);

  const byDate = new Map<string, ContentBrief[]>();
  briefs.forEach((b) => {
    if (!b.publishDate) return;
    const arr = byDate.get(b.publishDate) ?? [];
    arr.push(b);
    byDate.set(b.publishDate, arr);
  });

  const first = new Date(year.value, month.value, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateStr(d: number): string {
    const m = String(month.value + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    return `${year.value}-${m}-${day}`;
  }

  return (
    <div className="space-y-4">
      <SectionTitle sub="Content schedule by publish date. Color dots show the brand.">
        Content Calendar
      </SectionTitle>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => prevMonth(year, month)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            ← Prev
          </button>
          <h3 className="text-lg font-bold text-slate-800">
            {MONTHS[month.value]} {year.value}
          </h3>
          <button
            onClick={() => nextMonth(year, month)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DOW.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-slate-400"
            >
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null)
              return <div key={i} className="min-h-20 rounded-lg" />;
            const items = byDate.get(dateStr(d)) ?? [];
            return (
              <div
                key={i}
                className="min-h-20 rounded-lg border border-slate-100 p-1.5 hover:border-indigo-200"
              >
                <div className="mb-1 text-xs font-semibold text-slate-400">
                  {d}
                </div>
                <div className="space-y-1">
                  {items.map((b) => (
                    <div
                      key={b.id}
                      title={`${b.topic} (${b.status})`}
                      className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: BRANDS[b.brand].color }}
                    >
                      {BRANDS[b.brand].emoji} {b.topic}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h4 className="mb-3 text-sm font-bold text-slate-700">
          This month&rsquo;s briefs
        </h4>
        <div className="divide-y divide-slate-100">
          {briefs
            .filter((b) => {
              const dt = new Date(b.publishDate);
              return (
                dt.getFullYear() === year.value && dt.getMonth() === month.value
              );
            })
            .map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-2.5"
              >
                <span className="text-sm text-slate-700">
                  {BRANDS[b.brand].emoji} {b.topic}{" "}
                  <span className="text-slate-400">· {b.publishDate}</span>
                </span>
                <StatusBadge status={b.status} />
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

// --- tiny month state helper (avoids Date.now in module scope) ---
function useMonthState(seed?: string) {
  const init = seed ? new Date(seed) : new Date("2026-06-01");
  const [y, setY] = useState(init.getFullYear());
  const [m, setM] = useState(init.getMonth());
  return [
    { value: y, set: setY },
    { value: m, set: setM },
  ] as const;
}

function prevMonth(
  year: { value: number; set: (n: number) => void },
  month: { value: number; set: (n: number) => void },
) {
  if (month.value === 0) {
    month.set(11);
    year.set(year.value - 1);
  } else month.set(month.value - 1);
}
function nextMonth(
  year: { value: number; set: (n: number) => void },
  month: { value: number; set: (n: number) => void },
) {
  if (month.value === 11) {
    month.set(0);
    year.set(year.value + 1);
  } else month.set(month.value + 1);
}
