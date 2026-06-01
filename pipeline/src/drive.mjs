// Create a Google Doc in Drive from an HTML body, using a service account.
// Dependency-free: JWT (RS256) is signed with node:crypto, then exchanged for
// an access token; the Doc is created via a multipart Drive upload (Drive
// converts the HTML body into a native Google Doc).
//
// Requires:
//   GOOGLE_SERVICE_ACCOUNT_JSON  '{"client_email":"...","private_key":"..."}'
//   DRIVE_FOLDER_ID              destination folder (shared with the SA)

import { createSign } from "node:crypto";
import { getConfig } from "./config.mjs";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true";
const SCOPE = "https://www.googleapis.com/auth/drive";

export class DriveError extends Error {
  constructor(message) {
    super(message);
    this.name = "DriveError";
  }
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Build + RS256-sign a JWT assertion for the JWT-bearer token grant. */
export function buildSignedJwt(serviceAccount, { now = Math.floor(Date.now() / 1000) } = {}) {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: SCOPE,
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

function parseServiceAccount(raw) {
  if (!raw) throw new DriveError("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  let sa;
  try {
    sa = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new DriveError("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!sa.client_email || !sa.private_key) {
    throw new DriveError("Service account JSON missing client_email / private_key");
  }
  return sa;
}

export function createDriveClient({ config = getConfig(), fetchImpl = fetch } = {}) {
  const sa = parseServiceAccount(config.googleServiceAccount);

  async function getAccessToken() {
    const assertion = buildSignedJwt(sa);
    const res = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new DriveError(data?.error_description || `Token exchange failed (${res.status})`);
    return data.access_token;
  }

  // Shared multipart upload: metadata part + content part.
  async function uploadMultipart({ metadata, contentType, content, fields = "id" }) {
    const token = await getAccessToken();
    const boundary = `wnlq9-${Date.now()}`;
    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${contentType}\r\n\r\n` +
      `${content}\r\n` +
      `--${boundary}--`;

    const res = await fetchImpl(`${UPLOAD_BASE}&fields=${encodeURIComponent(fields)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    const data = await res.json();
    if (!res.ok) throw new DriveError(data?.error?.message || `Drive upload failed (${res.status})`);
    return data;
  }

  return {
    /**
     * Create a native Google Doc from an HTML body (Drive converts it).
     * @returns {Promise<{id: string, url: string}>}
     */
    async createDoc({ name, html, folderId = config.driveFolderId }) {
      const data = await uploadMultipart({
        metadata: {
          name,
          mimeType: "application/vnd.google-apps.document",
          ...(folderId ? { parents: [folderId] } : {}),
        },
        contentType: "text/html; charset=UTF-8",
        content: html,
      });
      return { id: data.id, url: `https://docs.google.com/document/d/${data.id}/edit` };
    },

    /**
     * Upload a full, self-contained .html file — stored as-is (NOT converted to
     * a Doc), so widgets, schema, tables and styling are preserved for handoff.
     * @returns {Promise<{id: string, url: string}>}
     */
    async uploadHtmlFile({ name, html, folderId = config.driveFolderId }) {
      const fileName = name.endsWith(".html") ? name : `${name}.html`;
      const data = await uploadMultipart({
        metadata: { name: fileName, mimeType: "text/html", ...(folderId ? { parents: [folderId] } : {}) },
        contentType: "text/html; charset=UTF-8",
        content: html,
        fields: "id,webViewLink",
      });
      return { id: data.id, url: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view` };
    },
  };
}
