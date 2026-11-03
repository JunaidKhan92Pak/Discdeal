/**
 * One cache for the whole server, in three layers, so repeated questions never redo the work:
 *   1. memory:   instant, per server instance (a small LRU, entries expire)
 *   2. Redis:    shared by every server instance and survives restarts (only when Redis keys are set)
 *   3. the work: runs only on a miss, and only ONCE even if many identical requests arrive together
 *                ("single flight": the others wait for the same promise instead of hitting the database too)
 * Keys include a data version, so importing new deals makes every old answer unreachable at once.
 * Redis is a speed-up, never a requirement: each call gives up after 1.5 s, and after a failure the site works from
 * memory alone for a minute (lib/server/health.ts), so a blocked or slow Redis never makes a search wait.
 */
import "server-only";
import { Redis } from "@upstash/redis";
import { config } from "@/lib/server/config";
import { isUp, markDown } from "@/lib/server/health";

const REDIS_TIMEOUT_MS = 1500;

export const redis =
  config.redisUrl && config.redisToken
    ? new Redis({ url: config.redisUrl, token: config.redisToken, retry: { retries: 0 }, signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS) })
    : null;

/** Runs a Redis call, or returns `fallback` when Redis is not set up, paused after a failure, or fails now. */
export async function withRedis<T>(fallback: T, call: (client: Redis) => Promise<T>): Promise<T> {
  if (!redis || !isUp("redis")) return fallback;
  try {
    return await call(redis);
  } catch (error) {
    markDown("redis", error);
    return fallback;
  }
}

const PREFIX = "discdeal:";
const MEMORY_LIMIT = 500;
// On globalThis: Next.js may load a separate copy of this file for each API route; they should share one cache
// (so the deals are loaded once per server, not once per route).
const shared = globalThis as typeof globalThis & {
  __discdealMemory?: Map<string, { value: unknown; expires: number }>;
  __discdealInflight?: Map<string, Promise<{ value: unknown; from: CacheSource }>>;
};
const memory = (shared.__discdealMemory ??= new Map());
const inflight = (shared.__discdealInflight ??= new Map());

export type CacheSource = "memory" | "redis" | "fresh";

function fromMemory(key: string): unknown | undefined {
  const entry = memory.get(key);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    memory.delete(key);
    return undefined;
  }
  memory.delete(key); // move to the end: most recently used
  memory.set(key, entry);
  return entry.value;
}

function remember(key: string, value: unknown, seconds: number) {
  memory.set(key, { value, expires: Date.now() + seconds * 1000 });
  while (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value!);
}

type Options = {
  /** Also store in Redis (shared). Off for big values such as the whole deal list. */
  shared?: boolean;
};

/** Returns the cached value for `key`, or runs `load` once and caches its result for `seconds`. */
export async function cached<T>(key: string, seconds: number, load: () => Promise<T>, options: Options = {}): Promise<{ value: T; from: CacheSource }> {
  const fullKey = PREFIX + key;
  const hit = fromMemory(fullKey);
  if (hit !== undefined) return { value: hit as T, from: "memory" };

  const pending = inflight.get(fullKey);
  if (pending) return pending as Promise<{ value: T; from: CacheSource }>;

  const work = (async (): Promise<{ value: unknown; from: CacheSource }> => {
    if (options.shared) {
      const stored = await withRedis<T | null>(null, (client) => client.get<T>(fullKey));
      if (stored !== null && stored !== undefined) {
        remember(fullKey, stored, Math.min(seconds, 15));
        return { value: stored, from: "redis" };
      }
    }
    const value = await load();
    remember(fullKey, value, seconds);
    if (options.shared) void withRedis(null, (client) => client.set(fullKey, value, { ex: seconds }));
    return { value, from: "fresh" };
  })().finally(() => inflight.delete(fullKey));

  inflight.set(fullKey, work);
  return work as Promise<{ value: T; from: CacheSource }>;
}

const VERSION_KEY = `${PREFIX}data-version`;

/**
 * The current data version. `npm run db:import` raises it in Redis, so every server drops its old answers within a
 * few seconds. Without Redis it is "local" and answers simply expire after their time.
 */
export async function dataVersion(): Promise<string> {
  if (!redis) return "local";
  const { value } = await cached("version-lookup", 5, async () => String((await withRedis<number | null>(0, (client) => client.get<number>(VERSION_KEY))) ?? 0));
  return value;
}

/** Called by the import script after new data is loaded. */
export async function bumpDataVersion(): Promise<boolean> {
  if (!redis) return false;
  await redis.incr(VERSION_KEY);
  return true;
}

/** Which cache layer answered, as a response header, only while developing (in production it stays private). */
export function debugHeaders(from: CacheSource): Record<string, string> {
  return process.env.NODE_ENV === "production" ? {} : { "X-Cache": from };
}
