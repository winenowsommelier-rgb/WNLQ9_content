import assert from "node:assert/strict";
import { test } from "node:test";
import { createGaGscClient } from "../src/ga-gsc.mjs";

const SA = JSON.stringify({
  client_email: "svc@proj.iam.gserviceaccount.com",
  // A throwaway 2048-bit key generated for tests only.
  private_key: (await import("node:crypto")).generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  }).privateKey,
});

function mockFetch(routes) {
  return async (url, opts = {}) => {
    if (url === "https://oauth2.googleapis.com/token") {
      return { ok: true, json: async () => ({ access_token: "tok", expires_in: 3600 }) };
    }
    for (const [pattern, handler] of routes) {
      if (url.includes(pattern)) return handler(url, opts);
    }
    return { ok: false, status: 404, json: async () => ({ error: { message: "no route" } }) };
  };
}

const config = {
  googleServiceAccount: SA,
  ga4Properties: ["properties/111"],
  gscSites: ["https://th.liq9.com/"],
};

test("checkAccess is green when GA4 metadata + GSC site both resolve", async () => {
  const fetchImpl = mockFetch([
    ["/metadata", async () => ({ ok: true, json: async () => ({ dimensions: [] }) })],
    ["/sites", async () => ({ ok: true, json: async () => ({ siteEntry: [{ siteUrl: "https://th.liq9.com/" }] }) })],
  ]);
  const client = createGaGscClient({ config, fetchImpl });
  const res = await client.checkAccess();
  assert.equal(res.ok, true);
  assert.equal(res.ga4[0].ok, true);
  assert.equal(res.gsc[0].ok, true);
});

test("checkAccess is red when the configured GSC site is not in the verified list", async () => {
  const fetchImpl = mockFetch([
    ["/metadata", async () => ({ ok: true, json: async () => ({}) })],
    ["/sites", async () => ({ ok: true, json: async () => ({ siteEntry: [{ siteUrl: "https://other.com/" }] }) })],
  ]);
  const res = await createGaGscClient({ config, fetchImpl }).checkAccess();
  assert.equal(res.ok, false);
  assert.equal(res.gsc[0].ok, false);
});

test("pullGa4 maps runReport rows into {url, views, conversions}", async () => {
  const fetchImpl = mockFetch([
    ["/properties/111:runReport", async () => ({
      ok: true,
      json: async () => ({
        rows: [
          {
            dimensionValues: [{ value: "th.liq9.com" }, { value: "/blog/whisky-101.html" }],
            metricValues: [{ value: "120" }, { value: "90" }, { value: "60" }, { value: "3" }],
          },
        ],
      }),
    })],
  ]);
  const rows = await createGaGscClient({ config, fetchImpl }).pullGa4({
    property: "properties/111",
    startDate: "2026-05-06",
    endDate: "2026-06-03",
  });
  assert.equal(rows[0].url, "https://th.liq9.com/blog/whisky-101.html");
  assert.equal(rows[0].views, 120);
  assert.equal(rows[0].conversions, 3);
});

test("pullGsc maps page+query rows", async () => {
  const fetchImpl = mockFetch([
    ["/searchAnalytics/query", async () => ({
      ok: true,
      json: async () => ({
        rows: [{ keys: ["https://th.liq9.com/blog/whisky-101.html", "วิสกี้"], clicks: 5, impressions: 200, ctr: 0.025, position: 8.1 }],
      }),
    })],
  ]);
  const rows = await createGaGscClient({ config, fetchImpl }).pullGsc({
    site: "https://th.liq9.com/",
    startDate: "2026-05-06",
    endDate: "2026-06-03",
    dimensions: ["page", "query"],
  });
  assert.equal(rows[0].url, "https://th.liq9.com/blog/whisky-101.html");
  assert.equal(rows[0].query, "วิสกี้");
  assert.equal(rows[0].position, 8.1);
});

test("pull surfaces API errors", async () => {
  const fetchImpl = mockFetch([
    ["/searchAnalytics/query", async () => ({ ok: false, status: 403, json: async () => ({ error: { message: "User does not have permission" } }) })],
  ]);
  await assert.rejects(
    () => createGaGscClient({ config, fetchImpl }).pullGsc({ site: "https://th.liq9.com/", startDate: "a", endDate: "b" }),
    /permission/,
  );
});
