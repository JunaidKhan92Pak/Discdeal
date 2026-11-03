/**
 * Loads the spreadsheets into your Postgres database (Supabase):
 *   npm run db:import                    (data/cards.csv + data/deals.csv)
 *   npm run db:import -- my-deals.csv    (another deals file)
 *   npm run db:import -- --https         (skip the direct connection and go straight to HTTPS)
 * Needs DATABASE_URL in .env.local (see docs/GETTING-STARTED.md). Safe to run again and again: each run makes the
 * database match the files. If any row has a problem, nothing is changed and the problems are listed.
 *
 * Some networks (offices, universities, some internet providers) block the database connection (ports 5432/6543)
 * but not normal web traffic. If SUPABASE_ACCESS_TOKEN is set too, the import then goes through Supabase's HTTPS
 * API instead: the same data, written in one all-or-nothing statement (SYNC_CATALOG_STATEMENT in lib/db-sql.ts).
 * If Redis is configured, it also tells every server to drop its cached answers so the change shows at once.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { Redis } from "@upstash/redis";
import postgres from "postgres";
import { isConnectionError } from "@/lib/connection-errors";
import { SYNC_CATALOG_STATEMENT, checkCatalog, syncCatalog, syncStatementParams } from "@/lib/db-sql";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL || "";
const token = process.env.SUPABASE_ACCESS_TOKEN || "";
const ref = process.env.SUPABASE_PROJECT_REF || projectRef(url);
const args = process.argv.slice(2);
const httpsOnly = args.includes("--https");

if (!url && !(token && ref)) {
  console.error("\nDATABASE_URL is not set. Add it to .env.local first (see docs/GETTING-STARTED.md).\n");
  process.exit(1);
}

const dealsFile = args.find((a) => !a.startsWith("--")) ?? "data/deals.csv";
const [cardsCsv, dealsCsv, schema] = await Promise.all([readFile("data/cards.csv", "utf8"), readFile(dealsFile, "utf8"), readFile("db/schema.sql", "utf8")]);

// Check everything before touching the database.
const checked = checkCatalog(cardsCsv, dealsCsv);
if (checked.problems.length > 0) {
  console.error("\nNothing was imported. Fix these rows first:\n");
  for (const problem of checked.problems) console.error(`  • ${problem}`);
  process.exit(1);
}

type Imported = { cards: number; deals: number; live: number };
let imported: Imported | null = null;

if (!httpsOnly && url) {
  try {
    imported = await importDirect();
  } catch (error) {
    if (!isConnectionError(error)) {
      console.error("\nThe import failed (nothing was changed):\n", error);
      process.exit(1);
    }
    if (!token || !ref) {
      console.error("\nCould not reach the database: your network may block database connections (ports 5432/6543).");
      console.error("Try mobile data, or add SUPABASE_ACCESS_TOKEN to .env.local to import over HTTPS instead");
      console.error('(see docs/GETTING-STARTED.md, "If npm run db:import says CONNECT_TIMEOUT").\n');
      process.exit(1);
    }
    console.log("\nThe database connection is blocked on this network; importing over HTTPS instead…");
  }
}
if (!imported) {
  try {
    imported = await importOverHttps();
  } catch (error) {
    console.error(`\nThe HTTPS import failed (nothing was changed): ${(error as Error).message}\n`);
    process.exit(1);
  }
}

console.log(`\n✓ Imported ${imported.cards} cards and ${imported.deals} deals. ${imported.live} deals are active in the database.`);
await refreshCache();

/* ---------------- the two ways in ---------------- */

/** The normal way: a direct Postgres connection, one transaction. */
async function importDirect(): Promise<Imported> {
  // With an HTTPS fallback ready, do not wait long for a connection that a network may be blocking.
  // onnotice: hides "table already exists, skipping" notes from schema.sql (expected on every run after the first).
  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: token ? 8 : 15, onnotice: () => {} });
  try {
    // Creates the tables if they are missing (same file you can paste into Supabase's SQL Editor).
    await sql.unsafe(schema);
    const result = await sql.begin((tx) => syncCatalog((text, params) => tx.unsafe(text, params as never[]), cardsCsv, dealsCsv));
    const [{ live }] = await sql<{ live: number }[]>`select count(*)::int as live from deals where is_active`;
    return { cards: result.cards, deals: result.deals, live };
  } finally {
    await sql.end({ timeout: 2 });
  }
}

/** Over HTTPS (port 443): Supabase's Management API runs SQL on the project, one statement per request. */
async function importOverHttps(): Promise<Imported> {
  await runSql(schema);
  const [written] = await runSql<{ cards: number; deals: number }>(SYNC_CATALOG_STATEMENT, syncStatementParams(checked));
  const [{ live }] = await runSql<{ live: number }>("select count(*)::int as live from deals where is_active");
  return { cards: Number(written.cards), deals: Number(written.deals), live: Number(live) };
}

async function runSql<T = Record<string, unknown>>(query: string, parameters?: unknown[]): Promise<T[]> {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(parameters ? { query, parameters } : { query }),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  if (response.status === 401) throw new Error("SUPABASE_ACCESS_TOKEN was not accepted (wrong, expired or revoked). Make a new one.");
  if (response.status === 403) throw new Error("SUPABASE_ACCESS_TOKEN may not change this project's database.");
  if (response.status === 404) throw new Error(`Supabase has no project "${ref}" for this token. Check SUPABASE_PROJECT_REF.`);
  if (!response.ok) throw new Error(`Supabase answered ${response.status}: ${text.slice(0, 300)}`);
  const body: unknown = text ? JSON.parse(text) : [];
  return (Array.isArray(body) ? body : []) as T[];
}

/** "postgresql://postgres.abcd1234@…pooler.supabase.com…" → "abcd1234" (Supabase's project id). */
function projectRef(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).username.split(".")[1] ?? "";
  } catch {
    return "";
  }
}

/** Tells every server to drop cached answers (Redis), or says when the website will catch up by itself. */
async function refreshCache() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const redis = new Redis({ url: redisUrl, token: redisToken, retry: { retries: 0 }, signal: () => AbortSignal.timeout(5000) });
      await redis.incr("discdeal:data-version");
      console.log("  Cached answers cleared (Redis): the website shows the new data within seconds.\n");
      return;
    } catch {
      console.log("  Could not reach Redis to clear cached answers.");
    }
  }
  console.log("  The website picks up the change within about a minute.\n");
}
