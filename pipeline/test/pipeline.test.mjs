import assert from "node:assert/strict";
import { test } from "node:test";
import { approveToDrive, generateDrafts } from "../src/pipeline.mjs";

// Build a minimal raw Notion page from plain fields.
function rawPage(fields = {}) {
  const rt = (v) => ({ rich_text: [{ plain_text: v }] });
  return {
    id: "page-1",
    url: "https://notion.so/page-1",
    properties: {
      Title: { title: [{ plain_text: fields.title || "X" }] },
      "Content EN": fields.contentEN ? rt(fields.contentEN) : { rich_text: [] },
      "Content TH": fields.contentTH ? rt(fields.contentTH) : { rich_text: [] },
    },
  };
}

function fakeNotion(page) {
  const calls = { updated: [], logs: [] };
  return {
    calls,
    async getRow() { return page; },
    async updateRow(id, props) { calls.updated.push({ id, props }); },
    async addLog(id, text) { calls.logs.push({ id, text }); },
  };
}

test("generateDrafts drafts content, writes it back, and moves to Review", async () => {
  const notion = fakeNotion(rawPage({ title: "Terroir" }));
  const draft = async () => ({ contentEN: "English body", contentTH: "เนื้อหาไทย" });

  const r = await generateDrafts("page-1", { notion, draft });

  assert.equal(r.status, "drafted");
  assert.equal(notion.calls.updated.length, 1);
  const props = notion.calls.updated[0].props;
  assert.equal(props["Content EN"].rich_text[0].text.content, "English body");
  assert.equal(props["Content TH"].rich_text[0].text.content, "เนื้อหาไทย");
  assert.deepEqual(props["Status"], { select: { name: "Review" } });
  assert.equal(notion.calls.logs.length, 1);
});

test("approveToDrive creates a Doc, links it back, and marks Done", async () => {
  const notion = fakeNotion(rawPage({ title: "Terroir", contentEN: "EN", contentTH: "TH" }));
  const drive = {
    created: [],
    async createDoc(doc) {
      this.created.push(doc);
      return { id: "doc1", url: "https://docs.google.com/document/d/doc1/edit" };
    },
  };

  const r = await approveToDrive("page-1", { notion, drive });

  assert.equal(r.status, "approved");
  assert.match(r.url, /document\/d\/doc1/);
  assert.equal(drive.created.length, 1);
  assert.match(drive.created[0].html, /<h1>Terroir<\/h1>/);
  const props = notion.calls.updated[0].props;
  assert.equal(props["Final URL"].url, "https://docs.google.com/document/d/doc1/edit");
  assert.equal(props["URL"].url, "https://docs.google.com/document/d/doc1/edit");
  assert.deepEqual(props["Status"], { select: { name: "Done" } });
});

test("approveToDrive refuses when drafts are missing", async () => {
  const notion = fakeNotion(rawPage({ title: "Terroir" })); // no content
  const drive = { async createDoc() { throw new Error("should not be called"); } };
  await assert.rejects(approveToDrive("page-1", { notion, drive }), /not generated/i);
});
