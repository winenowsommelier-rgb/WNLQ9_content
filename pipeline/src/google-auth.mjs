// Generalized Google service-account auth (dependency-free), shared by the
// GA4 + Search Console pull. Same proven pattern as drive.mjs (RS256 JWT signed
// with node:crypto, exchanged for an access token at the OAuth2 token endpoint)
// but with configurable scopes so one token can carry both
// analytics.readonly + webmasters.readonly.
//
// Requires GOOGLE_SERVICE_ACCOUNT_JSON = '{"client_email":"...","private_key":"..."}'.
// The same service account must be granted:
//   - Viewer on each GA4 property (Admin -> Property Access Management)
//   - a user (Restricted/Full) on each Search Console property
import { createSign } from "node:crypto";
import { getConfig } from "./config.mjs";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export class GoogleAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Build + RS256-sign a JWT-bearer assertion for the given scopes.
 * @param {{client_email:string, private_key:string}} serviceAccount
 * @param {{scopes?: string[]|string, now?: number}} [opts]
 */
export function buildSignedJwt(serviceAccount, { scopes = [GA4_SCOPE, GSC_SCOPE], now = Math.floor(Date.now() / 1000) } = {}) {
  const scope = Array.isArray(scopes) ? scopes.join(" ") : String(scopes);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claims}`;
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(serviceAccount.private_key, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${signingInput}.${signature}`;
}

export function parseServiceAccount(raw) {
  if (!raw) throw new GoogleAuthError("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  let sa;
  try {
    sa = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new GoogleAuthError("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!sa.client_email || !sa.private_key) {
    throw new GoogleAuthError("Service account JSON missing client_email / private_key");
  }
  return sa;
}

/**
 * @param {{config?: object, scopes?: string[], fetchImpl?: typeof fetch}} [opts]
 * @returns {{ serviceAccount: object, getAccessToken: () => Promise<string> }}
 */
export function createGoogleAuth({ config = getConfig(), scopes = [GA4_SCOPE, GSC_SCOPE], fetchImpl = fetch } = {}) {
  const sa = parseServiceAccount(config.googleServiceAccount);
  let cached = null; // { token, exp }

  async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cached && cached.exp - 60 > now) return cached.token;
    const assertion = buildSignedJwt(sa, { scopes, now });
    const res = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new GoogleAuthError(data?.error_description || data?.error || `Token exchange failed (${res.status})`);
    }
    cached = { token: data.access_token, exp: now + (data.expires_in || 3600) };
    return cached.token;
  }

  return { serviceAccount: sa, getAccessToken };
}
