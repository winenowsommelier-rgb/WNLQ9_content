import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeUrl, ga4Url, mergeGaGsc, mineQueries } from "../src/ga-gsc.mjs";

test("normalizeUrl lower-cases host, adds https, trims trailing dir slash, keeps files", () => {
  assert.equal(normalizeUrl("TH.Wine-Now.com/blog/x.html"), "https://th.wine-now.com/blog/x.html");
  assert.equal(normalizeUrl("https://th.liq9.com/blog/"), "https://th.liq9.com/blog");
  assert.equal(normalizeUrl("https://th.liq9.com/blog/whisky-101.html"), "https://th.liq9.com/blog/whisky-101.html");
  assert.equal(normalizeUrl(""), "");
});

test("ga4Url joins host+path and strips query/fragment", () => {
  assert.equal(ga4Url("th.wine-now.com", "/blog/x.html?utm=1#top"), "https://th.wine-now.com/blog/x.html");
});

test("mergeGaGsc joins GA4 + GSC on URL and attaches top queries", () => {
  const merged = mergeGaGsc({
    ga4: [{ url: "https://th.liq9.com/blog/whisky-101.html", views: 120, sessions: 90, engagedSessions: 60, conversions: 2 }],
    gscPages: [{ url: "https://th.liq9.com/blog/whisky-101.html", clicks: 30, impressions: 800, ctr: 0.0375, position: 6.2 }],
    gscQueries: [
      { url: "https://th.liq9.com/blog/whisky-101.html", query: "วิสกี้ คือ", clicks: 20, impressions: 500, position: 5 },
      { url: "https://th.liq9.com/blog/whisky-101.html", query: "single malt", clicks: 5, impressions: 200, position: 9 },
    ],
  });
  assert.equal(merged.length, 1);
  const r = merged[0];
  assert.equal(r.views, 120);
  assert.equal(r.clicks, 30);
  assert.equal(r.impressions, 800);
  assert.equal(r.position, 6.2);
  assert.equal(r.conversions, 2);
  assert.equal(r.topQueries.length, 2);
  assert.equal(r.topQueries[0].query, "วิสกี้ คือ"); // sorted by clicks desc
});

test("mergeGaGsc sums duplicate GA4 host/path rows and a GSC-only URL still appears", () => {
  const merged = mergeGaGsc({
    ga4: [
      { url: "https://th.wine-now.com/blog/a.html", views: 10 },
      { url: "https://th.wine-now.com/blog/a.html", views: 5 },
    ],
    gscPages: [{ url: "https://th.wine-now.com/blog/b.html", clicks: 1, impressions: 40, ctr: 0.025, position: 12 }],
  });
  const a = merged.find((m) => m.path === "/blog/a.html");
  const b = merged.find((m) => m.path === "/blog/b.html");
  assert.equal(a.views, 15);
  assert.equal(a.impressions, 0);
  assert.equal(b.clicks, 1);
  assert.equal(b.views, 0);
});

test("mineQueries aggregates by query, filters low impressions, computes weighted position", () => {
  const out = mineQueries(
    [
      { url: "https://x/1", query: "ไวน์แดง", clicks: 2, impressions: 100, position: 10 },
      { url: "https://x/2", query: "ไวน์แดง", clicks: 1, impressions: 100, position: 20 },
      { url: "https://x/3", query: "rare", clicks: 0, impressions: 5, position: 50 },
    ],
    { minImpressions: 50 },
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].query, "ไวน์แดง");
  assert.equal(out[0].impressions, 200);
  assert.equal(out[0].clicks, 3);
  assert.equal(out[0].position, 15); // (10*100 + 20*100)/200
  assert.equal(out[0].pages, 2);
});
