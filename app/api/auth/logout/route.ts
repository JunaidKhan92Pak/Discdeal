import { NextResponse, type NextRequest } from "next/server";
import { accountRoute, endSession, PRIVATE, reply } from "@/lib/server/session";

/** POST /api/auth/logout → the session is deleted and the cookie cleared. */
export async function POST(request: NextRequest) {
  const route = await accountRoute(request, "api");
  if ("error" in route) return route.error;
  try {
    const response = NextResponse.json({ ok: true }, { headers: PRIVATE });
    await endSession(route.query, request, response);
    return response;
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return reply({ error: "Could not log out right now. Please try again." }, 500);
  }
}
