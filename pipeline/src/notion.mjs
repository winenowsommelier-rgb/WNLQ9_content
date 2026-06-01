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

    /** Create a page (content row) from a Notion `properties` object. */
    async createRow(properties) {
      return request("/pages", {
        method: "POST",
        body: { parent: { database_id: config.databaseId }, properties },
      });
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
  };
}
