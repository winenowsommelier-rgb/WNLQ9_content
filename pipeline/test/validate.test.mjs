import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveBriefId, normalizeBrief, slugify } from "../src/validate.mjs";
import { DATABASES } from "../src/config.mjs";

// Week Theme is retired by default; the historical June board still has it.
const june = { profile: DATABASES.june };

test("requires title and site", () => {
  const { ok, errors } = normalizeBrief({});
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("title")));
  assert.ok(errors.some((e) => e.includes("site")));
});

test("derives weekTheme from category on the June profile", () => {
  const { ok, value } = normalizeBrief(
    { title: "Terroir in One Minute", site: "Wine-Now", category: "Education" },
    june,
  );
  assert.equal(ok, true);
  assert.equal(value.weekTheme, "W1 Education");
});

test("does NOT derive weekTheme by default (retired going forward)", () => {
  const { ok, value } = normalizeBrief({
    title: "Terroir in One Minute",
    site: "Wine-Now",
    category: "Education",
  });
  assert.equal(ok, true);
  assert.equal(value.weekTheme, undefined);
});

test("derives category from weekTheme on the June profile", () => {
  const { value } = normalizeBrief({ title: "X", site: "LIQ9", weekTheme: "W3 Travel" }, june);
  assert.equal(value.category, "Travel");
});

test("applies defaults for status and month", () => {
  const { value } = normalizeBrief({ title: "X", site: "Wine-Now" });
  assert.equal(value.status, "Brief Ready");
  assert.equal(value.month, "July 2026");
});

test("rejects invalid enum values", () => {
  const { ok, errors } = normalizeBrief({
    title: "X",
    site: "Wine-Now",
    type: "Newsletter",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("type")));
});

test("coerces numeric strings and validates them", () => {
  const { value } = normalizeBrief({ title: "X", site: "LIQ9", day: "3", gaViews: "120" });
  assert.equal(value.day, 3);
  assert.equal(value.gaViews, 120);

  const bad = normalizeBrief({ title: "X", site: "LIQ9", day: "soon" });
  assert.equal(bad.ok, false);
});

test("rejects invalid publishDate", () => {
  const { ok } = normalizeBrief({ title: "X", site: "LIQ9", publishDate: "not-a-date" });
  assert.equal(ok, false);
});

test("auto-derives a stable briefId", () => {
  const { value } = normalizeBrief({
    title: "Terroir in One Minute",
    site: "Wine-Now",
    day: 3,
  });
  assert.equal(value.briefId, "WN-D03-terroir-in-one-minute");
});

test("deriveBriefId is deterministic", () => {
  const brief = { title: "Tannin 101", site: "LIQ9", day: 7 };
  assert.equal(deriveBriefId(brief), deriveBriefId({ ...brief }));
  assert.equal(deriveBriefId(brief), "LQ9-D07-tannin-101");
});

test("slugify handles unicode + punctuation", () => {
  assert.equal(slugify("Proof vs. ABV?"), "proof-vs-abv");
  assert.equal(slugify(""), "untitled");
});
