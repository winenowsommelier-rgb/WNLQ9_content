// Thin Notion REST client (native fetch, no SDK dependency).

import { NOTION_API, NOTION_VERSION, getConfig } from "./config.mjs";

export class NotionError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "NotionError";
    this.status = status;
    this.body = body;
  }
}

// --- Property readers: turn a Notion page.properties value back into plain JS ---

function readText(prop) {
  const arr = prop?.title || prop?.rich_text || [];
  return arr.map((t) => t.plain_text ?? t.text?.content ?? "").join("");
}

/** Normalize a raw Notion page into the shape the dashboard consumes. */
export function pageToItem(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    url: page.url,
    lastEdited: page.last_edited_time,
    title: readText(p["Title"]),
    status: p["Status"]?.select?.name || null,
    site: p["Site"]?.select?.name || null,
    type: p["Type"]?.select?.name || null,
    category: p["Category"]?.select?.name || null,
    weekTheme: p["Week Theme"]?.select?.name || null,
    month: p["Month"]?.select?.name || null,
    day: p["Day"]?.number ?? null,
    publishDate: p["Publish Date"]?.date?.start || null,
    targetKeyword: readText(p["Target Keyword"]),
    contentBrief: readText(p["Content Brief"]),
    contentTH: readText(p["Content TH"]),
    contentEN: readText(p["Content EN"]),
    story: readText(p["STORY"]),
    tension: readText(p["TENSION"]),
    cta: readText(p["CTA"]),
    briefId: readText(p["Brief ID"]),
    key: readText(p["KEY"]),
    finalUrl: p["Final URL"]?.url || null,
    driveUrl: p["Drive file URL"]?.url || null,
    gaViews: p["GA Views"]?.number ?? null,
    // Editorial/SEO metadata (also mirrored into Supabase content_plan).
    funnel: p["Funnel"]?.select?.name || null,
    intent: p["Intent"]?.select?.name || null,
    schema: readText(p["Schema"]),
    wordTarget: p["Word Target"]?.number ?? null,
    evergreen: p["Evergreen"]?.select?.name || null,
    author: p["Author"]?.select?.name || null,
    priority: p["Priority"]?.select?.name || null,
  };
}

export function createClient(config = getConfig()) {
  if (!config.token) {
    throw new NotionError("Missing Notion token (set NOTION_TOKEN)", 0, null);
  }

  async function request(path, { method = "GET", body } = {}) {
    const res = await fetch(`${NOTION_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      const msg = data?.message || `Notion API ${res.status}`;
      throw new NotionError(msg, res.status, data);
    }
    return data;
  }

  return {
    config,
    request,

    /** Create a page (content row) from a Notion `properties` object. */
    async createRow(properties) {
      return request("/pages", {
        method: "POST",
        body: { parent: { database_id: config.databaseId }, properties },
      });
    },

    /** Patch an existing page's properties. */
    async updateRow(pageId, properties) {
      return request(`/pages/${pageId}`, { method: "PATCH", body: { properties } });
    },

    /** Fetch a single page. */
    async getRow(pageId) {
      return request(`/pages/${pageId}`);
    },

    /** Find an existing row by its "Brief ID" rich-text value. */
    async findByBriefId(briefId) {
      const data = await request(`/databases/${config.databaseId}/query`, {
        method: "POST",
        body: {
          filter: { property: "Brief ID", rich_text: { equals: briefId } },
          page_size: 1,
        },
      });
      return data.results?.[0] || null;
    },

    /**
     * List rows in the database (paginated), normalized for the dashboard.
     *
     * Supports server-side filtering so callers fetch only the rows they need
     * (e.g. one Day, a Day range, or a single Site) instead of pulling the whole
     * database and filtering in memory. Results default to Day ascending.
     *
     * @param {object}  [opts]
     * @param {number}  [opts.pageSize=100]
     * @param {number}  [opts.day]        exact Day number
     * @param {number}  [opts.dayFrom]    inclusive lower bound for Day
     * @param {number}  [opts.dayTo]      inclusive upper bound for Day
     * @param {string}  [opts.site]       "Wine-Now" | "LIQ9"
     * @param {string}  [opts.status]     e.g. "Review", "Done"
     * @param {object}  [opts.filter]     raw Notion filter to AND in (advanced)
     * @param {object[]}[opts.sorts]      raw Notion sorts (overrides default)
     */
    async listItems({ pageSize = 100, day, dayFrom, dayTo, site, status, filter, sorts } = {}) {
      const conditions = [];
      if (typeof day === "number") conditions.push({ property: "Day", number: { equals: day } });
      if (typeof dayFrom === "number") conditions.push({ property: "Day", number: { greater_than_or_equal_to: dayFrom } });
      if (typeof dayTo === "number") conditions.push({ property: "Day", number: { less_than_or_equal_to: dayTo } });
      if (site) conditions.push({ property: "Site", select: { equals: site } });
      if (status) conditions.push({ property: "Status", select: { equals: status } });
      if (filter) conditions.push(filter);
      const composedFilter =
        conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : { and: conditions };

      const items = [];
      let cursor;
      do {
        const data = await request(`/databases/${config.databaseId}/query`, {
          method: "POST",
          body: {
            page_size: pageSize,
            start_cursor: cursor,
            ...(composedFilter ? { filter: composedFilter } : {}),
            sorts: sorts || [{ property: "Day", direction: "ascending" }],
          },
        });
        for (const page of data.results || []) items.push(pageToItem(page));
        cursor = data.has_more ? data.next_cursor : undefined;
      } while (cursor);
      return items;
    },

    // --- Activity log: we use Notion page comments as the per-item log ---

    /** Append a log entry as a comment on the page. */
    async addLog(pageId, text) {
      return request("/comments", {
        method: "POST",
        body: {
          parent: { page_id: pageId },
          rich_text: [{ type: "text", text: { content: text } }],
        },
      });
    },

    /** Read the activity log (comments) for a page, oldest first. */
    async getLog(pageId) {
      const data = await request(`/comments?block_id=${pageId}`);
      return (data.results || []).map((c) => ({
        text: (c.rich_text || []).map((t) => t.plain_text ?? t.text?.content ?? "").join(""),
        createdAt: c.created_time,
      }));
    },
  };
}
