/**
 * Server settings, read from environment variables (.env.local on your computer, Project Settings on Vercel).
 * Every value has a sensible default, so nothing has to be set to get started.
 */
import "server-only";

function seconds(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export const config = {
  /** Postgres connection. Empty = read data/cards.csv and data/deals.csv instead. */
  databaseUrl: process.env.DATABASE_URL || "",
  /** Redis (Upstash). Vercel's Upstash integration sets the KV_* names; plain Upstash uses UPSTASH_*. */
  redisUrl: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "",
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "",
  /** How long one server keeps the loaded deals before asking the database again. */
  catalogSeconds: seconds("CATALOG_CACHE_SECONDS", 60),
  /** How long a search answer is reused (in memory and in Redis). */
  searchSeconds: seconds("SEARCH_CACHE_SECONDS", 60),
  /** How long browsers' CDN (e.g. Vercel's edge) may serve an answer without asking the server. */
  cdnSeconds: seconds("CDN_CACHE_SECONDS", 60),
  /** Requests one visitor may make per minute to the API before getting "slow down" (429). */
  rateLimitPerMinute: seconds("RATE_LIMIT_PER_MINUTE", 120),
};
