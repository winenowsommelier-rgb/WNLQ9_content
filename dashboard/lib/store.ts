"use client";

import type { ContentBrief } from "./types";

const KEY = "wnlq9_briefs_v1";

/** Local-first brief storage. Briefs live in localStorage so the dashboard
 *  works fully offline; "Save to Notion" additionally pushes to the API. */
export function loadBriefs(): ContentBrief[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ContentBrief[]) : [];
  } catch {
    return [];
  }
}

export function saveBriefs(briefs: ContentBrief[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(briefs));
}

export function upsertBrief(brief: ContentBrief): ContentBrief[] {
  const all = loadBriefs();
  const idx = all.findIndex((b) => b.id === brief.id);
  if (idx >= 0) all[idx] = brief;
  else all.unshift(brief);
  saveBriefs(all);
  return all;
}

export function deleteBrief(id: string): ContentBrief[] {
  const all = loadBriefs().filter((b) => b.id !== id);
  saveBriefs(all);
  return all;
}

export function newId(): string {
  // Stable-enough unique id without Date.now/Math.random restrictions in scripts
  return "b_" + crypto.randomUUID();
}
