import type { NextRequest } from "next/server";
import { cached, dataVersion } from "@/lib/server/cache";
import { getCatalog } from "@/lib/server/catalog";
import { rateLimit, visitorId } from "@/lib/server/rate-limit";

/**
 * GET /api/meta: banks and cards (for "My cards"), live numbers ("146 discounts") and example searches, all worked
 * out from the data. It changes only when deals are imported, so it is cached for 5 minutes at the CDN.
 */
export async function GET(request: NextRequest) {
  const limit = await rateLimit(visitorId(request.headers));
  if (!limit.ok) return Response.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

  try {
    const { value, from } = await cached(`meta:${await dataVersion()}`, 300, async () => (await getCatalog()).meta, { shared: true });
    return Response.json(value, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600", "X-Cache": from },
    });
  } catch (error) {
    console.error("GET /api/meta failed", error);
    return Response.json({ error: "Unavailable right now." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
