/** The deals API's URL format, in one place: the browser writes it, the server reads (and distrusts) it. */
import { CATEGORIES, CITIES } from "@/lib/taxonomy";
import type { CategoryId, CityId, DealQuery, SortKey } from "@/lib/types";

export const PAGE_SIZE = 24;
const MAX_LIMIT = 48;
const MAX_OFFSET = 2000;
const MAX_QUERY_LENGTH = 120;
const MAX_IDS = 200;

const CITY_IDS = new Set<string>(CITIES.map((c) => c.id));
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
const BRAND_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SORTS = new Set<string>(["relevance", "discount", "ending", "price"] satisfies SortKey[]);

export function toSearchParams(query: DealQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.city) params.set("city", query.city);
  if (query.category) params.set("cat", query.category);
  if (query.sub) params.set("sub", query.sub);
  if (query.brand) params.set("brand", query.brand);
  if (query.sort !== "relevance") params.set("sort", query.sort);
  if (query.ids) params.set("ids", query.ids.join(","));
  if (query.offset > 0) params.set("offset", String(query.offset));
  if (query.limit !== PAGE_SIZE) params.set("limit", String(query.limit));
  return params;
}

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = value === null ? NaN : Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
}

/** Turns untrusted URL params into a safe DealQuery: unknown ids are dropped, numbers are clamped, text is capped. */
export function parseDealQuery(params: URLSearchParams): DealQuery {
  const city = params.get("city");
  const category = params.get("cat");
  const validCategory = category && CATEGORY_IDS.has(category) ? (category as CategoryId) : null;
  const sub = params.get("sub");
  const validSub = validCategory && sub && CATEGORIES.find((c) => c.id === validCategory)?.subcategories.some((s) => s.id === sub) ? sub : null;
  const brand = params.get("brand");
  const sort = params.get("sort");
  const ids = params.get("ids");

  return {
    q: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    city: city && CITY_IDS.has(city) ? (city as CityId) : null,
    category: validCategory,
    sub: validSub,
    brand: brand && brand.length <= 60 && BRAND_ID.test(brand) ? brand : null,
    sort: sort && SORTS.has(sort) ? (sort as SortKey) : "relevance",
    ids: ids === null ? null : ids.split(",").filter(Boolean).slice(0, MAX_IDS).map(Number).filter(Number.isInteger),
    offset: clampInt(params.get("offset"), 0, 0, MAX_OFFSET),
    limit: clampInt(params.get("limit"), PAGE_SIZE, 1, MAX_LIMIT),
  };
}
