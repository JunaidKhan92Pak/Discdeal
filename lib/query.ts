/** The deals API's URL format, in one place: the browser writes it, the server reads (and distrusts) it. */
import { CATEGORIES, CITIES } from "@/lib/taxonomy";
import type { CategoryId, CityId, DealQuery, SortKey } from "@/lib/types";

export const PAGE_SIZE = 24;
const MAX_LIMIT = 48;
const MAX_OFFSET = 2000;
const MAX_QUERY_LENGTH = 120;
const MAX_IDS = 200;
const MAX_BRANDS = 30;

const CITY_IDS = new Set<string>(CITIES.map((c) => c.id));
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
/** Brand and card ids are data, so the server only checks their shape here; unknown ones simply match nothing. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isSlug = (value: string) => value.length <= 60 && SLUG.test(value);
const SORTS = new Set<string>(["relevance", "discount", "ending", "price"] satisfies SortKey[]);

export function toSearchParams(query: DealQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.city) params.set("city", query.city);
  // Sorted, so picking A then B and B then A ask the same question (one cache entry, here and on the server).
  if (query.categories.length > 0) params.set("cat", [...query.categories].sort().join(","));
  if (query.subs.length > 0) params.set("sub", [...query.subs].sort().join(","));
  if (query.brands.length > 0) params.set("brand", [...query.brands].sort().join(","));
  if (query.cards) params.set("cards", query.cards.join(","));
  if (query.sort !== "relevance") params.set("sort", query.sort);
  if (query.ids) params.set("ids", query.ids.join(","));
  if (query.offset > 0) params.set("offset", String(query.offset));
  if (query.limit !== PAGE_SIZE) params.set("limit", String(query.limit));
  return params;
}

/** "a,b,a" → ["a", "b"]: a comma list from the URL, de-duplicated and sorted so the same choice is the same URL. */
function list(value: string | null): string[] {
  return value ? [...new Set(value.split(",").filter(Boolean))].sort() : [];
}

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = value === null ? NaN : Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
}

/** Turns untrusted URL params into a safe DealQuery: unknown ids are dropped, numbers are clamped, text is capped. */
export function parseDealQuery(params: URLSearchParams): DealQuery {
  const city = params.get("city");
  const categories = list(params.get("cat")).filter((id): id is CategoryId => CATEGORY_IDS.has(id));
  // A type only counts under a category that is chosen.
  const allowedSubs = new Set(CATEGORIES.filter((c) => categories.includes(c.id)).flatMap((c) => c.subcategories.map((s) => s.id)));
  const subs = list(params.get("sub")).filter((id) => allowedSubs.has(id));
  const brands = list(params.get("brand")).filter(isSlug).slice(0, MAX_BRANDS);
  const cards = params.get("cards");
  const sort = params.get("sort");
  const ids = params.get("ids");

  return {
    q: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    city: city && CITY_IDS.has(city) ? (city as CityId) : null,
    categories,
    subs,
    brands,
    // "cards=" with no valid ids means "my cards" with nothing picked → no deals.
    cards: cards === null ? null : [...new Set(cards.split(",").filter(isSlug))].slice(0, 20),
    sort: sort && SORTS.has(sort) ? (sort as SortKey) : "relevance",
    ids: ids === null ? null : ids.split(",").filter(Boolean).slice(0, MAX_IDS).map(Number).filter(Number.isInteger),
    offset: clampInt(params.get("offset"), 0, 0, MAX_OFFSET),
    limit: clampInt(params.get("limit"), PAGE_SIZE, 1, MAX_LIMIT),
  };
}
