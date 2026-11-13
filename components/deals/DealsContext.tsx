"use client";

import { createContext, use } from "react";
import type { BrandChoice } from "@/hooks/useBrowseFilters";
import type { DealsStatus } from "@/hooks/useDeals";
import type { MyCards } from "@/hooks/useMyCards";
import type { Bank, BrandFacet, Card, CategoryId, CityId, Deal, SortKey } from "@/lib/types";

/**
 * Everything the deal-browsing UI (sidebar, category pills, toolbar, cards, details dialog) shares, so DealsBrowser
 * provides it once instead of handing the same props down through every layer. Components only know this interface,
 * not where the values come from (filter state, account likes, saved cards, the catalog).
 */
export type DealsState = {
  // Filters
  categories: CategoryId[];
  subs: string[];
  selectedBrands: BrandChoice[];
  sort: SortKey;
  likedOnly: boolean;
  /** What the brand list is narrowed to ("Food", "Food & Fashion"), or null. */
  brandScope: string | null;
  // What the current results contain
  /** False until the first results arrive. */
  ready: boolean;
  total: number | null;
  status: DealsStatus;
  categoryCounts: Record<string, number>;
  subCounts: Record<string, number>;
  /** Brands in the current results, A–Z. */
  brands: BrandFacet[];
  /** The cities searched for (typed, else the chosen city), to list them first on cards. */
  searchedCities: CityId[];
  // The person
  liked: number[];
  myCards: MyCards;
  // The catalog (empty until loaded)
  cards: Card[];
  banks: Bank[];
  catalogReady: boolean;
};

export type DealsActions = {
  toggleCategory: (category: CategoryId) => void;
  clearCategories: () => void;
  toggleSub: (sub: string) => void;
  toggleBrand: (brand: BrandChoice) => void;
  clearBrands: () => void;
  setSort: (sort: SortKey) => void;
  toggleLikedOnly: () => void;
  toggleLike: (id: number) => void;
  saveCards: (next: MyCards) => void;
  openDeal: (deal: Deal) => void;
  /** "All deals from {brand}": filter the results to this deal's brand. */
  showBrand: (deal: Deal) => void;
};

export type DealsContextValue = { state: DealsState; actions: DealsActions };

export const DealsContext = createContext<DealsContextValue | null>(null);

export function useDealsContext(): DealsContextValue {
  const value = use(DealsContext);
  if (!value) throw new Error("useDealsContext must be used inside <DealsContext>");
  return value;
}
