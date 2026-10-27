import { CATEGORIES, DEALS } from "@/lib/catalog";
import type { Deal, DealQuery, DealsResponse } from "@/lib/types";

/** Query parsing and filtering. Runs on the server (API route). */
const SUBCATEGORY_IDS = new Set<string>(CATEGORIES.flatMap((c) => c.subcategories.map((sc) => sc.id)));

/** Turns untrusted URL params into a safe DealQuery. */
export function parseDealQuery(params: URLSearchParams): DealQuery {
  const subs = (params.get("subs") ?? "").split(",").filter((id) => SUBCATEGORY_IDS.has(id));
  const idsParam = params.get("ids");
  return {
    q: params.get("q") ?? "",
    subs: [...new Set(subs)],
    brand: params.get("brand") ?? "all",
    ids: idsParam === null ? null : idsParam.split(",").map(Number).filter(Number.isInteger),
  };
}

function matchesText(deal: Deal, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const category = CATEGORIES.find((c) => c.id === deal.category);
  const subLabel = category?.subcategories.find((sc) => sc.id === deal.subcategory)?.label ?? "";
  const haystack = `${deal.brand} ${deal.title} ${deal.description} ${category?.label ?? ""} ${subLabel} ${deal.code ?? ""}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function queryDeals({ q, subs, brand, ids }: DealQuery): DealsResponse {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const textMatches = DEALS.filter((deal) => matchesText(deal, terms));

  const counts: DealsResponse["counts"] = {};
  for (const deal of textMatches) counts[deal.subcategory] = (counts[deal.subcategory] ?? 0) + 1;

  const selected = subs.length > 0 ? textMatches.filter((d) => subs.includes(d.subcategory)) : textMatches;
  const brands = [...new Set(selected.map((d) => d.brand))].sort();

  // Brands are listed before the liked filter so the brand tabs stay the same in every view.
  const base = ids ? selected.filter((d) => ids.includes(d.id)) : selected;
  const results = brand !== "all" && brands.includes(brand) ? base.filter((d) => d.brand === brand) : base;

  return { results, counts, brands };
}
