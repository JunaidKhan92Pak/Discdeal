/**
 * Loads the spreadsheets into your Postgres database (Supabase):
 *   npm run db:import                    (data/cards.csv + data/deals.csv)
 *   npm run db:import -- my-deals.csv    (another deals file)
 * Needs DATABASE_URL in .env.local (see docs/GETTING-STARTED.md). Safe to run again and again: each run makes the
 * database match the files. If any row has a problem, nothing is changed and the problems are listed.
 * If Redis is configured, it also tells every server to drop its cached answers so the change shows at once.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { Redis } from "@upstash/redis";
import postgres from "postgres";
import { syncCatalog } from "@/lib/db-sql";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("\nDATABASE_URL is not set. Add it to .env.local first (see docs/GETTING-STARTED.md).\n");
  process.exit(1);
}

const dealsFile = process.argv[2] ?? "data/deals.csv";
const [cardsCsv, dealsCsv] = await Promise.all([readFile("data/cards.csv", "utf8"), readFile(dealsFile, "utf8")]);
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });

try {
  // Creates the tables if they are missing (same file you can paste into Supabase's SQL Editor).
  await sql.unsafe(await readFile("db/schema.sql", "utf8"));
  const result = await sql.begin((tx) => syncCatalog((text, params) => tx.unsafe(text, params as never[]), cardsCsv, dealsCsv));
  if (result.problems.length > 0) {
    console.error("\nNothing was imported. Fix these rows first:\n");
    for (const problem of result.problems) console.error(`  • ${problem}`);
    process.exitCode = 1;
  } else {
    const [{ live }] = await sql<{ live: number }[]>`select count(*)::int as live from deals where is_active`;
    console.log(`\n✓ Imported ${result.cards} cards and ${result.deals} deals. ${live} deals are active in the database.`);
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (redisUrl && redisToken) {
      await new Redis({ url: redisUrl, token: redisToken }).incr("discdeal:data-version");
      console.log("  Cached answers cleared (Redis): the website shows the new data within seconds.\n");
    } else {
      console.log("  The website picks up the change within about a minute.\n");
    }
  }
} catch (error) {
  console.error("\nCould not reach the database. Check DATABASE_URL in .env.local.\n", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
