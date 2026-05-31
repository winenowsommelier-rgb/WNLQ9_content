import { NextResponse } from "next/server";
import type { ContentBrief } from "@/lib/types";

const NOTION_TOKEN = process.env.NOTION_API_TOKEN;
const NOTION_DB = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = "2022-06-28";

/** GET /api/notion — connection status (does NOT expose the token) */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(NOTION_TOKEN && NOTION_DB),
    databaseId: NOTION_DB ?? null,
  });
}

/**
 * POST /api/notion — create a brief row in the Notion database.
 * Body: ContentBrief. Falls back gracefully if not configured.
 */
export async function POST(req: Request) {
  if (!NOTION_TOKEN || !NOTION_DB) {
    return NextResponse.json(
      {
        ok: false,
        reason: "not_configured",
        message:
          "Notion is not configured. Add NOTION_API_TOKEN and NOTION_DATABASE_ID to .env.local.",
      },
      { status: 200 },
    );
  }

  let brief: ContentBrief;
  try {
    brief = (await req.json()) as ContentBrief;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // "Site" select option names in the real DB schema.
  const siteName = brief.brand === "liq9" ? "LIQ9" : "Wine-Now";

  // Map internal status → exact Notion select option names (note: "In progress").
  // DB options: Not started, Brief Ready, In progress, Review, Done, Published
  const NOTION_STATUS: Record<string, string> = {
    draft: "Not started",
    brief_ready: "Brief Ready",
    in_progress: "In progress",
    review: "Review",
    done: "Done",
    published: "Published",
  };
  const statusName = NOTION_STATUS[brief.status] ?? "Brief Ready";

  // Property names + types must match the data source schema exactly.
  // Title=title, Site/Status/Type/Month=select, Target Keyword/KEY/TENSION/STORY=text.
  const properties: Record<string, unknown> = {
    Title: { title: [{ text: { content: brief.topic || "Untitled" } }] },
    Site: { select: { name: siteName } },
    Status: { select: { name: statusName } },
    Type: { select: { name: "Blog" } },
    Month: { select: { name: "June 2026" } },
    "Publish Date": brief.publishDate
      ? { date: { start: brief.publishDate } }
      : undefined,
    "Target Keyword": brief.seoKeyword
      ? { rich_text: [{ text: { content: brief.seoKeyword } }] }
      : undefined,
    "Brief ID": brief.id
      ? { rich_text: [{ text: { content: brief.id } }] }
      : undefined,
    KEY: brief.key
      ? { rich_text: [{ text: { content: brief.key } }] }
      : undefined,
    TENSION: brief.tension
      ? { rich_text: [{ text: { content: brief.tension } }] }
      : undefined,
    STORY: brief.story
      ? { rich_text: [{ text: { content: brief.story } }] }
      : undefined,
  };
  // strip undefined props
  Object.keys(properties).forEach(
    (k) => properties[k] === undefined && delete properties[k],
  );

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB },
        properties,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: data?.message || "Notion error", detail: data },
        { status: 200 },
      );
    }
    return NextResponse.json({ ok: true, pageId: data.id });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: (err as Error).message },
      { status: 200 },
    );
  }
}
