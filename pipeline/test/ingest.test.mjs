import assert from "node:assert/strict";
import { test } from "node:test";
import { ingestBrief, ingestBriefs } from "../src/ingest.mjs";

// A fake Notion client so the orchestration can be tested without the network.
function fakeClient({ existingIds = [] } = {}) {
  const created = [];
  return {
    created,
    async findByBriefId(id) {
      return existingIds.includes(id) ? { url: `https://notion.so/existing-${id}` } : null;
    },
    async createRow(properties) {
      created.push(properties);
      return { url: `https://notion.so/new-${created.length}` };
    },
  };
}

test("dry-run validates + maps without a client", async () => {
  const r = await ingestBrief(
    { title: "Tannin 101", site: "LIQ9", day: 7 },
    { dryRun: true },
  );
  assert.equal(r.status, "dry-run");
  assert.equal(r.briefId, "LQ9-D07-tannin-101");
  assert.equal(r.properties["Title"].title[0].text.content, "Tannin 101");
});

test("invalid brief returns errors, never calls client", async () => {
  const client = fakeClient();
  const r = await ingestBrief({ site: "LIQ9" }, { client });
  assert.equal(r.status, "invalid");
  assert.equal(client.created.length, 0);
});

test("creates a row via the client", async () => {
  const client = fakeClient();
  const r = await ingestBrief({ title: "X", site: "Wine-Now" }, { client });
  assert.equal(r.status, "created");
  assert.match(r.url, /notion\.so\/new-1/);
  assert.equal(client.created.length, 1);
});

test("skipExisting skips when Brief ID already present", async () => {
  const client = fakeClient({ existingIds: ["WN-D03-x"] });
  const r = await ingestBrief(
    { title: "X", site: "Wine-Now", day: 3 },
    { client, skipExisting: true },
  );
  assert.equal(r.status, "skipped");
  assert.equal(client.created.length, 0);
});

test("batch summary counts created / skipped / invalid", async () => {
  const client = fakeClient({ existingIds: ["WN-D01-already-there"] });
  const { summary } = await ingestBriefs(
    [
      { title: "New One", site: "Wine-Now", day: 2 },
      { title: "Already There", site: "Wine-Now", day: 1 },
      { site: "Wine-Now" }, // invalid: no title
    ],
    { client, skipExisting: true },
  );
  assert.equal(summary.total, 3);
  assert.equal(summary.created, 1);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.invalid, 1);
});
