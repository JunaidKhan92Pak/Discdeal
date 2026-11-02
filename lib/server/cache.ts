/**
 * One cache for the whole server, in three layers, so repeated questions never redo the work:
 *   1. memory:   instant, per server instance (a small LRU, entries expire)
 *   2. Redis:    shared by every server instance and survives restarts (only when Redis keys are set)
 *   3. the work: runs only on a miss, and only ONCE even if many identical requests arrive together
 *                ("single flight": the others wait for the same promise instead of hitting the database too)
 * Keys include a data version, so importing new deals makes every old answer unreachable at once.
 */
import "server-only";
import { Redis } from "@upstash/redis";
import { config } from "@/lib/server/config";

export const redis = config.redisUrl && config.redisToken ? new Redis({ url: config.redisUrl, token: config.redisToken }) : null;

const PREFIX = "discdeal:";
const MEMORY_LIMIT = 500;
const memory = new Map<string, { value: unknown; expires: number }>();
const inflight = new Map<string, Promise<{ value: unknown; from: CacheSource }>>();

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
    if (options.shared && redis) {
      try {
        const stored = await redis.get<T>(fullKey);
        if (stored !== null && stored !== undefined) {
          remember(fullKey, stored, Math.min(seconds, 15));
          return { value: stored, from: "redis" };
        }
      } catch (error) {
        console.warn("[cache] Redis read failed, continuing without it:", (error as Error).message);
      }
    }
    const value = await load();
    remember(fullKey, value, seconds);
    if (options.shared && redis) {
      redis.set(fullKey, value, { ex: seconds }).catch((error: Error) => console.warn("[cache] Redis write failed:", error.message));
    }
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
  const { value } = await cached("version-lookup", 5, async () => {
    try {
      return String((await redis!.get<number>(VERSION_KEY)) ?? 0);
    } catch {
      return "0";
    }
  });
  return value;
}

/** Called by the import script after new data is loaded. */
export async function bumpDataVersion(): Promise<boolean> {
  if (!redis) return false;
  await redis.incr(VERSION_KEY);
  return true;
}
