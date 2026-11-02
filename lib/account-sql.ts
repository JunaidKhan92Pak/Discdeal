/**
 * The SQL for accounts, sessions and likes (tables in db/schema.sql). Each function takes a `query` runner, so the
 * same code runs on Supabase (the postgres package) and in the tests (PGlite, `npm run db:test`).
 */
import type { PublicUser, RegisterInput } from "@/lib/account";
import type { CityId } from "@/lib/types";

/** Runs one statement and returns its rows. */
export type Query = <T = Record<string, unknown>>(text: string, params: unknown[]) => Promise<T[]>;

export type UserRow = { id: string; username: string; name: string; city: string; email: string; password_hash: string };

/** A user may save this many deals; more is surely a script, not a person. */
export const MAX_LIKES = 500;

const USER_COLUMNS = "id::text as id, username, name, city, email, password_hash";

export function publicUser(row: UserRow): PublicUser {
  return { name: row.name, username: row.username, city: row.city as CityId, email: row.email };
}

export type CreateUserResult = { ok: true; user: UserRow } | { ok: false; field: "username" | "email"; message: string };

/** Creates the account. A taken username or email is reported on that field (checked again by the unique index). */
export async function createUser(query: Query, input: RegisterInput, passwordHash: string): Promise<CreateUserResult> {
  const taken = await query<{ username: string; email: string }>(`select username, email from users where username = $1 or email = $2`, [
    input.username,
    input.email,
  ]);
  const conflict = conflictOf(taken, input);
  if (conflict) return conflict;
  try {
    const [user] = await query<UserRow>(
      `insert into users (username, name, city, email, phone, password_hash) values ($1, $2, $3, $4, $5, $6) returning ${USER_COLUMNS}`,
      [input.username, input.name, input.city, input.email, input.phone, passwordHash],
    );
    return { ok: true, user };
  } catch (error) {
    // Two people registering the same name at the same moment: the unique index decides.
    if ((error as { code?: string }).code !== "23505") throw error;
    const again = await query<{ username: string; email: string }>(`select username, email from users where username = $1 or email = $2`, [
      input.username,
      input.email,
    ]);
    return conflictOf(again, input) ?? { ok: false, field: "username", message: "This username is already taken." };
  }
}

function conflictOf(rows: { username: string; email: string }[], input: RegisterInput): CreateUserResult | null {
  if (rows.some((r) => r.email === input.email)) return { ok: false, field: "email", message: "This email already has an account. Please log in." };
  if (rows.some((r) => r.username === input.username)) return { ok: false, field: "username", message: "This username is already taken. Try another." };
  return null;
}

/** The account for "username or email" (already lowercased), with its password hash for checking. */
export async function findUserForLogin(query: Query, login: string): Promise<UserRow | null> {
  const column = login.includes("@") ? "email" : "username";
  const [user] = await query<UserRow>(`select ${USER_COLUMNS} from users where ${column} = $1`, [login]);
  return user ?? null;
}

export async function createSession(query: Query, userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await query(`insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)`, [tokenHash, userId, expiresAt.toISOString()]);
}

/** The logged-in user for a session, or null when it is unknown or has expired. */
export async function userBySession(query: Query, tokenHash: string): Promise<UserRow | null> {
  const [user] = await query<UserRow>(
    `select ${USER_COLUMNS} from users where id = (select user_id from sessions where token_hash = $1 and expires_at > now())`,
    [tokenHash],
  );
  return user ?? null;
}

export async function deleteSession(query: Query, tokenHash: string): Promise<void> {
  await query(`delete from sessions where token_hash = $1`, [tokenHash]);
}

/** Expired sessions are useless; clearing them now and then keeps the table small. */
export async function deleteExpiredSessions(query: Query): Promise<void> {
  await query(`delete from sessions where expires_at <= now()`, []);
}

export async function likedIds(query: Query, userId: string): Promise<number[]> {
  const rows = await query<{ deal_id: string }>(`select deal_id::text as deal_id from likes where user_id = $1 order by created_at desc`, [userId]);
  return rows.map((r) => Number(r.deal_id));
}

/** Saves likes (already-saved ones are ignored), up to MAX_LIKES in total. Returns the full list. */
export async function addLikes(query: Query, userId: string, dealIds: number[]): Promise<number[]> {
  const current = await likedIds(query, userId);
  const room = MAX_LIKES - current.length;
  const fresh = [...new Set(dealIds)].filter((id) => !current.includes(id)).slice(0, Math.max(0, room));
  if (fresh.length > 0) {
    await query(`insert into likes (user_id, deal_id) select $1, unnest($2::bigint[]) on conflict do nothing`, [userId, fresh.map(String)]);
  }
  return [...fresh.reverse(), ...current];
}

export async function removeLike(query: Query, userId: string, dealId: number): Promise<void> {
  await query(`delete from likes where user_id = $1 and deal_id = $2`, [userId, String(dealId)]);
}
