// Configuration + canonical option sets for the WNLQ9 Content Production pipeline.
//
// The pipeline ingests content briefs (from the Dashboard or a JSON batch) and
// creates rows in the Notion "2026 JUN - WNLQ9 - Content Production" database.
//
// All option values below mirror the live Notion select schema exactly. If you
// change an option in Notion, update it here too (validation depends on it).

export const NOTION_API = "https://api.notion.com/v1";
export const NOTION_VERSION = "2022-06-28";

// The "2026 JUN - WNLQ9 - Content Production" database.
// Override per-environment with NOTION_DATABASE_ID.
export const DEFAULT_DATABASE_ID = "786d080f-8da2-4a1e-b84e-161f4e19d56d";

export function getConfig(env = process.env) {
  return {
    token: env.NOTION_TOKEN || env.NOTION_API_KEY || "",
    databaseId: env.NOTION_DATABASE_ID || DEFAULT_DATABASE_ID,
  };
}

// --- Canonical select options (must match the Notion schema) ---

export const SITES = ["Wine-Now", "LIQ9"];
export const TYPES = ["Pillar", "Blog", "Social"];
export const CATEGORIES = ["Education", "Pairing", "Travel", "Tips", "Spotlights"];
export const WEEK_THEMES = [
  "W1 Education",
  "W2 Pairing",
  "W3 Travel",
  "W4 Tips",
  "W5 Spotlights",
];
export const STATUSES = [
  "Not started",
  "Brief Ready",
  "In progress",
  "Review",
  "Done",
  "Published",
];
export const MONTHS = ["June 2026"];

// Category <-> Week Theme are 1:1 in the editorial calendar. Either can be
// derived from the other so the dashboard only has to supply one.
export const CATEGORY_TO_WEEK = {
  Education: "W1 Education",
  Pairing: "W2 Pairing",
  Travel: "W3 Travel",
  Tips: "W4 Tips",
  Spotlights: "W5 Spotlights",
};

export const WEEK_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_TO_WEEK).map(([cat, week]) => [week, cat]),
);

export const DEFAULTS = {
  status: "Brief Ready",
  month: "June 2026",
};
