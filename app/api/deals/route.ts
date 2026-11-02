import type { NextRequest } from "next/server";
import { parseDealQuery, toSearchParams } from "@/lib/query";
import { cached, dataVersion, debugHeaders } from "@/lib/server/cache";
import { getCatalog } from "@/lib/server/catalog";
import { config } from "@/lib/server/config";
import { rateLimit, visitorId } from "@/lib/server/rate-limit";
import { searchDeals } from "@/lib/server/search";
import type { DealQuery } from "@/lib/types";

/**
 * GET /api/deals?q=&city=&cat=&sub=&brand=&cards=&sort=&ids=&offset=&limit=
 * Repeat questions are answered without redoing the work: the CDN (s-maxage), then this server's memory, then
 * Redis (shared by all servers), and only then the search itself, once even if many identical requests arrive
 * together. While developing, the `X-Cache` header says which layer answered (memory / redis / fresh).
 */
export async function GET(request: NextRequest) {
  const limit = await rateLimit(visitorId(request.headers));
  if (!limit.ok) {
    return Response.json(
      { error: "Too many searches at once. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }

  const query = parseDealQuery(request.nextUrl.searchParams);
  try {
    const key = `search:${await dataVersion()}:${cacheKey(query)}`;
    const { value, from } = await cached(key, config.searchSeconds, async () => searchDeals(query, await getCatalog()), { shared: true });
    return Response.json(value, {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${config.cdnSeconds}, stale-while-revalidate=${config.cdnSeconds * 5}`,
        ...debugHeaders(from),
      },
    });
  } catch (error) {
    console.error("GET /api/deals failed", error);
    return Response.json({ error: "Search is unavailable right now. Please try again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

/** The same question always gives the same key (lists sorted, spaces tidied), so it hits the same cache entry. */
function cacheKey(query: DealQuery): string {
  return toSearchParams({
    ...query,
    q: query.q.trim().replace(/\s+/g, " "),
    ids: query.ids && [...query.ids].sort((a, b) => a - b),
    cards: query.cards && [...query.cards].sort(),
  }).toString();
}
