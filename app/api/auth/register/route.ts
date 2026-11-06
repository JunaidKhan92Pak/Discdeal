import { NextResponse, type NextRequest } from "next/server";
import { fieldErrors, RegisterSchema } from "@/lib/account";
import { createUser, publicUser } from "@/lib/account-sql";
import { hashPassword } from "@/lib/server/password";
import { accountRoute, PRIVATE, readJson, reply, startSession } from "@/lib/server/session";

/** POST /api/auth/register {name, city, email, phone, password, confirmPassword} → logged in. */
export async function POST(request: NextRequest) {
  const route = await accountRoute(request, "auth");
  if ("error" in route) return route.error;

  const parsed = RegisterSchema.safeParse(await readJson(request));
  if (!parsed.success) return reply({ errors: fieldErrors(parsed.error) }, 400);

  try {
    const created = await createUser(route.query, parsed.data, await hashPassword(parsed.data.password));
    if (!created.ok) return reply({ errors: { [created.field]: created.message } }, 409);
    const response = NextResponse.json({ user: publicUser(created.user) }, { status: 201, headers: PRIVATE });
    await startSession(route.query, response, created.user.id);
    return response;
  } catch (error) {
    console.error("POST /api/auth/register failed", error);
    return reply({ error: "Could not create the account right now. Please try again." }, 500);
  }
}
