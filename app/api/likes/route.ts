import type { NextRequest } from "next/server";
import { addLikes, likedIds, removeLike, type Query, type UserRow } from "@/lib/account-sql";
import { accountRoute, currentUser, readJson, reply } from "@/lib/server/session";

/**
 * The logged-in person's liked deals.
 *   GET    /api/likes            → {ids}
 *   POST   /api/likes {ids: []}  → saves them (also used once to move likes saved on the phone before logging in)
 *   DELETE /api/likes?id=123     → removes one
 */
async function withUser(request: NextRequest, run: (query: Query, user: UserRow) => Promise<Response>): Promise<Response> {
  const route = await accountRoute(request, "api");
  if ("error" in route) return route.error;
  try {
    const user = await currentUser(route.query, request);
    if (!user) return reply({ error: "Please log in to save deals." }, 401);
    return await run(route.query, user);
  } catch (error) {
    console.error(`${request.method} /api/likes failed`, error);
    return reply({ error: "Could not update your liked deals right now." }, 500);
  }
}

const isDealId = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;

export function GET(request: NextRequest) {
  return withUser(request, async (query, user) => reply({ ids: await likedIds(query, user.id) }));
}

export async function POST(request: NextRequest) {
  const body = (await readJson(request)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter(isDealId).slice(0, 500) : null;
  if (!ids) return reply({ error: "Send {ids: [deal ids]}." }, 400);
  return withUser(request, async (query, user) => reply({ ids: await addLikes(query, user.id, ids) }));
}

export function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!isDealId(id)) return Promise.resolve(reply({ error: "Send ?id=deal id." }, 400));
  return withUser(request, async (query, user) => {
    await removeLike(query, user.id, id);
    return reply({ ids: await likedIds(query, user.id) });
  });
}
