/**
 * Runs in front of the API, before any route code (Next.js 16 "proxy", formerly middleware).
 * The browser only ever talks to this website's own /api/... addresses; the database and Redis addresses and keys
 * stay on the server and never reach the browser. This proxy turns away what the website itself never sends,
 * cheaply, before it can cost a search, a database call or a rate-limit count:
 *   - methods a route does not take (searches only read; only account routes accept POST / DELETE),
 *   - requests made by scripts on other websites (they cannot use our API from their pages),
 *   - changes (log in, register, likes) that do not come from a page on this site, are not JSON, or are too big,
 *   - addresses that are far too long to be a real search.
 */
import { NextResponse, type NextRequest } from "next/server";

const MAX_URL_LENGTH = 2000;
const MAX_BODY_BYTES = 10_000;

/** Which methods each API path accepts besides GET/HEAD. */
const WRITES: [RegExp, string[]][] = [
  [/^\/api\/auth\/(login|register|logout)$/, ["POST"]],
  [/^\/api\/likes$/, ["POST", "DELETE"]],
];

export function proxy(request: NextRequest) {
  const { method } = request;
  if (request.url.length > MAX_URL_LENGTH) return deny(414, "Request is too long.");

  if (method === "GET" || method === "HEAD") {
    if (isFromAnotherSite(request)) return deny(403, "This API is only for this website.");
    return NextResponse.next();
  }

  const allowed = WRITES.find(([path]) => path.test(request.nextUrl.pathname))?.[1] ?? [];
  if (!allowed.includes(method)) return deny(405, "This method is not allowed here.", { Allow: ["GET", "HEAD", ...allowed].join(", ") });
  // Changes must come from a page on this site (stops other websites acting for a logged-in visitor).
  if (!isFromThisSite(request)) return deny(403, "This API is only for this website.");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return deny(413, "Request is too big.");
  if (method === "POST" && !request.headers.get("content-type")?.startsWith("application/json")) return deny(415, "Send JSON.");
  return NextResponse.next();
}

/**
 * Browsers say where a request comes from (Sec-Fetch-Site, or Origin on older ones). Same site = allowed. A read
 * with neither (an app, a tool, a search engine) is allowed too; the rate limit takes care of floods.
 */
function isFromAnotherSite(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "cross-site";
  const origin = request.headers.get("origin");
  return origin !== null && !sameHost(origin, request);
}

/** Stricter, for changes: the browser must positively say the request comes from this site. */
function isFromThisSite(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = request.headers.get("origin");
  return origin !== null && sameHost(origin, request);
}

function sameHost(origin: string, request: NextRequest): boolean {
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

function deny(status: number, error: string, headers: Record<string, string> = {}) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export const config = {
  matcher: "/api/:path*",
};
