/**
 * Runs in front of the API, before any route code (Next.js 16 "proxy", formerly middleware).
 * The browser only ever talks to this website's own /api/... addresses; the database and Redis addresses and keys
 * stay on the server and never reach the browser. This proxy turns away what the website itself never sends,
 * cheaply, before it can cost a search, a cache lookup or a rate-limit count:
 *   - anything but GET (the API only reads),
 *   - requests made by scripts on other websites (they cannot use our API from their pages),
 *   - addresses that are far too long to be a real search.
 */
import { NextResponse, type NextRequest } from "next/server";

const MAX_URL_LENGTH = 2000;

export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return deny(405, "Only GET is allowed.", { Allow: "GET, HEAD" });
  }
  if (isFromAnotherSite(request)) return deny(403, "This API is only for this website.");
  if (request.url.length > MAX_URL_LENGTH) return deny(414, "Request is too long.");
  return NextResponse.next();
}

/**
 * Browsers say where a request comes from (Sec-Fetch-Site, or Origin on older ones). Same site = allowed. A request
 * with neither (an app, a tool, a search engine) is allowed too; the rate limit takes care of floods.
 */
function isFromAnotherSite(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "cross-site";
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== request.headers.get("host");
  } catch {
    return true;
  }
}

function deny(status: number, error: string, headers: Record<string, string> = {}) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export const config = {
  matcher: "/api/:path*",
};
