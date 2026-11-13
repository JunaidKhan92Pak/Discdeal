"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/taxonomy";
import type { CategoryId, SortKey } from "@/lib/types";

export type BrandChoice = { id: string; name: string };

/** Adds the value if it is missing, removes it if it is there. */
function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Categories (each optionally narrowed to some of its types), brands, sort order and the Liked view.
 * Several categories and several brands can be on at once: a deal shows when it is in ANY chosen category and from
 * ANY chosen brand. Category and brand are independent filters: either can be picked first, and the counts on each
 * follow the other. Nothing chosen = everything.
 */
export function useBrowseFilters() {
  const [categories, setCategories] = useState<CategoryId[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const [brands, setBrands] = useState<BrandChoice[]>([]);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [likedOnly, setLikedOnly] = useState(false);

  /** Turns a category on or off. Turning it off also drops the types picked inside it. */
  function toggleCategory(id: CategoryId) {
    const on = categories.includes(id);
    setCategories(toggled(categories, id));
    if (on) {
      const own = new Set(CATEGORIES.find((c) => c.id === id)?.subcategories.map((s) => s.id));
      setSubs((list) => list.filter((s) => !own.has(s)));
    }
  }

  function clearCategories() {
    setCategories([]);
    setSubs([]);
  }

  function toggleSub(id: string) {
    setSubs((list) => toggled(list, id));
  }

  function toggleBrand(brand: BrandChoice) {
    setBrands((list) => (list.some((b) => b.id === brand.id) ? list.filter((b) => b.id !== brand.id) : [...list, brand]));
  }

  /** "All deals from Khaadi": just that brand, across every category it has deals in. */
  function showBrand(next: BrandChoice) {
    setBrands([next]);
    clearCategories();
  }

  return {
    categories,
    subs,
    brands,
    sort,
    likedOnly,
    toggleCategory,
    clearCategories,
    toggleSub,
    toggleBrand,
    clearBrands: () => setBrands([]),
    showBrand,
    setSort,
    toggleLiked: () => setLikedOnly((on) => !on),
  };
}
