"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { BrandChoice } from "@/hooks/useBrowseFilters";
import type { BrandFacet } from "@/lib/types";

type BrandListProps = {
  /** Brands in the current results, A–Z, with counts. */
  brands: BrandFacet[];
  selected: BrandChoice | null;
  onSelect: (brand: BrandChoice | null) => void;
  /** Show only the biggest N brands until "Show all" is pressed (sidebar). Omit to list every brand (sheet). */
  limit?: number;
};

/**
 * Pick-one list of brands: "All brands", then one row per brand with its count, and a search box when the
 * list is long. Used in the desktop sidebar (top brands + "Show all") and in the phone sheet (everything, A–Z).
 */
export function BrandList({ brands, selected, onSelect, limit }: BrandListProps) {
  const inputId = useId();
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(false);

  // After a pick, fold the list back so the chosen brand sits near the top where it can be seen.
  function choose(brand: BrandChoice | null) {
    setFilter("");
    setExpanded(false);
    onSelect(brand);
  }

  const needle = filter.trim().toLowerCase();
  const total = brands.reduce((sum, b) => sum + b.count, 0);
  const collapsible = limit !== undefined && brands.length > limit;

  let shown = brands;
  if (needle) {
    shown = brands.filter((b) => b.name.toLowerCase().includes(needle));
  } else if (collapsible && !expanded) {
    // Biggest brands first while collapsed; the chosen brand goes to the top so it is always seen.
    const top = [...brands].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);
    const chosen = selected ? brands.find((b) => b.id === selected.id) : undefined;
    shown = chosen ? [chosen, ...top.filter((b) => b.id !== chosen.id)] : top;
  }

  return (
    <div>
      {brands.length > (limit ?? 6) && (
        <div className="px-1 pb-2">
          <label htmlFor={inputId} className="sr-only">
            Find a brand
          </label>
          <div className="field-sm">
            <Icon name="search" className="size-5 shrink-0 text-muted" />
            <input
              id={inputId}
              type="search"
              autoComplete="off"
              dir="auto"
              placeholder="Find a brand"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-muted"
            />
          </div>
        </div>
      )}

      {!needle && (
        <button type="button" className="list-row" data-quiet aria-pressed={selected === null} onClick={() => choose(null)}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary" aria-hidden="true">
            <Icon name="tag" className="size-4" />
          </span>
          <span className="flex-1 truncate">All brands</span>
          <span className="count">{total}</span>
        </button>
      )}

      {shown.map((b) => (
        <button key={b.id} type="button" className="list-row" aria-pressed={selected?.id === b.id} onClick={() => choose({ id: b.id, name: b.name })}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-panel text-small font-bold text-soft" aria-hidden="true">
            {b.name.charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 truncate">{b.name}</span>
          <span className="count">{b.count}</span>
        </button>
      ))}

      {needle && shown.length === 0 && <p className="px-3 py-4 text-center text-body text-soft">No brand called “{filter.trim()}” here.</p>}

      {collapsible && !needle && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="mt-1 inline-flex min-h-tap items-center gap-1 rounded-button px-3 text-small font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {expanded ? "Show fewer brands" : `Show all ${brands.length} brands`}
          <Icon name="chevron-down" className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
