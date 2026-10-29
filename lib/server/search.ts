/**
 * In-memory data source: smart search over the sample deals. Same contract as the future Postgres source
 * (see lib/server/deals-source.ts and db/schema.sql), so the API and the UI do not change when the data moves.
 */
import "server-only";
import { SAMPLE_DEALS } from "@/lib/data/sample-deals";
import { parseIntent, type SearchIntent } from "@/lib/intent";
import { CATEGORIES, CITIES } from "@/lib/taxonomy";
import { fold, tokenize } from "@/lib/text";
import type { BrandFacet, Deal, DealQuery, DealsPage } from "@/lib/types";

const DEALS = SAMPLE_DEALS;
const CATEGORY_OF_SUB = new Map(CATEGORIES.flatMap((c) => c.subcategories.map((sc) => [sc.id, c.id] as const)));

/* Each deal's searchable words (folded), and every such word → how to show it. Built once per server process. */
const DEAL_WORDS = new Map<number, string[]>();
const VOCAB = new Map<string, string>();
for (const deal of DEALS) {
  const category = CATEGORIES.find((c) => c.id === deal.category);
  const sub = category?.subcategories.find((sc) => sc.id === deal.subcategory);
  const cities = deal.cities.map((id) => CITIES.find((c) => c.id === id)?.label ?? "");
  const words = tokenize([deal.brand, deal.title, deal.offer, deal.description, ...deal.tags, category?.label, sub?.label, ...cities].join(" "));
  DEAL_WORDS.set(deal.id, words.map(fold));
  for (const word of words) if (!VOCAB.has(fold(word))) VOCAB.set(fold(word), word);
}

function matchesIntent(deal: Deal, intent: SearchIntent, useCities: boolean): boolean {
  // Nationwide deals (no city list) count as available everywhere.
  if (useCities && intent.cities.length > 0 && deal.cities.length > 0 && !deal.cities.some((c) => intent.cities.includes(c))) return false;

  if (intent.categories.length > 0 || intent.subs.length > 0) {
    // A specific word ("pizza") narrows its own category; other named categories still count in full.
    const narrowed = new Set(intent.subs.map((id) => CATEGORY_OF_SUB.get(id)));
    const bySub = intent.subs.includes(deal.subcategory);
    const byCategory = intent.categories.includes(deal.category) && !narrowed.has(deal.category);
    if (!bySub && !byCategory) return false;
  }

  if (intent.channels.length > 0 && !deal.channels.some((c) => intent.channels.includes(c))) return false;
  if (intent.minDiscount !== null && deal.discountPct < intent.minDiscount) return false;
  if (intent.maxPrice !== null && deal.price > intent.maxPrice) return false;
  if (intent.endingSoon && deal.endsInDays > 1) return false;
  return true;
}

/** 3 = exact word, 2 = word starts with it ("burg" → burger), 0 = no match. */
function termScore(words: string[], term: string): number {
  if (words.includes(term)) return 3;
  if (term.length >= 3 && words.some((w) => w.startsWith(term))) return 2;
  return 0;
}

type Scored = { deal: Deal; score: number };

/**
 * Applies the intent, relaxing it step by step rather than showing an empty screen:
 * all words in the asked city → all words anywhere → any word → ignore unknown words.
 */
function match(intent: SearchIntent): { matches: Scored[]; notice: string | null } {
  const pools = [DEALS.filter((d) => matchesIntent(d, intent, true))];
  if (intent.cities.length > 0) pools.push(DEALS.filter((d) => matchesIntent(d, intent, false)));

  const cityNames = intent.cities.map((id) => CITIES.find((c) => c.id === id)?.label ?? id).join(" or ");
  const termText = intent.terms.map((t) => `“${VOCAB.get(t) ?? t}”`).join(", ");

  function score(deal: Deal, termHits: number): number {
    const words = DEAL_WORDS.get(deal.id) ?? [];
    let total = termHits;
    for (const word of intent.boost) if (words.includes(word)) total += 2;
    if (intent.cities.length > 0 && deal.cities.some((c) => intent.cities.includes(c))) total += 2;
    return total;
  }

  const modes: ("all" | "any")[] = intent.terms.length > 0 ? ["all", "any"] : ["all"];
  for (const mode of modes) {
    for (const [index, pool] of pools.entries()) {
      const matches: Scored[] = [];
      for (const deal of pool) {
        const hits = intent.terms.map((t) => termScore(DEAL_WORDS.get(deal.id) ?? [], t));
        const ok = mode === "all" ? hits.every((h) => h > 0) : hits.some((h) => h > 0);
        if (ok) matches.push({ deal, score: score(deal, hits.reduce((a, b) => a + b, 0)) });
      }
      if (matches.length === 0) continue;
      const notice =
        index === 1
          ? `No matches in ${cityNames} yet, so showing deals from other cities.`
          : mode === "any"
            ? "No deal matches every word, so showing the closest matches."
            : null;
      return { matches, notice };
    }
  }

  // Nothing matched the leftover words at all: ignore them and keep the understood filters.
  const pool = pools.find((p) => p.length > 0) ?? [];
  const notice =
    intent.terms.length > 0
      ? `No deals for ${termText} yet${pool.length === 0 ? "." : pool.length === DEALS.length ? ", so showing all deals." : ", so showing related deals."}`
      : pool.length === 0
        ? "No deals match all of these filters. Remove one to see more."
        : null;
  return { matches: pool.map((deal) => ({ deal, score: score(deal, 0) })), notice };
}

const SORTERS: Record<DealQuery["sort"], (a: Scored, b: Scored) => number> = {
  // Best match first; among equals, the biggest discount.
  relevance: (a, b) => b.score - a.score || b.deal.discountPct - a.deal.discountPct,
  discount: (a, b) => b.deal.discountPct - a.deal.discountPct || b.score - a.score,
  ending: (a, b) => a.deal.endsInDays - b.deal.endsInDays || b.deal.discountPct - a.deal.discountPct,
  price: (a, b) => a.deal.price - b.deal.price || b.deal.discountPct - a.deal.discountPct,
};

export async function searchMemory(query: DealQuery): Promise<DealsPage> {
  const parsed = parseIntent(query.q, VOCAB);
  // A city typed in the search wins over the saved city; the saved one gets no chip (the city picker shows it).
  const intent: SearchIntent = parsed.cities.length > 0 || !query.city ? parsed : { ...parsed, cities: [query.city] };
  const { matches, notice } = match(intent);

  const pool = query.ids ? matches.filter((m) => query.ids!.includes(m.deal.id)) : matches;
  const inCategory = (deal: Deal) => (!query.category || deal.category === query.category) && (!query.sub || deal.subcategory === query.sub);
  const inBrand = (deal: Deal) => !query.brand || deal.brandId === query.brand;

  // Faceted counts: each filter is counted with all the others applied, but not itself.
  const categoryCounts: Record<string, number> = {};
  const subCounts: Record<string, number> = {};
  let allCount = 0;
  const brandFacets = new Map<string, BrandFacet>();
  for (const { deal } of pool) {
    if (inBrand(deal)) {
      allCount++;
      categoryCounts[deal.category] = (categoryCounts[deal.category] ?? 0) + 1;
      subCounts[deal.subcategory] = (subCounts[deal.subcategory] ?? 0) + 1;
    }
    if (inCategory(deal)) {
      const facet = brandFacets.get(deal.brandId) ?? { id: deal.brandId, name: deal.brand, count: 0 };
      facet.count++;
      brandFacets.set(deal.brandId, facet);
    }
  }
  // Keep the chosen brand listed even when nothing matches it right now, so the picker can show and clear it.
  const chosen = query.brand && !brandFacets.has(query.brand) ? DEALS.find((d) => d.brandId === query.brand) : undefined;
  if (chosen) brandFacets.set(chosen.brandId, { id: chosen.brandId, name: chosen.brand, count: 0 });

  const filtered = pool.filter(({ deal }) => inBrand(deal) && inCategory(deal));
  filtered.sort(SORTERS[query.sort]);

  const end = query.offset + query.limit;
  return {
    results: filtered.slice(query.offset, end).map((m) => m.deal),
    total: filtered.length,
    nextOffset: end < filtered.length ? end : null,
    categoryCounts,
    subCounts,
    allCount,
    brands: [...brandFacets.values()].sort((a, b) => a.name.localeCompare(b.name)),
    intent: { parts: parsed.parts, notice },
  };
}
