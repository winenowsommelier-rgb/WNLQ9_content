import type { GA4Row, GSCRow } from "./types";

/** Minimal robust CSV parser — handles quoted fields and commas inside quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

/** Normalize a header cell: lowercase, strip underscores/spaces/dashes. */
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[_\s-]+/g, "");
}

function header(cols: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  cols.forEach((c, i) => {
    map[norm(c)] = i;
  });
  return map;
}

function pick(h: Record<string, number>, ...keys: string[]): number {
  for (const k of keys) {
    const nk = norm(k);
    if (nk in h) return h[nk];
  }
  return -1;
}

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[%,$\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function parseGA4(text: string): GA4Row[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const h = header(rows[0]);
  const iTitle = pick(h, "pagetitle", "page title", "title", "page");
  const iPath = pick(h, "pagepath", "page path", "path", "url");
  const iViews = pick(h, "views", "pageviews", "screen page views");
  const iUsers = pick(h, "users", "totalusers", "active users");
  const iEng = pick(h, "avgengagementtime", "average engagement time", "engagement");

  return rows.slice(1).map((r) => ({
    pageTitle: (iTitle >= 0 ? r[iTitle] : r[0]) ?? "",
    pagePath: (iPath >= 0 ? r[iPath] : "") ?? "",
    views: num(iViews >= 0 ? r[iViews] : undefined),
    users: num(iUsers >= 0 ? r[iUsers] : undefined),
    avgEngagementTime: num(iEng >= 0 ? r[iEng] : undefined),
  }));
}

export function parseGSC(text: string): GSCRow[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const h = header(rows[0]);
  const iQuery = pick(h, "query", "top queries", "keyword", "queries");
  const iClicks = pick(h, "clicks");
  const iImpr = pick(h, "impressions");
  const iCtr = pick(h, "ctr", "click through rate");
  const iPos = pick(h, "position", "avg position", "average position");

  return rows.slice(1).map((r) => ({
    query: (iQuery >= 0 ? r[iQuery] : r[0]) ?? "",
    clicks: num(iClicks >= 0 ? r[iClicks] : undefined),
    impressions: num(iImpr >= 0 ? r[iImpr] : undefined),
    ctr: num(iCtr >= 0 ? r[iCtr] : undefined),
    position: num(iPos >= 0 ? r[iPos] : undefined),
  }));
}
