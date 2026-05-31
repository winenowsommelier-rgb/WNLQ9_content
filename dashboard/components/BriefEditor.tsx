"use client";

import { useState } from "react";
import type { ContentBrief } from "@/lib/types";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/types";
import { Card, SectionTitle, Button } from "./ui";
import { BRAND_LIST, BRANDS } from "@/lib/brands";

export function BriefEditor({
  brief,
  onChange,
  onSave,
  saving,
  saveMessage,
}: {
  brief: ContentBrief;
  onChange: (b: ContentBrief) => void;
  onSave: () => void;
  saving: boolean;
  saveMessage: string | null;
}) {
  const set = <K extends keyof ContentBrief>(k: K, v: ContentBrief[K]) =>
    onChange({ ...brief, [k]: v });

  return (
    <div className="space-y-5">
      <SectionTitle sub="Refine the brief. UI is English; write the content fields in Thai (or any language).">
        Brief Editor
      </SectionTitle>

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Brand">
            <div className="flex gap-2">
              {BRAND_LIST.map((b) => (
                <button
                  key={b.id}
                  onClick={() => set("brand", b.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    brief.brand === b.id
                      ? "border-transparent text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  style={
                    brief.brand === b.id
                      ? { backgroundColor: b.color }
                      : undefined
                  }
                >
                  {b.emoji} {b.name}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Publish Date">
            <input
              type="date"
              value={brief.publishDate}
              onChange={(e) => set("publishDate", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Status">
            <select
              value={brief.status}
              onChange={(e) =>
                set("status", e.target.value as ContentBrief["status"])
              }
              className={inputCls}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Topic / Headline">
          <input
            value={brief.topic}
            onChange={(e) => set("topic", e.target.value)}
            placeholder="e.g., Rosé Myths Debunked: Temperature & Pairing"
            className={inputCls}
          />
        </Field>

        <Field label="SEO Keyword">
          <input
            value={brief.seoKeyword}
            onChange={(e) => set("seoKeyword", e.target.value)}
            placeholder="e.g., rosé wine serving temperature"
            className={inputCls}
          />
        </Field>

        <Field label="KEY — the one takeaway">
          <textarea
            value={brief.key}
            onChange={(e) => set("key", e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>

        <Field label="TENSION — what readers wonder">
          <textarea
            value={brief.tension}
            onChange={(e) => set("tension", e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>

        <Field label="STORY — the narrative arc">
          <textarea
            value={brief.story}
            onChange={(e) => set("story", e.target.value)}
            rows={3}
            className={inputCls}
          />
        </Field>

        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <Button onClick={onSave} disabled={saving || !brief.topic}>
            {saving ? "Saving…" : "Save to Notion + Slack"}
          </Button>
          <span className="text-xs text-slate-400">
            Also saved locally on this device.
          </span>
          {saveMessage && (
            <span className="ml-auto text-sm font-medium text-emerald-600">
              {saveMessage}
            </span>
          )}
        </div>
      </Card>

      <Card className="bg-slate-50">
        <h4 className="mb-2 text-sm font-bold text-slate-700">
          Next: generate HTML
        </h4>
        <p className="text-sm text-slate-500">
          Once status is <strong>Brief Ready</strong>, run the{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">
            wnlq9-blog-writer
          </code>{" "}
          skill with this brief to produce{" "}
          <strong>{BRANDS[brief.brand].name}</strong> HTML, then upload to Google
          Drive and paste into Magento.
        </p>
      </Card>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
