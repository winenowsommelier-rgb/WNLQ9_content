import assert from "node:assert/strict";
import { test } from "node:test";
import { buildUserPrompt, parseDraftResponse } from "../src/llm.mjs";

test("parseDraftResponse handles a plain JSON object", () => {
  const r = parseDraftResponse('{"en":"Hello","th":"สวัสดี"}');
  assert.equal(r.contentEN, "Hello");
  assert.equal(r.contentTH, "สวัสดี");
});

test("parseDraftResponse strips code fences and surrounding prose", () => {
  const r = parseDraftResponse('Here you go:\n```json\n{"en":"A","th":"ก"}\n```\nThanks');
  assert.equal(r.contentEN, "A");
  assert.equal(r.contentTH, "ก");
});

test("parseDraftResponse throws on missing keys", () => {
  assert.throws(() => parseDraftResponse('{"en":"only english"}'), /missing/i);
});

test("parseDraftResponse throws when no JSON present", () => {
  assert.throws(() => parseDraftResponse("totally not json"), /No JSON/i);
});

test("buildUserPrompt includes the brief fields", () => {
  const p = buildUserPrompt({
    title: "Tannin 101",
    site: "LIQ9",
    targetKeyword: "what is tannin",
    contentBrief: "Explain tannin",
  });
  assert.match(p, /TITLE: Tannin 101/);
  assert.match(p, /SITE: LIQ9/);
  assert.match(p, /TARGET KEYWORD: what is tannin/);
});
