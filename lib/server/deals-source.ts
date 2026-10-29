/**
 * The one place the API gets deals from. Today: the in-memory sample data.
 * To move to Postgres, write `searchPostgres(query: DealQuery): Promise<DealsPage>` (db/schema.sql has the
 * tables, indexes and the query to start from) and switch the export below. Nothing in the UI changes.
 */
import "server-only";
import { searchMemory } from "@/lib/server/search";
import type { DealQuery, DealsPage } from "@/lib/types";

export type SearchDeals = (query: DealQuery) => Promise<DealsPage>;

export const searchDeals: SearchDeals = searchMemory;
