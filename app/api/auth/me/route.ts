import type { NextRequest } from "next/server";
import { publicUser } from "@/lib/account-sql";
import { dbQuery } from "@/lib/server/db";
import { rateLimit, visitorId } from "@/lib/server/rate-limit";
import { currentUser, reply } from "@/lib/server/session";

/**
 * GET /api/auth/me → {user} or {user: null}. Asked once per visit. `accounts: false` tells the page that no database
 * is connected, so it can hide the log-in button instead of offering something that cannot work.
 */
export async function GET(request: NextRequest) {
  const limit = await rateLimit(visitorId(request.headers));
  if (!limit.ok) return reply({ error: "Too many requests." }, 429, { "Retry-After": String(limit.retryAfterSeconds) });
  const query = dbQuery();
  if (!query) return reply({ user: null, accounts: false });
  try {
    const user = await currentUser(query, request);
    return reply({ user: user && publicUser(user), accounts: true });
  } catch (error) {
    console.error("GET /api/auth/me failed", error);
    return reply({ user: null, accounts: true });
  }
}
