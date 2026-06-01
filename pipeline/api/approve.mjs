// POST /api/approve { pageId, file? } -> save the article to Google Drive,
// link it back on the Notion row, and mark "Done".
//
// Preferred output is a full, self-contained .html file (widgets, schema,
// styling preserved) — the exact HTML the team pastes into Magento. The HTML
// source is resolved from public/content via the pageId->file manifest
// (data/articles.json), or an explicit { file } in the request body. If no
// full HTML is found, it falls back to a plain Google Doc from Content EN/TH.
//
// Additional env: GOOGLE_SERVICE_ACCOUNT_JSON, DRIVE_FOLDER_ID.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createDriveClient } from "../src/drive.mjs";
import { createClient } from "../src/notion.mjs";
import { driveFileName, inlineStylesheet } from "../src/htmldoc.mjs";
import { approveToDrive } from "../src/pipeline.mjs";
import { requireSecret } from "./_auth.mjs";

const CONTENT_DIR = join(process.cwd(), "public", "content");

async function loadManifest() {
  try {
    const raw = await readFile(join(process.cwd(), "data", "articles.json"), "utf8");
    return JSON.parse(raw)?.articles || {};
  } catch {
    return {};
  }
}

// Build the resolver that turns a Notion item into a self-contained article.
function makeResolveHtml(manifest, explicitFile) {
  return async (item) => {
    const file = explicitFile || manifest[item.id];
    if (!file) return null;
    try {
      const [html, css] = await Promise.all([
        readFile(join(CONTENT_DIR, file), "utf8"),
        readFile(join(CONTENT_DIR, "assets", "article.css"), "utf8").catch(() => ""),
      ]);
      return { name: driveFileName(item, file.replace(/\.html$/, "")), html: inlineStylesheet(html, css) };
    } catch {
      return null;
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireSecret(req, res)) return;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    if (!body.pageId) {
      res.status(400).json({ ok: false, error: "pageId is required" });
      return;
    }
    const manifest = await loadManifest();
    const result = await approveToDrive(body.pageId, {
      notion: createClient(),
      drive: createDriveClient(),
      resolveHtml: makeResolveHtml(manifest, body.file),
    });
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
