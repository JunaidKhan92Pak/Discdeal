"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";

export type BrowseView = "browse" | "liked";

/** Checked subcategories, brand tab and the Liked view. No checked boxes = show every deal. */
export function useBrowseFilters() {
  const [selected, setSelected] = useState<string[]>([]);
  const [brand, setBrand] = useState("all");
  const [view, setView] = useState<BrowseView>("browse");

  function change(next: string[]) {
    setSelected(next);
    setBrand("all");
  }

  function toggleSub(id: string) {
    change(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  /** Parent checkbox: select all of its subcategories, or clear them if they are all selected already. */
  function toggleCategory(category: Category) {
    const ids = category.subcategories.map((s) => s.id);
    const allSelected = ids.every((id) => selected.includes(id));
    change(allSelected ? selected.filter((s) => !ids.includes(s)) : [...new Set([...selected, ...ids])]);
  }

  function selectBrand(next: string) {
    setBrand(next);
    setView("browse");
  }

  function showLiked() {
    setBrand("all");
    setView("liked");
  }

  return { selected, brand, view, toggleSub, toggleCategory, clear: () => change([]), selectBrand, showLiked };
}
