import type { NextRequest } from "next/server";
import { cacheLife } from "next/cache";
import { parseDealQuery } from "@/lib/query";
import { searchDeals } from "@/lib/server/deals-source";
import type { DealQuery } from "@/lib/types";

/**
 * GET /api/deals?q=&city=&cat=&sub=&brand=&sort=&ids=&offset=&limit=
 * Popular searches are answered from cache: on the server ("use cache", per query, refreshed every minute)
 * and at the CDN (s-maxage), so a burst of identical requests reaches the database once.
 */
export async function GET(request: NextRequest) {
  const query = parseDealQuery(request.nextUrl.searchParams);
  try {
    const page = await cachedSearch(query);
    return Response.json(page, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("GET /api/deals failed", error);
    return Response.json({ error: "Search is unavailable right now. Please try again." }, { status: 500 });
  }
}

async function cachedSearch(query: DealQuery) {
  "use cache";
  cacheLife("minutes");
  return searchDeals(query);
}
