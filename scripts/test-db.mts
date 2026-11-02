/**
 * Tests the database code against a real Postgres that runs inside Node (PGlite), so no account is needed:
 *   npm run db:test
 * Creates the tables from db/schema.sql, imports data/cards.csv + data/deals.csv, reads them back the way the
 * website does, and checks the result matches reading the spreadsheets directly. Also checks re-imports, removed
 * rows, broken rows and deals that name an unknown card.
 */
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { csvToCards, recordsToCards } from "@/lib/cards-csv";
import { csvToDeals, parseCsv, recordsToDeals, todayInPakistan } from "@/lib/deals-csv";
import { SELECT_CARDS, SELECT_LIVE_DEALS, syncCatalog } from "@/lib/db-sql";

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

console.log(failed === 0 ? "\nAll database checks passed." : `\n${failed} check(s) failed.`);
process.exitCode = failed === 0 ? 0 : 1;
