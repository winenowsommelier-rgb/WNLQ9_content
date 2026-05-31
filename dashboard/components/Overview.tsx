"use client";

import type { ContentBrief, GA4Row, GSCRow } from "@/lib/types";
import { Card, StatusBadge } from "./ui";
import { BRANDS } from "@/lib/brands";

export function Overview({
  briefs,
  ga4,
  gsc,
}: {
  briefs: ContentBrief[];
  ga4: GA4Row[];
  gsc: GSCRow[];
}) {
  const published = briefs.filter((b) => b.status === "published").length;
  const inFlight = briefs.filter(
    (b) => b.status !== "published" && b.status !== "draft",
  ).length;

  const stats = [
    { label: "Total Briefs", value: briefs.length },
    { label: "In Flight", value: inFlight },
    { label: "Published", value: published },
    { label: "GA Topics", value: ga4.length },
    { label: "GSC Keywords", value: gsc.length },
  ];

  const recent = briefs.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <div className="text-3xl font-extrabold text-indigo-600">
              {s.value}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-bold text-slate-800">Recent Briefs</h3>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No briefs yet. Head to <strong>Generate</strong> to create your
            first one.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{BRANDS[b.brand].emoji}</span>
                  <div>
                    <div className="font-medium text-slate-800">{b.topic}</div>
                    <div className="text-xs text-slate-400">
                      {BRANDS[b.brand].name} · {b.publishDate}
                    </div>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
