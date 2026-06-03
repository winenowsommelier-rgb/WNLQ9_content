import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { buildSignedJwt, createGoogleAuth, parseServiceAccount, GA4_SCOPE, GSC_SCOPE } from "../src/google-auth.mjs";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
const sa = { client_email: "svc@proj.iam.gserviceaccount.com", private_key: privateKey };

test("buildSignedJwt carries both GA4 + GSC scopes and verifies", () => {
  const jwt = buildSignedJwt(sa, { scopes: [GA4_SCOPE, GSC_SCOPE], now: 1000 });
  const [header, claims, signature] = jwt.split(".");
  const sig = Buffer.from(signature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  assert.equal(createVerify("RSA-SHA256").update(`${header}.${claims}`).verify(publicKey, sig), true);
  const decoded = JSON.parse(Buffer.from(claims, "base64url").toString());
  assert.equal(decoded.scope, `${GA4_SCOPE} ${GSC_SCOPE}`);
  assert.equal(decoded.iss, sa.client_email);
});

test("parseServiceAccount rejects malformed input", () => {
  assert.throws(() => parseServiceAccount(""), /Missing GOOGLE_SERVICE_ACCOUNT_JSON/);
  assert.throws(() => parseServiceAccount("{nope"), /not valid JSON/);
  assert.throws(() => parseServiceAccount(JSON.stringify({ client_email: "x" })), /missing client_email/);
});

test("createGoogleAuth exchanges the JWT and caches the token", async () => {
  let calls = 0;
  const fetchImpl = async (url, opts) => {
    calls++;
    assert.equal(url, "https://oauth2.googleapis.com/token");
    assert.match(opts.body.toString(), /grant_type=urn/);
    return { ok: true, json: async () => ({ access_token: "tok-123", expires_in: 3600 }) };
  };
  const auth = createGoogleAuth({ config: { googleServiceAccount: JSON.stringify(sa) }, fetchImpl });
  assert.equal(await auth.getAccessToken(), "tok-123");
  assert.equal(await auth.getAccessToken(), "tok-123");
  assert.equal(calls, 1); // second call served from cache
});

test("createGoogleAuth surfaces token-exchange errors", async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, json: async () => ({ error_description: "bad jwt" }) });
  const auth = createGoogleAuth({ config: { googleServiceAccount: JSON.stringify(sa) }, fetchImpl });
  await assert.rejects(() => auth.getAccessToken(), /bad jwt/);
});
