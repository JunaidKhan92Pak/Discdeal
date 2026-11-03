/**
 * Tests the database code against a real Postgres that runs inside Node (PGlite), so no account is needed:
 *   npm run db:test
 * Creates the tables from db/schema.sql, imports data/cards.csv + data/deals.csv, reads them back the way the
 * website does, and checks the result matches reading the spreadsheets directly. Also checks re-imports, removed
 * rows, broken rows and deals that name an unknown card. Then tests accounts: register, log in by username or email,
 * passwords, sessions (expiry, log out) and saved likes.
 */
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { csvToCards, recordsToCards } from "@/lib/cards-csv";
import { csvToDeals, parseCsv, recordsToDeals, todayInPakistan } from "@/lib/deals-csv";
import { SELECT_CARDS, SELECT_LIVE_DEALS, SYNC_CATALOG_STATEMENT, checkCatalog, syncCatalog, syncStatementParams } from "@/lib/db-sql";
import { RegisterSchema, normalizePhone } from "@/lib/account";
import { addLikes, createSession, createUser, deleteSession, findUserForLogin, likedIds, removeLike, userBySession, MAX_LIKES, type Query } from "@/lib/account-sql";
import { hashPassword, verifyPassword } from "@/lib/server/password";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
}

const db = new PGlite();
const today = todayInPakistan();
const cardsCsv = await readFile("data/cards.csv", "utf8");
const dealsCsv = await readFile("data/deals.csv", "utf8");
const cardsFromFile = csvToCards(cardsCsv);
const cardIds = new Set(cardsFromFile.cards.map((c) => c.id));
const fromFile = csvToDeals(dealsCsv, today, cardIds);
const sync = (cards: string, deals: string) => db.transaction((tx) => syncCatalog((text, params) => tx.query(text, params), cards, deals));

await db.exec(await readFile("db/schema.sql", "utf8"));
await db.exec(await readFile("db/schema.sql", "utf8"));
check("schema.sql creates the tables, and can be run twice", true);

const first = await sync(cardsCsv, dealsCsv);
check("import has no problems", first.problems.length === 0, first.problems.slice(0, 3).join(" | "));

const { rows: cardRows } = await db.query<Record<string, unknown>>(SELECT_CARDS);
const cardsFromDb = recordsToCards(cardRows);
const byCardId = <T extends { id: string }>(list: T[]) => JSON.stringify([...list].sort((a, b) => a.id.localeCompare(b.id)));
check("banks and cards read back exactly the same", byCardId(cardsFromDb.cards) === byCardId(cardsFromFile.cards) && byCardId(cardsFromDb.banks) === byCardId(cardsFromFile.banks), `${cardsFromDb.banks.length} banks, ${cardsFromDb.cards.length} cards`);
check("bank search words survive the database", cardsFromDb.banks.every((b) => b.aliases.length > 0));

async function live() {
  const { rows } = await db.query<Record<string, unknown>>(SELECT_LIVE_DEALS);
  return recordsToDeals(rows, today, cardIds);
}

const fromDb = await live();
check("database gives the same number of live deals as the file", fromDb.deals.length === fromFile.deals.length, `${fromDb.deals.length} vs ${fromFile.deals.length}`);
check("no row problems when reading back", fromDb.problems.length === 0, fromDb.problems.slice(0, 3).join(" | "));
const byId = new Map(fromFile.deals.map((d) => [d.id, d]));
const mismatched = fromDb.deals.filter((d) => JSON.stringify(d) !== JSON.stringify(byId.get(d.id)));
check("every deal reads back exactly the same (ids, cards, cities, dates)", mismatched.length === 0, mismatched.slice(0, 2).map((d) => d.brand).join(", "));
check("ended deals are not returned", fromFile.expired > 0 && fromDb.deals.every((d) => d.endsAt === null || d.endsAt >= today), `${fromFile.expired} ended`);

await sync(cardsCsv, dealsCsv);
const again = await live();
const { rows: total } = await db.query<{ n: number }>("select count(*)::int as n from deals");
check("importing twice changes nothing (no duplicates)", again.deals.length === fromDb.deals.length && total[0].n === first.deals, `${total[0].n} rows`);

const [header, firstRow, ...rest] = parseCsv(dealsCsv);
const toCsv = (rows: string[][]) => rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
await sync(cardsCsv, toCsv([header, ...rest]));
const afterRemove = await live();
check("a row removed from the file stops showing", afterRemove.deals.length === fromDb.deals.length - 1 && !afterRemove.deals.some((d) => d.brand === firstRow[0] && d.title === firstRow[3]));

const broken = toCsv([header, firstRow.map((c, i) => (header[i] === "discount_pct" ? "lots" : c)), ...rest]);
const rejected = await sync(cardsCsv, broken);
check("a broken row stops the whole import and changes nothing", rejected.problems.length === 1 && (await live()).deals.length === afterRemove.deals.length, rejected.problems[0]);

const unknownCard = toCsv([header, firstRow.map((c, i) => (header[i] === "card_ids" ? "meezan-debit" : c)), ...rest]);
const rejectedCard = await sync(cardsCsv, unknownCard);
check("a deal naming a card that is not in cards.csv is rejected", rejectedCard.problems.length === 1 && rejectedCard.problems[0].includes("meezan-debit"), rejectedCard.problems[0]);

/* ---------------- one-statement import (used over HTTPS when the database port is blocked) ---------------- */

const db2 = new PGlite();
await db2.exec(await readFile("db/schema.sql", "utf8"));
const syncOnce = async (cards: string, deals: string) => {
  const checked = checkCatalog(cards, deals);
  if (checked.problems.length > 0) return { problems: checked.problems, cards: 0, deals: 0 };
  const { rows } = await db2.query<{ cards: number; deals: number }>(SYNC_CATALOG_STATEMENT, syncStatementParams(checked));
  return { problems: [], ...rows[0] };
};
const once = await syncOnce(cardsCsv, dealsCsv);
check("one-statement import writes every card and deal", once.cards === cardsFromFile.cards.length && once.deals === first.deals, `${once.cards} cards, ${once.deals} deals`);
const live2 = async () => recordsToDeals((await db2.query<Record<string, unknown>>(SELECT_LIVE_DEALS)).rows, today, cardIds).deals;
const sorted = (list: { id: number }[]) => JSON.stringify([...list].sort((x, y) => x.id - y.id));
check("one-statement import gives exactly the same deals as the normal import", sorted(await live2()) === sorted(fromDb.deals));
const cards2 = recordsToCards((await db2.query<Record<string, unknown>>(SELECT_CARDS)).rows);
check("…and the same banks and cards", byCardId(cards2.cards) === byCardId(cardsFromFile.cards) && byCardId(cards2.banks) === byCardId(cardsFromFile.banks));
await syncOnce(cardsCsv, dealsCsv);
check("running it twice changes nothing", (await db2.query<{ n: number }>("select count(*)::int as n from deals")).rows[0].n === first.deals);
await syncOnce(cardsCsv, toCsv([header, ...rest]));
check("a row removed from the file stops showing (one statement)", (await live2()).length === fromDb.deals.length - 1);
const TRICKY = String.raw`It's "50%" off; C:\deals\new, 'quoted' -- not SQL`;
const tricky = toCsv([header, firstRow.map((c, i) => (header[i] === "description" ? TRICKY : c)), ...rest]);
await syncOnce(cardsCsv, tricky);
const trickyRow = (await live2()).find((d) => d.brand === firstRow[0] && d.title === firstRow[3]);
check("quotes, backslashes and SQL-looking text are stored exactly", trickyRow?.description === TRICKY, trickyRow?.description);

/* ---------------- accounts ---------------- */

const q: Query = async (text, params) => (await db.query(text, params)).rows as never;
const form = { name: "Ayesha Khan", username: "Ayesha_K", city: "lahore", email: "Ayesha@Example.com", phone: "0300-1234567", password: "chai-2026!", confirmPassword: "chai-2026!" };
const input = RegisterSchema.parse(form);
check("register form tidies input (lowercase username/email, +92 phone)", input.username === "ayesha_k" && input.email === "ayesha@example.com" && input.phone === "+923001234567");
check("phone numbers in every common form are understood", ["03001234567", "+92 300 1234567", "923001234567", "300 1234567"].every((p) => normalizePhone(p) === "+923001234567") && normalizePhone("12345") === null);
check("register form rejects bad input with a message per field", (() => {
  const bad = RegisterSchema.safeParse({ ...form, username: "a b", email: "nope", phone: "123", password: "short", confirmPassword: "other", city: "paris" });
  const fields = new Set(bad.success ? [] : bad.error.issues.map((i) => String(i.path[0])));
  return ["username", "email", "phone", "password", "city"].every((f) => fields.has(f));
})());
check("passwords must match", !RegisterSchema.safeParse({ ...form, confirmPassword: "chai-2027!" }).success);

const hash = await hashPassword(form.password);
check("password is stored as a hash, never as itself", hash.startsWith("scrypt$") && !hash.includes(form.password));
check("right password passes, wrong one fails", (await verifyPassword(form.password, hash)) && !(await verifyPassword("chai-2027!", hash)));

const created = await createUser(q, input, hash);
check("an account is created", created.ok);
const userId = created.ok ? created.user.id : "0";
const sameEmail = await createUser(q, { ...input, username: "someone_else" }, hash);
check("the same email cannot register twice", !sameEmail.ok && sameEmail.field === "email");
const sameName = await createUser(q, { ...input, email: "other@example.com" }, hash);
check("the same username cannot register twice", !sameName.ok && sameName.field === "username");
check("log in finds the account by username or by email", (await findUserForLogin(q, "ayesha_k"))?.id === userId && (await findUserForLogin(q, "ayesha@example.com"))?.id === userId);
check("an unknown login finds nothing", (await findUserForLogin(q, "nobody")) === null);

await createSession(q, userId, "token-a", new Date(Date.now() + 60_000));
await createSession(q, userId, "token-old", new Date(Date.now() - 60_000));
check("a session finds its user", (await userBySession(q, "token-a"))?.username === "ayesha_k");
check("an expired or unknown session finds nobody", (await userBySession(q, "token-old")) === null && (await userBySession(q, "nope")) === null);
await deleteSession(q, "token-a");
check("after log out the session is gone", (await userBySession(q, "token-a")) === null);

const [a, b, c] = fromFile.deals.map((d) => d.id);
await addLikes(q, userId, [a, b, a]);
const afterAdd = await addLikes(q, userId, [b, c]);
check("likes are saved once each, newest first", afterAdd.length === 3 && afterAdd[0] === c && new Set(await likedIds(q, userId)).size === 3);
await removeLike(q, userId, b);
check("a like can be removed", !(await likedIds(q, userId)).includes(b));
const many = await addLikes(q, userId, Array.from({ length: MAX_LIKES + 50 }, (_, i) => 1_000_000 + i));
check(`at most ${MAX_LIKES} likes per account`, many.length === MAX_LIKES);
await db.query("delete from users where id = $1", [userId]);
check("deleting an account deletes its sessions and likes", (await likedIds(q, userId)).length === 0);

console.log(failed === 0 ? "\nAll database checks passed." : `\n${failed} check(s) failed.`);
process.exitCode = failed === 0 ? 0 : 1;
