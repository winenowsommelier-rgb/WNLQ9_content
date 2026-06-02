import assert from "node:assert/strict";
import { test } from "node:test";
import { pageToItem } from "../src/notion.mjs";

test("pageToItem normalizes a raw Notion page", () => {
  const page = {
    id: "page-123",
    url: "https://notion.so/page-123",
    last_edited_time: "2026-06-01T00:00:00.000Z",
    properties: {
      Title: { title: [{ plain_text: "Terroir in One Minute" }] },
      Status: { select: { name: "Review" } },
      Site: { select: { name: "Wine-Now" } },
      Category: { select: { name: "Education" } },
      "Week Theme": { select: { name: "W1 Education" } },
      Day: { number: 3 },
      "Publish Date": { date: { start: "2026-06-03" } },
      "Target Keyword": { rich_text: [{ plain_text: "what is terroir" }] },
      "Content EN": { rich_text: [{ plain_text: "English" }] },
      "Content TH": { rich_text: [{ plain_text: "ไทย" }] },
      "Brief ID": { rich_text: [{ plain_text: "WN-D03-terroir" }] },
      "Final URL": { url: "https://docs.google.com/document/d/abc/edit" },
      "Drive file URL": { url: "https://docs.google.com/document/d/abc/edit" },
    },
  };
  const it = pageToItem(page);
  assert.equal(it.id, "page-123");
  assert.equal(it.title, "Terroir in One Minute");
  assert.equal(it.status, "Review");
  assert.equal(it.site, "Wine-Now");
  assert.equal(it.day, 3);
  assert.equal(it.publishDate, "2026-06-03");
  assert.equal(it.contentEN, "English");
  assert.equal(it.contentTH, "ไทย");
  assert.equal(it.briefId, "WN-D03-terroir");
  assert.equal(it.driveUrl, "https://docs.google.com/document/d/abc/edit");
});

test("pageToItem tolerates missing properties", () => {
  const it = pageToItem({ id: "x", properties: {} });
  assert.equal(it.title, "");
  assert.equal(it.status, null);
  assert.equal(it.day, null);
});
