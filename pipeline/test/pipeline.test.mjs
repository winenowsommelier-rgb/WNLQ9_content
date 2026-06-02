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

test("approveToDrive creates a Doc, links it back, and marks Brief Ready", async () => {
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
  assert.ok(!("Final URL" in props)); // approve writes only the Drive file URL now
  assert.equal(props["Drive file URL"].url, "https://docs.google.com/document/d/doc1/edit");
  assert.deepEqual(props["Status"], { select: { name: "Brief Ready" } });
});

test("approveToDrive refuses when drafts are missing", async () => {
  const notion = fakeNotion(rawPage({ title: "Terroir" })); // no content
  const drive = { async createDoc() { throw new Error("should not be called"); } };
  await assert.rejects(approveToDrive("page-1", { notion, drive }), /not generated/i);
});

test("approveToDrive uploads full HTML when a resolver provides it", async () => {
  const notion = fakeNotion(rawPage({ title: "Old World", contentEN: "", contentTH: "" }));
  const drive = {
    uploaded: [],
    async createDoc() { throw new Error("should not build a Doc when full HTML exists"); },
    async uploadHtmlFile(file) {
      this.uploaded.push(file);
      return { id: "f1", url: "https://drive.google.com/file/d/f1/view" };
    },
  };
  const resolveHtml = async () => ({ name: "Old World — Wine-Now.html", html: "<html>full</html>" });

  const r = await approveToDrive("page-1", { notion, drive, resolveHtml });

  assert.equal(r.status, "approved");
  assert.equal(r.format, "html");
  assert.equal(drive.uploaded.length, 1);
  assert.match(drive.uploaded[0].name, /\.html$/);
  const props = notion.calls.updated[0].props;
  assert.equal(props["Drive file URL"].url, "https://drive.google.com/file/d/f1/view");
  assert.deepEqual(props["Status"], { select: { name: "Brief Ready" } });
});
