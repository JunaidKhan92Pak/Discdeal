/**
 * The SQL the app and the import script send to Postgres, in one place (also run by `npm run db:test`).
 * Values go in as parameters ($1, $2 …), never pasted into the text, so a deal's text can never break a query.
 */
import { CARD_COLUMNS, csvToCards, type CardRow } from "@/lib/cards-csv";
import { COLUMNS, csvRecords, dealId, parseDealRow, type DealRow } from "@/lib/deals-csv";

/** Live deals, each column as plain text in the same shape as a spreadsheet row. */
export const SELECT_LIVE_DEALS = `
  select brand, offer, discount_pct::text as discount_pct, title, description, category, subcategory,
         array_to_string(cities, ';') as cities, array_to_string(channels, ';') as channels,
         array_to_string(card_ids, ';') as card_ids,
         coalesce(price::text, '') as price, coalesce(original_price::text, '') as original_price, code,
         coalesce(to_char(valid_until, 'YYYY-MM-DD'), '') as valid_until, source_url,
         to_char(checked_on, 'YYYY-MM-DD') as checked_on, tags, image_url
  from deals
  where is_active and (valid_until is null or valid_until >= (now() at time zone 'Asia/Karachi')::date)
`;

/** Active cards with their bank, in the same shape as a data/cards.csv row. */
export const SELECT_CARDS = `select ${CARD_COLUMNS.join(", ")} from cards where is_active order by bank_name, card_name`;

const LIST_COLUMNS = new Set(["cities", "channels", "card_ids"]);

/** Insert a deal, or update it if a deal with the same id exists. */
export const UPSERT_DEAL = `
  insert into deals (id, ${COLUMNS.join(", ")}, is_active, updated_at)
  values ($1, ${COLUMNS.map((c, i) => {
    const p = `$${i + 2}`;
    if (LIST_COLUMNS.has(c)) return `coalesce(string_to_array(nullif(${p}, ''), ';'), '{}')`;
    if (c === "price" || c === "original_price") return `nullif(${p}, '')::numeric`;
    if (c === "valid_until") return `nullif(${p}, '')::date`;
    if (c === "checked_on") return `${p}::date`;
    if (c === "discount_pct") return `${p}::smallint`;
    return p;
  }).join(", ")}, true, now())
  on conflict (id) do update set ${COLUMNS.map((c) => `${c} = excluded.${c}`).join(", ")}, is_active = true, updated_at = now()
`;

export const UPSERT_CARD = `
  insert into cards (${CARD_COLUMNS.join(", ")}, is_active, updated_at)
  values (${CARD_COLUMNS.map((_, i) => `$${i + 1}`).join(", ")}, true, now())
  on conflict (card_id) do update set ${CARD_COLUMNS.filter((c) => c !== "card_id").map((c) => `${c} = excluded.${c}`).join(", ")}, is_active = true, updated_at = now()
`;

/** Rows no longer in the spreadsheet stop showing (kept in the table for history). */
export const DEACTIVATE_MISSING_DEALS = `update deals set is_active = false, updated_at = now() where is_active and not (id = any($1::bigint[]))`;
export const DEACTIVATE_MISSING_CARDS = `update cards set is_active = false, updated_at = now() where is_active and not (card_id = any($1::text[]))`;

/** One checked row → the parameters for UPSERT_DEAL. */
export function upsertParams(row: DealRow): unknown[] {
  const text = (v: unknown) => (v === undefined || v === null ? "" : String(v));
  const values = COLUMNS.map((c) => {
    const v = row[c];
    if (LIST_COLUMNS.has(c)) return text(v).split(/[;,]/).map((x) => x.trim().toLowerCase()).filter(Boolean).join(";");
    return text(v);
  });
  return [dealId(row), ...values];
}

const cardParams = (row: CardRow): unknown[] => CARD_COLUMNS.map((c) => row[c]);

/** Runs one SQL statement with parameters (the postgres package and PGlite both fit this shape). */
export type RunSql = (text: string, params: unknown[]) => Promise<unknown>;

export type SyncResult = { cards: number; deals: number; problems: string[] };

/**
 * Makes the `cards` and `deals` tables match the two spreadsheets. Everything is checked first (every deal's cards
 * must exist in the cards file); if ANY row has a problem, NOTHING is changed and the problems are returned, so a
 * half-fixed spreadsheet can never hide live deals. Run it inside a transaction.
 */
export async function syncCatalog(run: RunSql, cardsCsv: string, dealsCsv: string): Promise<SyncResult> {
  const cards = csvToCards(cardsCsv);
  const problems = cards.problems.map((p) => `cards file, ${p}`);

  const cardIds = new Set(cards.cards.map((c) => c.id));
  const { records, problem } = csvRecords(dealsCsv, COLUMNS);
  if (problem) problems.push(`deals file: ${problem}`);

  const deals: DealRow[] = [];
  const ids = new Set<number>();
  records.forEach((record, index) => {
    const where = `deals file, row ${index + 2}${record.brand ? ` (${record.brand})` : ""}`;
    const checked = parseDealRow(record, cardIds);
    if (!checked.row) {
      problems.push(`${where}: ${checked.problems.join("; ")}`);
      return;
    }
    const id = dealId(checked.row);
    if (ids.has(id)) {
      problems.push(`${where}: same brand, title, cards and source as an earlier row`);
      return;
    }
    ids.add(id);
    deals.push(checked.row);
  });
  if (problems.length > 0) return { cards: 0, deals: 0, problems };

  for (const row of cards.rows) await run(UPSERT_CARD, cardParams(row));
  await run(DEACTIVATE_MISSING_CARDS, [cards.rows.map((r) => r.card_id)]);
  for (const row of deals) await run(UPSERT_DEAL, upsertParams(row));
  await run(DEACTIVATE_MISSING_DEALS, [[...ids]]);
  return { cards: cards.rows.length, deals: deals.length, problems: [] };
}
