// ============================================================
// WNLQ9 Dashboard — Core Type Definitions
// ============================================================

// ---------- Brands ----------
export type Brand = "wine-now" | "liq9";

// ---------- Content Status ----------
export type ContentStatus =
  | "draft"
  | "brief_ready"
  | "in_progress"
  | "review"
  | "done"
  | "published";

export const STATUS_ORDER: ContentStatus[] = [
  "draft",
  "brief_ready",
  "in_progress",
  "review",
  "done",
  "published",
];

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draft",
  brief_ready: "Brief Ready",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
  published: "Published",
};

// ---------- Content Brief ----------
export interface ContentBrief {
  id: string;
  brand: Brand;
  topic: string;
  key: string;
  tension: string;
  story: string;
  seoKeyword: string;
  publishDate: string; // YYYY-MM-DD
  status: ContentStatus;
  htmlFile?: string;
  magentoUrl?: string;
  gaViews?: number;
  createdAt: string; // ISO timestamp
  notionPageId?: string;
}

// ---------- GA4 Data ----------
export interface GA4Row {
  pageTitle: string;
  pagePath: string;
  views: number;
  users: number;
  avgEngagementTime: number;
  /** Authoritative brand from the data source (Supabase `site`). Falls back to a heuristic when absent. */
  brand?: Brand;
}

// ---------- GSC Data ----------
export interface GSCRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  /** Authoritative brand from the data source (Supabase `site`). Falls back to a heuristic when absent. */
  brand?: Brand;
}

// ---------- Brief generation option ----------
export interface BriefOption {
  topic: string;
  key: string;
  tension: string;
  story: string;
  seoKeyword: string;
  rationale: string;
  signalScore: number; // 0-100 derived from GA/GSC signals
}

// ---------- Slack ----------
export interface SlackNotification {
  event: "brief_created" | "html_generated" | "published";
  message: string;
}

// ---------- Connection status (Settings page) ----------
export interface ConnectionStatus {
  notion: boolean;
  slack: boolean;
  ga4: boolean;
  gsc: boolean;
}
