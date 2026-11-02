/**
 * Stops one visitor (or a bot) from flooding the API, per IP and per minute, in two buckets:
 *   - "api":  searches and other reads, RATE_LIMIT_PER_MINUTE (120)
 *   - "auth": log in / register attempts, AUTH_ATTEMPTS_PER_MINUTE (10), so passwords cannot be guessed quickly
 * With Redis the count is shared by every server (sliding window, @upstash/ratelimit); without Redis each server
 * counts on its own. Normal use stays far below the limits: typing is debounced and answers are cached in the browser.
 */
import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/server/cache";
import { config } from "@/lib/server/config";

export type Bucket = "api" | "auth";

const perMinute: Record<Bucket, number> = { api: config.rateLimitPerMinute, auth: config.authAttemptsPerMinute };

const shared: Record<Bucket, Ratelimit> | null = redis
  ? {
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(perMinute.api, "60 s"),
        prefix: "discdeal:ratelimit",
        // Remembers blocked visitors in memory too, so a flood does not cost a Redis call per request.
        ephemeralCache: new Map(),
      }),
      auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(perMinute.auth, "60 s"), prefix: "discdeal:ratelimit:auth", ephemeralCache: new Map() }),
    }
  : null;

const local = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export async function rateLimit(visitor: string, bucket: Bucket = "api"): Promise<RateLimitResult> {
  if (shared) {
    try {
      const result = await shared[bucket].limit(visitor);
      return { ok: result.success, retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) };
    } catch (error) {
      console.warn("[rate-limit] Redis unavailable, using the local limit:", (error as Error).message);
    }
  }
  const key = `${bucket}:${visitor}`;
  const now = Date.now();
  const entry = local.get(key);
  if (!entry || entry.resetAt < now) {
    local.set(key, { count: 1, resetAt: now + 60_000 });
    if (local.size > 10_000) for (const [k, value] of local) if (value.resetAt < now) local.delete(k);
    return { ok: true, retryAfterSeconds: 0 };
  }
  entry.count++;
  return { ok: entry.count <= perMinute[bucket], retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
}

/** The visitor's IP as seen by the hosting platform (Vercel sets x-forwarded-for). */
export function visitorId(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
