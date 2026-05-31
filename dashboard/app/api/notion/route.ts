import { NextResponse } from "next/server";
import type { ContentBrief } from "@/lib/types";
import { BRANDS } from "@/lib/brands";
import { STATUS_LABEL } from "@/lib/types";

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

  const brandName = BRANDS[brief.brand]?.name ?? brief.brand;

  // Notion property names — adjust here if your DB uses different labels.
  const properties: Record<string, unknown> = {
    Topic: { title: [{ text: { content: brief.topic || "Untitled" } }] },
    Brand: { select: { name: brandName } },
    Status: { select: { name: STATUS_LABEL[brief.status] } },
    "Publish Date": brief.publishDate
      ? { date: { start: brief.publishDate } }
      : undefined,
    "SEO Keyword": brief.seoKeyword
      ? { rich_text: [{ text: { content: brief.seoKeyword } }] }
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
