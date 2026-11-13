"use client";

import { useId, useState } from "react";
import { CheckMark } from "@/components/ui/CheckMark";
import { Icon } from "@/components/ui/Icon";
import type { BrandChoice } from "@/hooks/useBrowseFilters";
import type { BrandFacet } from "@/lib/types";

type BrandListProps = {
  /** Brands in the current results, A–Z, with counts. */
  brands: BrandFacet[];
  selected: BrandChoice[];
  onToggle: (brand: BrandChoice) => void;
  /** "All brands": clears every ticked brand. */
  onClear: () => void;
  /** Background of the search box while it sticks to the top of the scrolling list (match what is behind it). */
  searchBackground?: string;
};

/**
 * Pick-several list of brands: "All brands", then every brand A–Z with a tick box (no counts: the list is for
 * choosing, not tallying). No "Show all" button: the list scrolls (in the sidebar, or the phone sheet), and when it is
 * long a search box stays pinned at its top. The search text stays after ticking, so several matches can be ticked.
 */
export function BrandList({ brands, selected, onToggle, onClear, searchBackground = "bg-glass-strong" }: BrandListProps) {
  const inputId = useId();
  const [filter, setFilter] = useState("");
  const chosen = new Set(selected.map((b) => b.id));

  const needle = filter.trim().toLowerCase();
  const shown = needle ? brands.filter((b) => b.name.toLowerCase().includes(needle)) : brands;

  return (
    <div>
      {brands.length > 6 && (
        <div className={`sticky top-0 z-10 -mx-1 px-2 pt-1 pb-2 backdrop-blur-xl ${searchBackground}`}>
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
            {filter && (
              <button type="button" aria-label="Clear brand search" onClick={() => setFilter("")} className="-mr-2 grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-primary">
                <Icon name="close" className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {!needle && (
        <button type="button" className="list-row" data-quiet aria-pressed={selected.length === 0} onClick={onClear}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill text-muted" aria-hidden="true">
            <Icon name="tag" className="size-4" />
          </span>
          <span className="flex-1 truncate">All brands</span>
        </button>
      )}

      {shown.map((b) => (
        <button key={b.id} type="button" className="list-row" aria-pressed={chosen.has(b.id)} onClick={() => onToggle({ id: b.id, name: b.name })}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill text-small font-bold text-muted" aria-hidden="true">
            {b.name.charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 truncate">{b.name}</span>
          <CheckMark />
        </button>
      ))}

      {needle && shown.length === 0 && <p className="px-3 py-4 text-center text-body text-soft">No brand called “{filter.trim()}” here.</p>}
    </div>
  );
}
