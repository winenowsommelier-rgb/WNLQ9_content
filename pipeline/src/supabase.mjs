// Thin Supabase client (PostgREST + RPC) over native fetch — no SDK dependency.
// Uses the service-role key, so it must only ever run server-side.

import { getConfig } from "./config.mjs";

export class SupabaseError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "SupabaseError";
    this.status = status;
    this.body = body;
  }
}

export function createSupabase(config = getConfig()) {
  const { supabaseUrl, supabaseServiceKey } = config;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new SupabaseError(
      "Missing Supabase config (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)",
      0,
      null,
    );
  }
  const base = supabaseUrl.replace(/\/$/, "");

  async function request(path, { method = "GET", body, headers = {} } = {}) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = data?.message || data?.error || `Supabase ${res.status}`;
      throw new SupabaseError(msg, res.status, data);
    }
    return data;
  }

  return {
    config,
    request,

    /** Upsert rows into a table, merging on the given conflict column(s). */
    async upsert(table, rows, onConflict) {
      if (!rows || rows.length === 0) return [];
      return request(
        `/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
        {
          method: "POST",
          body: rows,
          headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        },
      );
    },

    /** Call a Postgres function (RPC). */
    async rpc(fn, args = {}) {
      return request(`/rest/v1/rpc/${fn}`, { method: "POST", body: args });
    },
  };
}
