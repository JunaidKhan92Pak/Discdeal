/**
 * The banks-and-cards spreadsheet (data/cards.csv, or the `cards` table): one row per card, with its bank.
 * Adding a bank or a card is a row here, not a code change; the bank's aliases become search words.
 * No "server-only" here on purpose: the import script runs outside Next.js.
 */
import { z } from "zod";
import { csvRecords } from "@/lib/deals-csv";
import type { Bank, Card } from "@/lib/types";

export const CARD_COLUMNS = ["bank_id", "bank_name", "bank_short", "bank_aliases", "card_id", "card_name", "card_short"] as const;

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const id = (what: string) => z.string().trim().toLowerCase().regex(ID, `${what} must be lowercase letters, numbers and dashes, like hbl-konnect-debit`);

export const CardRowSchema = z.object({
  bank_id: id("bank_id"),
  bank_name: z.string().trim().min(1, "bank_name is empty"),
  bank_short: z.string().trim().min(1, "bank_short is empty"),
  bank_aliases: z.string().default(""),
  card_id: id("card_id"),
  card_name: z.string().trim().min(1, "card_name is empty"),
  card_short: z.string().trim().min(1, "card_short is empty"),
});

export type CardRow = z.infer<typeof CardRowSchema>;
export type ParsedCards = { banks: Bank[]; cards: Card[]; rows: CardRow[]; problems: string[] };

/** "hbl|habib bank|konnect" → ["hbl", "habib bank", "konnect"] */
const aliases = (value: string) => value.split("|").map((a) => a.trim()).filter(Boolean);

export function recordsToCards(records: Record<string, unknown>[], firstLine = 2): ParsedCards {
  const banks = new Map<string, Bank>();
  const cards: Card[] = [];
  const rows: CardRow[] = [];
  const problems: string[] = [];

  records.forEach((record, index) => {
    const result = CardRowSchema.safeParse(record);
    const where = `row ${index + firstLine}${typeof record.card_id === "string" && record.card_id ? ` (${record.card_id})` : ""}`;
    if (!result.success) {
      problems.push(`${where}: ${result.error.issues.map((i) => i.message).join("; ")}`);
      return;
    }
    const row = result.data;
    if (cards.some((c) => c.id === row.card_id)) {
      problems.push(`${where}: card_id "${row.card_id}" appears twice`);
      return;
    }
    const bank = banks.get(row.bank_id);
    if (bank) {
      for (const alias of aliases(row.bank_aliases)) if (!bank.aliases.includes(alias)) bank.aliases.push(alias);
    } else {
      banks.set(row.bank_id, { id: row.bank_id, name: row.bank_name, short: row.bank_short, aliases: aliases(row.bank_aliases) });
    }
    cards.push({ id: row.card_id, bank: row.bank_id, name: row.card_name, short: row.card_short });
    rows.push(row);
  });
  return { banks: [...banks.values()], cards, rows, problems };
}

export function csvToCards(text: string): ParsedCards {
  const { records, problem } = csvRecords(text, CARD_COLUMNS);
  if (problem) return { banks: [], cards: [], rows: [], problems: [problem] };
  return recordsToCards(records);
}
