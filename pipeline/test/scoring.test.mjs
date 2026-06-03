import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, scoreAll, DEFAULT_THRESHOLDS } from "../src/scoring.mjs";

test("classify: win-scale = top-10 position with real clicks", () => {
  const c = classify({ position: 5, clicks: 40, impressions: 900, views: 200 });
  assert.ok(c.tags.includes("win-scale"));
  assert.equal(c.primary, "win-scale");
});

test("classify: striking-distance = page-2 position with demand", () => {
  const c = classify({ position: 14, clicks: 3, impressions: 400, views: 30 });
  assert.ok(c.tags.includes("striking-distance"));
  assert.equal(c.primary, "striking-distance");
});

test("classify: thin = low impressions and low views", () => {
  const c = classify({ position: 40, clicks: 0, impressions: 5, views: 2 });
  assert.deepEqual(c.tags, ["thin"]);
  assert.equal(c.primary, "thin");
});

test("classify: converter via conversions outranks other tags", () => {
  const c = classify({ position: 14, clicks: 3, impressions: 400, views: 30, conversions: 4 });
  assert.ok(c.tags.includes("converter"));
  assert.ok(c.tags.includes("striking-distance"));
  assert.equal(c.primary, "converter"); // priority order
});

test("classify: converter via commercial intent + views (no conversion event configured)", () => {
  const c = classify({ position: 30, clicks: 1, impressions: 10, views: 50, funnel: "BOFU" });
  assert.ok(c.tags.includes("converter"));
  assert.equal(c.primary, "converter");
});

test("classify: nothing qualifies -> none", () => {
  const c = classify({ position: 25, clicks: 2, impressions: 60, views: 25 });
  assert.equal(c.primary, "none");
  assert.deepEqual(c.tags, []);
});

test("classify respects threshold overrides", () => {
  const rec = { position: 6, clicks: 10, impressions: 100, views: 5 };
  assert.equal(classify(rec).primary, "none"); // 10 < default winClicks 20
  assert.equal(classify(rec, { ...DEFAULT_THRESHOLDS, winClicks: 5 }).primary, "win-scale");
});

test("scoreAll joins board rows by URL, sorts by score, reports unmatched + buckets", () => {
  const merged = [
    { url: "https://th.liq9.com/blog/whisky-101.html", position: 5, clicks: 40, impressions: 900, views: 200, conversions: 0 },
    { url: "https://th.wine-now.com/blog/thin.html", position: 40, clicks: 0, impressions: 4, views: 1, conversions: 0 },
  ];
  const board = [
    { id: "p1", finalUrl: "https://th.liq9.com/blog/whisky-101.html", title: "Whisky 101", funnel: "TOFU" },
    { id: "p2", finalUrl: "https://th.wine-now.com/blog/thin.html", title: "Thin one" },
    { id: "p3", finalUrl: "https://th.wine-now.com/blog/no-data.html", title: "Planned, no data" },
  ];
  const { scored, unmatchedBoard, buckets } = scoreAll(merged, board);

  assert.equal(scored[0].url, "https://th.liq9.com/blog/whisky-101.html");
  assert.equal(scored[0].bucket, "win-scale");
  assert.equal(scored[0].onBoard, true);
  assert.equal(scored[0].title, "Whisky 101");
  assert.equal(buckets["win-scale"], 1);
  assert.equal(buckets["thin"], 1);
  assert.equal(unmatchedBoard.length, 1);
  assert.equal(unmatchedBoard[0].id, "p3");
});
