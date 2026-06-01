// Lifecycle orchestration on top of Notion + LLM + Drive.
// Each step updates the Notion row, appends an activity-log entry (a page
// comment), and advances the Status. All external collaborators are injectable
// so the orchestration is unit-testable without the network.

import { buildDoc } from "./docbuilder.mjs";
import { draftContent } from "./llm.mjs";
import { briefToNotionProperties } from "./mapping.mjs";
import { pageToItem } from "./notion.mjs";

/**
 * Generate Content EN + TH drafts for a row and move it to "Review".
 * @returns {Promise<{ status: 'drafted', contentEN: string, contentTH: string }>}
 */
export async function generateDrafts(pageId, { notion, draft = draftContent } = {}) {
  if (!notion) throw new Error("generateDrafts requires a notion client");

  const item = pageToItem(await notion.getRow(pageId));
  const { contentEN, contentTH } = await draft(item);

  await notion.updateRow(
    pageId,
    briefToNotionProperties({ contentEN, contentTH, status: "Review" }),
  );
  await notion.addLog(pageId, "Drafts generated (EN + TH) — moved to Review");

  return { status: "drafted", contentEN, contentTH };
}

/**
 * Approve a reviewed row: create the Google Doc, link it back, mark "Done".
 * @returns {Promise<{ status: 'approved', url: string }>}
 */
export async function approveToDrive(pageId, { notion, drive } = {}) {
  if (!notion) throw new Error("approveToDrive requires a notion client");
  if (!drive) throw new Error("approveToDrive requires a drive client");

  const item = pageToItem(await notion.getRow(pageId));
  if (!item.contentEN || !item.contentTH) {
    throw new Error("Cannot approve: Content EN/TH not generated yet");
  }

  const { name, html } = buildDoc(item);
  const { url } = await drive.createDoc({ name, html });

  await notion.updateRow(
    pageId,
    briefToNotionProperties({ finalUrl: url, url, status: "Done" }),
  );
  await notion.addLog(pageId, `Approved — saved to Google Drive: ${url}`);

  return { status: "approved", url };
}
