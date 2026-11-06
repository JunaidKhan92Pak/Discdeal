/**
 * The deals spreadsheet format (data/deals.csv), in one place: reading it, checking every row, and turning rows into
 * deals. The website (file mode) and the database import script both use this, so the rules can never drift apart.
 * No "server-only" here on purpose: the import script runs outside Next.js.
 */
import { z } from "zod";
import { CATEGORIES, CITIES, SUB_ICONS } from "@/lib/taxonomy";
import { slugify } from "@/lib/text";
import type { CategoryId, Channel, CityId, Deal } from "@/lib/types";

/** Column order of data/deals.csv (and of the `deals` table in Postgres). */
export const COLUMNS = [
  "brand", "offer", "discount_pct", "title", "description", "category", "subcategory", "cities", "channels",
  "card_ids", "price", "original_price", "code", "valid_until", "source_url", "checked_on", "tags", "image_url",
] as const;

/** Reads CSV text (RFC 4180: quoted fields, "" for a quote, commas and newlines inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

const CITY_IDS = new Set<string>(CITIES.map((c) => c.id));
const CHANNEL_IDS = new Set<string>(["in-store", "delivery", "online"]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "karachi; Lahore" → ["karachi", "lahore"] */
const list = (value: string) => value.split(/[;,]/).map((v) => v.trim().toLowerCase()).filter(Boolean);
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : Number(v)),
  z.number({ error: "price columns must be numbers like 1500 (no Rs or commas), or empty" }).nonnegative().optional(),
);

export const DealRowSchema = z
  .object({
    brand: z.string().trim().min(1, "brand is empty"),
    offer: z.string().trim().default(""),
    discount_pct: z.coerce
      .number({ error: "discount_pct must be a number like 20 (or 0 with an offer such as Free)" })
      .int("discount_pct must be a whole number")
      .min(0, "discount_pct cannot be below 0")
      .max(100, "discount_pct cannot be above 100"),
    title: z.string().trim().min(1, "title is empty"),
    description: z.string().trim().default(""),
    category: z.string().trim(),
    subcategory: z.string().trim(),
    cities: z.string().default(""),
    channels: z.string().default("in-store"),
    card_ids: z.string().default(""),
    price: optionalNumber,
    original_price: optionalNumber,
    code: z.string().trim().default(""),
    valid_until: z.string().trim().default(""),
    source_url: z.url("source_url must be a full link (https://…)"),
    checked_on: z.string().trim().regex(DATE, "checked_on must look like 2026-11-01"),
    tags: z.string().default(""),
    // A full https link, or a picture uploaded with the site: /deals/khaadi-lawn.webp (the file goes in public/deals/).
    image_url: z
      .union([z.literal(""), z.string().regex(/^\/deals\/[\w\-./]+$/), z.url()], "image_url must be a full link (https://…) or /deals/file-name.webp")
      .default(""),
  })
  .superRefine((row, ctx) => {
    const category = CATEGORIES.find((c) => c.id === row.category);
    if (!category) ctx.addIssue({ code: "custom", message: `unknown category "${row.category}"` });
    else if (!category.subcategories.some((s) => s.id === row.subcategory)) ctx.addIssue({ code: "custom", message: `"${row.subcategory}" is not a subcategory of ${row.category}` });
    for (const city of list(row.cities)) if (!CITY_IDS.has(city)) ctx.addIssue({ code: "custom", message: `unknown city "${city}" (add it to lib/taxonomy.ts first)` });
    for (const channel of list(row.channels)) if (!CHANNEL_IDS.has(channel)) ctx.addIssue({ code: "custom", message: `unknown channel "${channel}"` });
    if (row.valid_until && !DATE.test(row.valid_until)) ctx.addIssue({ code: "custom", message: "valid_until must look like 2026-12-31 (or be empty)" });
    if (row.discount_pct === 0 && !row.offer) ctx.addIssue({ code: "custom", message: "discount_pct is 0, so offer must say what it is (e.g. Free)" });
    if (row.price !== undefined && row.original_price !== undefined && row.original_price < row.price) ctx.addIssue({ code: "custom", message: "original_price is lower than price" });
  });

export type DealRow = z.infer<typeof DealRowSchema>;

/** Checks one row, including that every card id exists in the cards data (data/cards.csv or the `cards` table). */
export function parseDealRow(record: Record<string, unknown>, cardIds: ReadonlySet<string>): { row: DealRow; problems: string[] } | { row: null; problems: string[] } {
  const result = DealRowSchema.safeParse(record);
  if (!result.success) return { row: null, problems: result.error.issues.map((i) => i.message) };
  const unknown = list(result.data.card_ids).filter((id) => !cardIds.has(id));
  if (unknown.length > 0) return { row: null, problems: unknown.map((id) => `unknown card "${id}" (add it to data/cards.csv first)`) };
  return { row: result.data, problems: [] };
}

/** Same deal → same id every time (likes are stored by id), whether it comes from the file or the database. */
export function dealId(row: Pick<DealRow, "brand" | "title" | "card_ids" | "source_url">): number {
  const key = `${row.brand}|${row.title}|${list(row.card_ids).sort().join(",")}|${row.source_url}`.toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return (hash >>> 0) % 2147483647 || 1;
}

/** Today's date in Pakistan as YYYY-MM-DD (offers end at the end of their last day, Pakistan time). */
export function todayInPakistan(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(now);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** A checked row → a Deal, or null when it has already ended. */
export function rowToDeal(row: DealRow, today: string): Deal | null {
  const endsAt = row.valid_until || null;
  const endsInDays = endsAt ? daysBetween(today, endsAt) : null;
  if (endsInDays !== null && endsInDays < 0) return null;

  return {
    id: dealId(row),
    brand: row.brand,
    brandId: slugify(row.brand),
    title: row.title,
    offer: row.offer || undefined,
    description: row.description,
    category: row.category as CategoryId,
    subcategory: row.subcategory,
    price: row.price,
    originalPrice: row.original_price,
    discountPct: row.discount_pct,
    code: row.code || undefined,
    endsAt,
    endsInDays,
    cities: list(row.cities) as CityId[],
    channels: (list(row.channels).length > 0 ? list(row.channels) : ["in-store"]) as Channel[],
    cards: list(row.card_ids),
    tags: row.tags.split(/[\s;,]+/).filter(Boolean),
    icon: SUB_ICONS[row.subcategory] ?? "tag",
    image: row.image_url || undefined,
    sourceUrl: row.source_url,
    checkedAt: row.checked_on,
  };
}

export type ParsedDeals = { deals: Deal[]; expired: number; problems: string[] };

/** Plain objects with the column names (from the CSV or a database query) → live deals, plus a list of rows that were rejected and why. */
export function recordsToDeals(records: Record<string, unknown>[], today: string, cardIds: ReadonlySet<string>, firstLine = 2): ParsedDeals {
  const deals: Deal[] = [];
  const problems: string[] = [];
  const seen = new Set<number>();
  let expired = 0;

  records.forEach((record, index) => {
    const checked = parseDealRow(record, cardIds);
    const where = `row ${index + firstLine}${typeof record.brand === "string" && record.brand ? ` (${record.brand})` : ""}`;
    if (!checked.row) {
      problems.push(`${where}: ${checked.problems.join("; ")}`);
      return;
    }
    const deal = rowToDeal(checked.row, today);
    if (!deal) {
      expired++;
      return;
    }
    if (seen.has(deal.id)) {
      problems.push(`${where}: same brand, title, cards and source as an earlier row (skipped)`);
      return;
    }
    seen.add(deal.id);
    deals.push(deal);
  });
  return { deals, expired, problems };
}

/** CSV text → one object per row, keyed by the header names; or the problem if required columns are missing. */
export function csvRecords(text: string, required: readonly string[]): { records: Record<string, string>[]; problem: string | null } {
  const [header, ...rows] = parseCsv(text);
  if (!header) return { records: [], problem: "the file is empty" };
  const names = header.map((h) => h.trim().toLowerCase());
  const missing = required.filter((c) => !names.includes(c));
  if (missing.length > 0) return { records: [], problem: `missing columns: ${missing.join(", ")}` };
  return { records: rows.map((cells) => Object.fromEntries(names.map((name, i) => [name, (cells[i] ?? "").trim()]))), problem: null };
}

/** CSV text → live deals. */
export function csvToDeals(text: string, today: string, cardIds: ReadonlySet<string>): ParsedDeals {
  const { records, problem } = csvRecords(text, COLUMNS);
  if (problem) return { deals: [], expired: 0, problems: [problem] };
  return recordsToDeals(records, today, cardIds);
}
