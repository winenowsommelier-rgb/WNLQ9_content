import { NextResponse } from "next/server";
import type { SlackNotification } from "@/lib/types";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/** GET /api/slack — connection status (does NOT expose the URL) */
export async function GET() {
  return NextResponse.json({ configured: Boolean(SLACK_WEBHOOK_URL) });
}

/** POST /api/slack — send a status notification */
export async function POST(req: Request) {
  if (!SLACK_WEBHOOK_URL) {
    return NextResponse.json(
      {
        ok: false,
        reason: "not_configured",
        message: "Slack not configured. Add SLACK_WEBHOOK_URL to .env.local.",
      },
      { status: 200 },
    );
  }

  let body: SlackNotification;
  try {
    body = (await req.json()) as SlackNotification;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body.message }),
    });
    return NextResponse.json({ ok: res.ok });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: (err as Error).message },
      { status: 200 },
    );
  }
}
