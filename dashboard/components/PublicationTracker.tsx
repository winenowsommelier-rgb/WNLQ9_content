"use client";

import type { ContentBrief } from "@/lib/types";
import { Card, SectionTitle, StatusBadge, Button } from "./ui";
import { BRANDS } from "@/lib/brands";

export function PublicationTracker({
  briefs,
  onEdit,
  onDelete,
}: {
  briefs: ContentBrief[];
  onEdit: (b: ContentBrief) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionTitle sub="End-to-end status from brief → HTML → Google Drive → Magento → live.">
        Publication Tracker
      </SectionTitle>

      <Card className="overflow-x-auto p-0">
        {briefs.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No briefs tracked yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Brand</th>
                <th className="px-3 py-3 font-semibold">Topic</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-center font-semibold">HTML</th>
                <th className="px-3 py-3 text-center font-semibold">Live</th>
                <th className="px-3 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {briefs.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {b.publishDate || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span title={BRANDS[b.brand].name}>
                      {BRANDS[b.brand].emoji}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-800">
                    {b.topic}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    {b.htmlFile ? "✅" : "—"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {b.magentoUrl ? (
                      <a
                        href={b.magentoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline"
                      >
                        link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" onClick={() => onEdit(b)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => onDelete(b.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
