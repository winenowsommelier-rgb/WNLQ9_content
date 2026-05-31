"use client";

import { useState } from "react";
import type { Brand, BriefOption, GA4Row, GSCRow } from "@/lib/types";
import { Card, SectionTitle, Button } from "./ui";
import { BRAND_LIST, BRANDS } from "@/lib/brands";
import { generateBriefOptions } from "@/lib/brief-generator";

export function BriefGenerator({
  ga4,
  gsc,
  onPick,
}: {
  ga4: GA4Row[];
  gsc: GSCRow[];
  onPick: (option: BriefOption, brand: Brand, date: string) => void;
}) {
  const [brand, setBrand] = useState<Brand>("wine-now");
  const [date, setDate] = useState<string>("");
  const [options, setOptions] = useState<BriefOption[] | null>(null);

  function generate() {
    setOptions(generateBriefOptions(brand, ga4, gsc));
  }

  return (
    <div className="space-y-5">
      <SectionTitle sub="Pick a brand + date, generate 3 data-driven options, then choose the strongest to refine.">
        Generate Brief
      </SectionTitle>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              Brand
            </label>
            <div className="flex gap-2">
              {BRAND_LIST.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBrand(b.id)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    brand === b.id
                      ? "border-transparent text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  style={
                    brand === b.id ? { backgroundColor: b.color } : undefined
                  }
                >
                  {b.emoji} {b.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              Publish Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <Button onClick={generate}>Generate 3 Options</Button>
        </div>
      </Card>

      {options && (
        <div className="grid gap-4 md:grid-cols-3">
          {options.map((o, i) => (
            <Card key={i} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: BRANDS[brand].color }}
                >
                  Option {i + 1}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Signal {o.signalScore}/100
                </span>
              </div>
              <h4 className="mb-2 font-bold text-slate-800">{o.topic}</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <span className="font-semibold text-slate-500">KEY:</span>{" "}
                  {o.key}
                </p>
                <p>
                  <span className="font-semibold text-slate-500">TENSION:</span>{" "}
                  {o.tension}
                </p>
                <p>
                  <span className="font-semibold text-slate-500">KEYWORD:</span>{" "}
                  <span className="text-indigo-600">{o.seoKeyword}</span>
                </p>
              </div>
              <p className="mt-3 rounded-md bg-slate-50 p-2 text-[11px] italic text-slate-400">
                {o.rationale}
              </p>
              <div className="mt-auto pt-4">
                <Button onClick={() => onPick(o, brand, date)}>
                  Use This →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
