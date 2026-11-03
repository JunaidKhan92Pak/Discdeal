/**
 * Login sessions. On log in / register the browser gets a random token in a cookie that page scripts cannot read
 * (HttpOnly), is sent only over HTTPS in production (Secure) and not on other websites' requests (SameSite=Lax).
 * The database keeps only the token's SHA-256, so a leaked copy of the table cannot be used to log in.
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { createSession, deleteExpiredSessions, deleteSession, userBySession, type Query, type UserRow } from "@/lib/account-sql";
import { config } from "@/lib/server/config";
import { dbQuery } from "@/lib/server/db";
import { rateLimit, visitorId, type Bucket } from "@/lib/server/rate-limit";

const COOKIE = "dd_session";

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

/** Starts a session for the user and puts its cookie on the response. */
export async function startSession(query: Query, response: NextResponse, userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + config.sessionDays * 86_400_000);
  await createSession(query, userId, hashToken(token), expires);
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  // Now and then (about 1 in 50 logins), clear sessions that have expired.
  if (Math.random() < 0.02) await deleteExpiredSessions(query).catch(() => {});
}

/** The logged-in user, or null (no cookie, unknown or expired session). */
export async function currentUser(query: Query, request: NextRequest): Promise<UserRow | null> {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  return userBySession(query, hashToken(token));
}

export async function endSession(query: Query, request: NextRequest, response: NextResponse): Promise<void> {
  const token = request.cookies.get(COOKIE)?.value;
  if (token && token.length <= 100) await deleteSession(query, hashToken(token));
  response.cookies.delete(COOKIE);
}

/** Answers about one person must never be cached by the CDN or shared between people. */
export const PRIVATE = { "Cache-Control": "private, no-store" };

export function reply(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...PRIVATE, ...headers } });
}

/**
 * The common start of every account route: rate limit, then the database (accounts need one).
 * Returns either a ready error response or the query runner.
 */
export async function accountRoute(request: NextRequest, bucket: Bucket): Promise<{ error: Response } | { query: Query }> {
  const limit = await rateLimit(visitorId(request.headers), bucket);
  if (!limit.ok) {
    return { error: reply({ error: "Too many tries. Please wait a minute and try again." }, 429, { "Retry-After": String(limit.retryAfterSeconds) }) };
  }
  const query = dbQuery();
  if (!query) return { error: reply({ error: "Accounts are not available right now. Please try again in a minute." }, 503) };
  return { query };
}

/** Reads a small JSON body; anything else (or over 10 KB) is null. */
export async function readJson(request: NextRequest): Promise<unknown> {
  const text = await request.text().catch(() => "");
  if (!text || text.length > 10_000) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
