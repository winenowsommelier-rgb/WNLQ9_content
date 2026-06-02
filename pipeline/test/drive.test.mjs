import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { buildSignedJwt } from "../src/drive.mjs";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

test("buildSignedJwt produces a verifiable RS256 token with correct claims", () => {
  const jwt = buildSignedJwt(
    { client_email: "svc@proj.iam.gserviceaccount.com", private_key: privateKey },
    { now: 1000 },
  );
  const [header, claims, signature] = jwt.split(".");
  assert.ok(header && claims && signature);

  // Signature verifies against the public key.
  const sig = Buffer.from(signature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const ok = createVerify("RSA-SHA256").update(`${header}.${claims}`).verify(publicKey, sig);
  assert.equal(ok, true);

  // Claims are well-formed.
  const decoded = JSON.parse(Buffer.from(claims, "base64url").toString());
  assert.equal(decoded.iss, "svc@proj.iam.gserviceaccount.com");
  assert.equal(decoded.aud, "https://oauth2.googleapis.com/token");
  assert.equal(decoded.scope, "https://www.googleapis.com/auth/drive");
  assert.equal(decoded.iat, 1000);
  assert.equal(decoded.exp, 4600);
});
