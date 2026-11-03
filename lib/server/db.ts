/**
 * One small Postgres connection pool per server, shared by the catalog and accounts. `prepare: false` is required
 * by Supabase's connection pooler. Returns null when DATABASE_URL is not set, or for a minute after the database
 * could not be reached (lib/server/health.ts), so callers fall back at once instead of waiting for it again.
 */
import "server-only";
import postgres from "postgres";
import type { Query } from "@/lib/account-sql";
import { config } from "@/lib/server/config";
import { isConnectionError, isUp, markDown } from "@/lib/server/health";

let sql: postgres.Sql | null = null;

export function database(): postgres.Sql | null {
  if (!config.databaseUrl || !isUp("database")) return null;
  sql ??= postgres(config.databaseUrl, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 5, onnotice: () => {} });
  return sql;
}

/** The pool as a plain `query(text, params) → rows` function (the shape lib/account-sql.ts uses). */
export function dbQuery(): Query | null {
  const db = database();
  if (!db) return null;
  return (async (text: string, params: unknown[]) => {
    try {
      return [...(await db.unsafe(text, params as never[]))];
    } catch (error) {
      if (isConnectionError(error)) markDown("database", error);
      throw error;
    }
  }) as Query;
}
