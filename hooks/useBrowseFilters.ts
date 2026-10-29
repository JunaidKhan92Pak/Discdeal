"use client";

import { useState } from "react";
import type { CategoryId, SortKey } from "@/lib/types";

export type BrandChoice = { id: string; name: string };

/**
 * Category pill (with optional subcategory), brand, sort order and the Liked view.
 * Category and brand are independent filters: either can be picked first, and the counts on each follow the other.
 */
export function useBrowseFilters() {
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandChoice | null>(null);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [likedOnly, setLikedOnly] = useState(false);

  function selectCategory(next: CategoryId | null) {
    setCategory(next);
    setSub(null);
  }

  /** "All deals from Khaadi": the brand, across every category it has deals in. */
  function showBrand(next: BrandChoice) {
    setBrand(next);
    selectCategory(null);
  }

  return {
    category,
    sub,
    brand,
    sort,
    likedOnly,
    selectCategory,
    selectSub: setSub,
    selectBrand: setBrand,
    showBrand,
    setSort,
    toggleLiked: () => setLikedOnly((on) => !on),
  };
}
