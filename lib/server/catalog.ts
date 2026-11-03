/**
 * Loads everything the site shows: banks and cards, and the live deals.
 *   - DATABASE_URL set → the `cards` and `deals` tables in Postgres (Supabase)
 *   - otherwise        → the spreadsheets data/cards.csv and data/deals.csv
 * Either way the rows go through the same checks, ended deals are dropped, and the result is kept in memory for
 * CATALOG_CACHE_SECONDS (1 minute by default), so the database is read about once a minute per server however many
 * people visit. Live numbers and example searches are worked out from the data here, so no copy is hard-coded.
 * If the database cannot be reached, the spreadsheets that ship with the site are used until it is back, so search
 * keeps working (with the data as of the last commit).
 */
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { csvToCards, recordsToCards, type ParsedCards } from "@/lib/cards-csv";
import { csvToDeals, recordsToDeals, todayInPakistan, type ParsedDeals } from "@/lib/deals-csv";
import { SELECT_CARDS, SELECT_LIVE_DEALS } from "@/lib/db-sql";
import { cached, dataVersion } from "@/lib/server/cache";
import { config } from "@/lib/server/config";
import { database } from "@/lib/server/db";
import { isConnectionError, markDown } from "@/lib/server/health";
import { CATEGORIES, CITIES } from "@/lib/taxonomy";
import type { Bank, Card, CatalogMeta, CityId, Deal } from "@/lib/types";

export type Catalog = { deals: Deal[]; banks: Bank[]; cards: Card[]; meta: CatalogMeta };

const file = (name: string) => readFile(path.join(process.cwd(), "data", name), "utf8");

type Db = ReturnType<typeof database>;

async function loadCards(db: Db): Promise<ParsedCards> {
  if (!db) return csvToCards(await file("cards.csv"));
  try {
    return recordsToCards(await db.unsafe(SELECT_CARDS));
  } catch (error) {
    // The `cards` table may not exist yet (schema.sql not re-run): keep working from the spreadsheet.
    if ((error as { code?: string }).code === "42P01") return csvToCards(await file("cards.csv"));
    throw error;
  }
}

async function loadDeals(db: Db, cardIds: ReadonlySet<string>): Promise<ParsedDeals> {
  const today = todayInPakistan();
  if (db) return recordsToDeals(await db.unsafe(SELECT_LIVE_DEALS), today, cardIds);
  return csvToDeals(await file("deals.csv"), today, cardIds);
}

async function load(): Promise<Catalog> {
  try {
    return await loadFrom(database());
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    markDown("database", error);
    return loadFrom(null);
  }
}

async function loadFrom(db: Db): Promise<Catalog> {
  const cards = await loadCards(db);
  const deals = await loadDeals(db, new Set(cards.cards.map((c) => c.id)));
  const problems = [...cards.problems.map((p) => `cards: ${p}`), ...deals.problems];
  if (problems.length > 0) console.warn(`[catalog] ${problems.length} row(s) skipped:\n  ${problems.join("\n  ")}`);
  return { deals: deals.deals, banks: cards.banks, cards: cards.cards, meta: buildMeta(deals.deals, cards.banks, cards.cards) };
}

export async function getCatalog(): Promise<Catalog> {
  const version = await dataVersion();
  const { value } = await cached(`catalog:${version}`, config.catalogSeconds, load);
  return value;
}

/* ---------------- live numbers and example searches, worked out from the data ---------------- */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const cityLabel = (id: CityId) => CITIES.find((c) => c.id === id)?.label ?? id;
/** Urdu city names for one Urdu example (shows people they can search in Urdu). */
const URDU_CITY: Record<string, string> = { karachi: "کراچی", lahore: "لاہور", islamabad: "اسلام آباد" };

function countBy<T>(items: T[], keys: (item: T) => string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) for (const key of keys(item)) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

function buildMeta(deals: Deal[], banks: Bank[], cards: Card[]): CatalogMeta {
  const cities = countBy(deals, (d) => d.cities) as [CityId, number][];
  const bankOfCard = new Map(cards.map((c) => [c.id, c.bank]));
  const bankCounts = countBy(deals, (d) => [...new Set(d.cards.map((c) => bankOfCard.get(c) ?? ""))].filter(Boolean));
  const suggestions: string[] = [];

  // 1. The most common dish/product in the city with the most deals: "Pizza in Lahore"
  const [topCity, secondCity] = [cities[0]?.[0], cities[1]?.[0]];
  if (topCity) {
    const tag = countBy(deals.filter((d) => d.cities.includes(topCity) && d.category === "food"), (d) => d.tags.slice(0, 1))[0]?.[0];
    if (tag) suggestions.push(`${cap(tag)} in ${cityLabel(topCity)}`);
  }
  // 2. The bank with the most offers: "HBL card discounts"
  const topBank = banks.find((b) => b.id === bankCounts[0]?.[0]);
  if (topBank) suggestions.push(`${topBank.short} card discounts`);
  // 3. Urdu: "کراچی میں کھانا"
  const urduCity = cities.map(([id]) => id).find((id) => URDU_CITY[id] && deals.some((d) => d.cities.includes(id) && d.category === "food"));
  if (urduCity) suggestions.push(`${URDU_CITY[urduCity]} میں کھانا`);
  // 4. A café/coffee search in the second city: "Coffee Karachi"
  if (secondCity) {
    const tag = countBy(deals.filter((d) => d.cities.includes(secondCity) && d.subcategory === "food-cafes"), (d) => d.tags.slice(0, 1))[0]?.[0];
    if (tag) suggestions.push(`${cap(tag)} ${cityLabel(secondCity)}`);
  }
  // 5. The biggest discount level with at least 5 deals: "40% off"
  const level = [50, 40, 30, 20].find((pct) => deals.filter((d) => d.category === "food" && d.discountPct >= pct).length >= 5);
  if (level) suggestions.push(`${level}% off ${CATEGORIES[0].short.toLowerCase()}`);

  return {
    banks,
    cards,
    stats: {
      deals: deals.length,
      brands: new Set(deals.map((d) => d.brandId)).size,
      cities: cities.length,
      banks: banks.length,
      cards: cards.length,
    },
    suggestions: [...new Set(suggestions)],
  };
}
