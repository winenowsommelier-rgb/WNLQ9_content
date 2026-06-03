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

// Known monthly content databases. "Week Theme" is RETIRED going forward — only
// the historical June board still carries it; July (and every month after) drops
// it and instead exposes the editorial columns Author/Priority/Intent/Funnel/
// Evergreen. `schemaProfileFor()` maps a database id to its profile so
// validate/mapping only ever touch columns that exist on the target board.
export const DATABASES = {
  june: { id: "786d080f-8da2-4a1e-b84e-161f4e19d56d", month: "June 2026", hasWeekTheme: true },
  july: { id: "93ac15a8-bb65-40f7-b357-b8cabd336214", month: "July 2026", hasWeekTheme: false },
};

// Standard shape for any board we don't specifically recognise: the current,
// Week-Theme-free layout. This is the DEFAULT — new months inherit it with no
// code change (only add a DATABASES entry if a month's columns differ again).
// If we ever reintroduce Week Theme, set hasWeekTheme:true here.
export const STANDARD_PROFILE = { id: null, month: "July 2026", hasWeekTheme: false };
export const DEFAULT_PROFILE = STANDARD_PROFILE;

/** Resolve the schema profile for a database id (falls back to the standard shape). */
export function schemaProfileFor(databaseId) {
  for (const profile of Object.values(DATABASES)) {
    if (profile.id === databaseId) return profile;
  }
  return DEFAULT_PROFILE;
}

/** Parse PUBLISH_LANGS ("th" | "th,en") into a deduped lowercase list. */
export function parseLangs(raw) {
  const list = String(raw || "th")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? [...new Set(list)] : ["th"];
}

export function getConfig(env = process.env) {
  return {
    token: env.NOTION_TOKEN || env.NOTION_API_KEY || "",
    databaseId: env.NOTION_DATABASE_ID || DEFAULT_DATABASE_ID,

    // WNLQ9 BI / data-warehouse API (live product feed, bestsellers). Key name
    // is fixed by platform convention: WNLQ9_BI_API_KEY (sent as X-API-Key).
    biApiKey: env.WNLQ9_BI_API_KEY || "",
    biApiBase: env.WNLQ9_BI_API_BASE || "https://wnlq9-bi-api.vercel.app",

    // Languages to publish. Thai-only by default; set PUBLISH_LANGS="th,en" to
    // ALSO emit the English article from Content EN once the EN locale/URL
    // pattern is confirmed. This is THE switch that turns on bilingual output.
    publishLangs: parseLangs(env.PUBLISH_LANGS),

    // Shared secret guarding the dashboard API (fail-closed when unset).
    ingestSecret: env.INGEST_SECRET || "",

    // Anthropic (draft generation).
    anthropicKey: env.ANTHROPIC_API_KEY || "",
    anthropicModel: env.ANTHROPIC_MODEL || "claude-sonnet-4-6",

    // Google Drive (Doc creation on approval). Service-account JSON string
    // ({client_email, private_key}) + the destination Drive folder id.
    googleServiceAccount: env.GOOGLE_SERVICE_ACCOUNT_JSON || "",
    driveFolderId: env.DRIVE_FOLDER_ID || "",

    // Supabase (content_plan mirror + product picks). Service-role key is used
    // server-side only (it bypasses RLS); never expose it to the browser.
    supabaseUrl: env.SUPABASE_URL || "",
    supabaseServiceKey:
      env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || "",

    // Vercel Cron secret. When CRON_SECRET is set, Vercel sends
    // `Authorization: Bearer <CRON_SECRET>` to scheduled invocations.
    cronSecret: env.CRON_SECRET || "",
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
export const MONTHS = ["June 2026", "July 2026"];

// July board editorial columns (June expressed these as Week Theme instead).
export const AUTHORS = ["Wine-Now Sommelier Desk", "LIQ9 Bartender Desk", "Guest Expert"];
export const PRIORITIES = ["Hero", "Standard", "Filler"];
export const INTENTS = ["Informational", "Commercial", "Transactional", "Navigational"];
export const FUNNELS = ["TOFU", "MOFU", "BOFU"];
export const EVERGREENS = ["Evergreen", "Timely"];

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
  month: "July 2026",
};
