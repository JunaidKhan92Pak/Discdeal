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

/** A spreadsheet value (text) → the column's type. `value` is a parameter ($3) or a column of incoming rows (d.price). */
function dealValue(column: string, value: string): string {
  if (LIST_COLUMNS.has(column)) return `coalesce(string_to_array(nullif(${value}, ''), ';'), '{}')`;
  if (column === "price" || column === "original_price") return `nullif(${value}, '')::numeric`;
  if (column === "valid_until") return `nullif(${value}, '')::date`;
  if (column === "checked_on") return `${value}::date`;
  if (column === "discount_pct") return `${value}::smallint`;
  return value;
}

const DEAL_ON_CONFLICT = `on conflict (id) do update set ${COLUMNS.map((c) => `${c} = excluded.${c}`).join(", ")}, is_active = true, updated_at = now()`;
const CARD_ON_CONFLICT = `on conflict (card_id) do update set ${CARD_COLUMNS.filter((c) => c !== "card_id").map((c) => `${c} = excluded.${c}`).join(", ")}, is_active = true, updated_at = now()`;

/** Insert a deal, or update it if a deal with the same id exists. */
export const UPSERT_DEAL = `
  insert into deals (id, ${COLUMNS.join(", ")}, is_active, updated_at)
  values ($1, ${COLUMNS.map((c, i) => dealValue(c, `$${i + 2}`)).join(", ")}, true, now())
  ${DEAL_ON_CONFLICT}
`;

export const UPSERT_CARD = `
  insert into cards (${CARD_COLUMNS.join(", ")}, is_active, updated_at)
  values (${CARD_COLUMNS.map((_, i) => `$${i + 1}`).join(", ")}, true, now())
  ${CARD_ON_CONFLICT}
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

export type CheckedCatalog = { cards: CardRow[]; deals: DealRow[]; ids: number[]; problems: string[] };

/** Checks both spreadsheets (every deal's cards must exist in the cards file). Nothing is written. */
export function checkCatalog(cardsCsv: string, dealsCsv: string): CheckedCatalog {
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
  return { cards: cards.rows, deals, ids: [...ids], problems };
}

/**
 * Makes the `cards` and `deals` tables match the two spreadsheets. Everything is checked first; if ANY row has a
 * problem, NOTHING is changed and the problems are returned, so a half-fixed spreadsheet can never hide live deals.
 * Run it inside a transaction.
 */
export async function syncCatalog(run: RunSql, cardsCsv: string, dealsCsv: string): Promise<SyncResult> {
  const checked = checkCatalog(cardsCsv, dealsCsv);
  if (checked.problems.length > 0) return { cards: 0, deals: 0, problems: checked.problems };

  for (const row of checked.cards) await run(UPSERT_CARD, cardParams(row));
  await run(DEACTIVATE_MISSING_CARDS, [checked.cards.map((r) => r.card_id)]);
  for (const row of checked.deals) await run(UPSERT_DEAL, upsertParams(row));
  await run(DEACTIVATE_MISSING_DEALS, [checked.ids]);
  return { cards: checked.cards.length, deals: checked.deals.length, problems: [] };
}

/**
 * The same sync as ONE statement, for connections that cannot hold a transaction open (Supabase's HTTPS SQL
 * endpoint runs one statement per request). One statement is all-or-nothing by itself. The rows travel as two JSON
 * parameters, never pasted into the SQL text. Returns {cards, deals}: how many rows were written.
 */
export const SYNC_CATALOG_STATEMENT = `
  with card_in as (
    select * from jsonb_to_recordset($1::jsonb) as x(${CARD_COLUMNS.map((c) => `${c} text`).join(", ")})
  ), deal_in as (
    select * from jsonb_to_recordset($2::jsonb) as x(id text, ${COLUMNS.map((c) => `${c} text`).join(", ")})
  ), card_up as (
    insert into cards (${CARD_COLUMNS.join(", ")}, is_active, updated_at)
    select ${CARD_COLUMNS.join(", ")}, true, now() from card_in
    ${CARD_ON_CONFLICT}
    returning card_id
  ), card_off as (
    update cards set is_active = false, updated_at = now()
    where is_active and card_id not in (select card_id from card_in)
    returning card_id
  ), deal_up as (
    insert into deals (id, ${COLUMNS.join(", ")}, is_active, updated_at)
    select d.id::bigint, ${COLUMNS.map((c) => dealValue(c, `d.${c}`)).join(", ")}, true, now() from deal_in d
    ${DEAL_ON_CONFLICT}
    returning id
  ), deal_off as (
    update deals set is_active = false, updated_at = now()
    where is_active and id not in (select id::bigint from deal_in)
    returning id
  )
  select (select count(*) from card_up)::int as cards, (select count(*) from deal_up)::int as deals
`;

/** The two JSON parameters for SYNC_CATALOG_STATEMENT, from a checked catalog. */
export function syncStatementParams(checked: CheckedCatalog): [string, string] {
  const cards = checked.cards.map((row) => Object.fromEntries(CARD_COLUMNS.map((c, i) => [c, String(cardParams(row)[i] ?? "")])));
  const deals = checked.deals.map((row) => {
    const [id, ...values] = upsertParams(row);
    return { id: String(id), ...Object.fromEntries(COLUMNS.map((c, i) => [c, String(values[i] ?? "")])) };
  });
  return [JSON.stringify(cards), JSON.stringify(deals)];
}
