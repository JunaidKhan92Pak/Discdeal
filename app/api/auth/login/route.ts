import { NextResponse, type NextRequest } from "next/server";
import { fieldErrors, LoginSchema } from "@/lib/account";
import { findUserForLogin, publicUser } from "@/lib/account-sql";
import { DUMMY_HASH, verifyPassword } from "@/lib/server/password";
import { accountRoute, PRIVATE, readJson, reply, startSession } from "@/lib/server/session";

/** POST /api/auth/login {login: username or email, password} → logged in. */
export async function POST(request: NextRequest) {
  const route = await accountRoute(request, "auth");
  if ("error" in route) return route.error;

  const parsed = LoginSchema.safeParse(await readJson(request));
  if (!parsed.success) return reply({ errors: fieldErrors(parsed.error) }, 400);

  try {
    const user = await findUserForLogin(route.query, parsed.data.login);
    // Always check a password (a dummy one if there is no such user), so both cases take the same time.
    const ok = await verifyPassword(parsed.data.password, user?.password_hash ?? DUMMY_HASH);
    // One message for both, so nobody can find out which usernames exist.
    if (!user || !ok) return reply({ error: "Username/email or password is not right. Please check and try again." }, 401);
    const response = NextResponse.json({ user: publicUser(user) }, { headers: PRIVATE });
    await startSession(route.query, response, user.id);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return reply({ error: "Could not log in right now. Please try again." }, 500);
  }
}
