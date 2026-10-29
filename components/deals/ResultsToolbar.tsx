"use client";

import type { ReactNode } from "react";
import { Toggle } from "radix-ui";
import { BrandPicker } from "@/components/deals/BrandPicker";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import type { BrandChoice } from "@/hooks/useBrowseFilters";
import type { DealsStatus } from "@/hooks/useDeals";
import type { BrandFacet, SortKey } from "@/lib/types";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "discount", label: "Biggest discount" },
  { value: "ending", label: "Ending soon" },
  { value: "price", label: "Lowest price" },
];

type ResultsToolbarProps = {
  total: number | null;
  status: DealsStatus;
  sort: SortKey;
  likedOnly: boolean;
  likedCount: number;
  brands: BrandFacet[];
  brand: BrandChoice | null;
  /** What the brand list is narrowed to ("Food", "Fast food"), or null. */
  brandScope: string | null;
  onBrand: (brand: BrandChoice | null) => void;
  onSort: (sort: SortKey) => void;
  onToggleLiked: () => void;
  /** What search understood, shown after the count on desktop: "8 deals for [Lahore ×] [Fashion ×]". */
  understood?: ReactNode;
};

/**
 * One line above the deals: the count (and, on desktop, what search understood), then brand (phones; a Radix Dialog),
 * sort (Radix Select) and the Liked filter (Radix Toggle). Scrolls sideways on narrow phones.
 */
export function ResultsToolbar({ total, status, sort, likedOnly, likedCount, brands, brand, brandScope, onBrand, onSort, onToggleLiked, understood }: ResultsToolbarProps) {
  return (
    <div className="-mx-gutter flex items-center gap-2 overflow-x-auto px-gutter py-1 [scrollbar-width:none] sm:mx-0 sm:px-0.5 lg:overflow-visible">
      <div className="mr-auto flex min-w-0 shrink-0 items-center gap-2 lg:shrink lg:flex-wrap">
        <p className="shrink-0 text-body font-semibold whitespace-nowrap tabular-nums text-ink" aria-live="polite">
          {total === null || status === "loading" ? "Searching…" : `${total} deal${total === 1 ? "" : "s"}`}
        </p>
        {understood && (
          <span className="hidden items-center gap-2 lg:flex lg:flex-wrap">
            <span className="text-body text-soft">for</span>
            {understood}
          </span>
        )}
      </div>
      {/* On desktop the brand list lives in the sidebar. */}
      <div className="shrink-0 lg:hidden">
        <BrandPicker brands={brands} selected={brand} scope={brandScope} onSelect={onBrand} />
      </div>
      <Select label="Sort deals" prefix="Sort:" value={sort} options={SORT_OPTIONS} onChange={onSort} />
      <Toggle.Root pressed={likedOnly} onPressedChange={onToggleLiked} className="pill" aria-label="Show only liked deals">
        <Icon name="heart" className="size-5" fill={likedOnly ? "currentColor" : "none"} />
        Liked
        <span className="count">{likedCount}</span>
      </Toggle.Root>
    </div>
  );
}
