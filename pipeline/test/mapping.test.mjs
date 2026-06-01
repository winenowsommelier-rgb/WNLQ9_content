import assert from "node:assert/strict";
import { test } from "node:test";
import { briefToNotionProperties } from "../src/mapping.mjs";
import { normalizeBrief } from "../src/validate.mjs";

function mapped(raw) {
  const { ok, value, errors } = normalizeBrief(raw);
  assert.equal(ok, true, `expected valid brief, got: ${errors.join(", ")}`);
  return briefToNotionProperties(value);
}

test("maps every field to the correct Notion property shape", () => {
  const props = mapped({
    title: "Terroir in One Minute",
    site: "Wine-Now",
    category: "Education",
    type: "Blog",
    day: 3,
    publishDate: "2026-06-03",
    targetKeyword: "terroir meaning",
    contentBrief: "Explain terroir simply.",
    story: "Dirt has flavor.",
    tension: "Skeptics think it's marketing.",
    cta: "Shop terroir-driven wines",
    key: "WN-W1-03",
    finalUrl: "https://wine-now.com/blog/terroir",
    url: "https://wine-now.com/blog/terroir",
    gaViews: 0,
  });

  assert.equal(props["Title"].title[0].text.content, "Terroir in One Minute");
  assert.deepEqual(props["Site"], { select: { name: "Wine-Now" } });
  assert.deepEqual(props["Category"], { select: { name: "Education" } });
  assert.deepEqual(props["Week Theme"], { select: { name: "W1 Education" } });
  assert.deepEqual(props["Type"], { select: { name: "Blog" } });
  assert.deepEqual(props["Status"], { select: { name: "Brief Ready" } });
  assert.deepEqual(props["Month"], { select: { name: "June 2026" } });
  assert.deepEqual(props["Day"], { number: 3 });
  assert.deepEqual(props["GA Views"], { number: 0 });
  assert.deepEqual(props["Publish Date"], { date: { start: "2026-06-03" } });
  assert.equal(props["Target Keyword"].rich_text[0].text.content, "terroir meaning");
  assert.equal(props["STORY"].rich_text[0].text.content, "Dirt has flavor.");
  assert.equal(props["Final URL"].url, "https://wine-now.com/blog/terroir");
  assert.equal(props["URL"].url, "https://wine-now.com/blog/terroir");
});

test("omits properties for absent fields (partial brief)", () => {
  const props = mapped({ title: "Just a title", site: "LIQ9" });
  assert.ok("Title" in props);
  assert.ok("Site" in props);
  assert.ok("Status" in props); // defaulted
  assert.ok(!("Day" in props));
  assert.ok(!("Publish Date" in props));
  assert.ok(!("Final URL" in props));
});

test("expands a full ISO datetime publishDate to ISO start", () => {
  const props = mapped({
    title: "X",
    site: "LIQ9",
    publishDate: "2026-06-15T09:30:00.000Z",
  });
  assert.equal(props["Publish Date"].date.start, "2026-06-15T09:30:00.000Z");
});
