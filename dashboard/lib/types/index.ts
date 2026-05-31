/**
 * WNLQ9 Blog Workflow Dashboard - Type Definitions
 */

// ===== BRIEF TYPES =====
export interface Brief {
  id: string;
  date: string; // YYYY-MM-DD
  brand: "wine-now" | "liq9";
  headline: string; // Topic
  key: string; // Main takeaway
  tension: string; // What readers wonder
  story: string; // Narrative arc
  seoKeyword: string; // Primary SEO keyword
  status: BriefStatus;
  notionPageId?: string; // Link back to Notion
  createdAt: string;
  updatedAt: string;
}

export type BriefStatus = "Pending" | "Brief Ready" | "In Progress" | "Review" | "Done" | "Published";

export interface BriefOption {
  id: string;
  headline: string;
  key: string;
  tension: string;
  story: string;
  seoKeyword: string;
  source: "ga-trend" | "gsc-keyword" | "manual";
  confidence: number; // 0-100
}

// ===== NOTION TYPES =====
export interface NotionDatabaseProperties {
  "Publish Date": { type: "date"; date?: { start: string } };
  Brand: { type: "select"; select?: { name: string } };
  Topic: { type: "title"; title: Array<{ text: { content: string } }> };
  KEY: { type: "rich_text"; rich_text: Array<{ text: { content: string } }> };
  TENSION: { type: "rich_text"; rich_text: Array<{ text: { content: string } }> };
  STORY: { type: "rich_text"; rich_text: Array<{ text: { content: string } }> };
  "SEO Keyword": { type: "rich_text"; rich_text: Array<{ text: { content: string } }> };
  Status: { type: "select"; select?: { name: BriefStatus } };
  "Brief ID": { type: "rich_text"; rich_text: Array<{ text: { content: string } }> };
  "HTML File": { type: "url"; url?: string };
  "Magento URL": { type: "url"; url?: string };
  "GA Views": { type: "number"; number?: number };
}

export interface NotionPage {
  id: string;
  properties: NotionDatabaseProperties;
  created_time: string;
  last_edited_time: string;
}

// ===== GA4 DATA TYPES =====
export interface GA4Topic {
  pagePath: string;
  pageTitle: string;
  views: number;
  users: number;
  bounceRate: number;
  deviceCategory: "mobile" | "desktop" | "tablet";
  trafficSource: string;
  trend?: "up" | "down" | "stable";
  trendPercent?: number;
}

export interface GA4Dataset {
  loadedAt: string;
  expiresAt: string;
  topics: GA4Topic[];
  lastRefresh: string;
}

// ===== GSC DATA TYPES =====
export interface GSCKeyword {
  keyword: string;
  brand: "wine-now" | "liq9";
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate (%)
  position: number; // Average position in search
  searchIntent?: "navigational" | "informational" | "transactional" | "comparison" | "how-to" | "shopping";
  opportunity?: number; // 0-100 score for content opportunity
}

export interface GSCDataset {
  loadedAt: string;
  expiresAt: string;
  keywords: GSCKeyword[];
  lastRefresh: string;
}

// ===== SETTINGS TYPES =====
export interface DashboardSettings {
  notionToken?: string;
  notionDatabaseId: string;
  slackWebhookUrl?: string;
  brands: ("wine-now" | "liq9")[];
  appUrl: string;
  cacheTtlHours: number;
  // Future: Google API credentials
  googleServiceAccountKey?: string;
  ga4PropertyIds?: Record<string, string>; // { "wine-now": "123...", "liq9": "456..." }
  gscDomains?: Record<string, string>; // { "wine-now": "wine-now.com", "liq9": "liq9.com" }
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface SlackNotification {
  event: "brief-created" | "html-generated" | "published";
  topic: string;
  brand: "wine-now" | "liq9";
  date: string;
  metadata?: Record<string, unknown>;
}

// ===== CALENDAR TYPES =====
export interface CalendarDay {
  date: string; // YYYY-MM-DD
  status?: BriefStatus;
  brief?: Brief;
  hasEvent: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number; // 1-12
  days: CalendarDay[];
}

// ===== PUBLICATION TRACKER TYPES =====
export interface PublicationRecord {
  date: string;
  brand: "wine-now" | "liq9";
  topic: string;
  briefStatus: BriefStatus;
  htmlGenerated: boolean;
  htmlFileUrl?: string;
  driveUploaded: boolean;
  magentoPublished: boolean;
  magentoUrl?: string;
  gaViews?: number;
  createdAt: string;
  updatedAt: string;
}

// ===== UI STATE TYPES =====
export interface DashboardState {
  currentMonth: {
    year: number;
    month: number;
  };
  selectedDate?: string;
  selectedBrief?: Brief;
  isLoading: boolean;
  error?: string;
  ga4Data: GA4Dataset | null;
  gscData: GSCDataset | null;
  settings: DashboardSettings;
}