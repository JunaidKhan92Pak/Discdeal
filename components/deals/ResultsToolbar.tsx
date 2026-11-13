"use client";

import type { ReactNode } from "react";
import { Toggle } from "radix-ui";
import { BrandPicker } from "@/components/deals/BrandPicker";
import { CardPicker } from "@/components/deals/CardPicker";
import { useDealsContext } from "@/components/deals/DealsContext";
import { Hint } from "@/components/ui/Hint";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import type { SortKey } from "@/lib/types";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "discount", label: "Biggest discount" },
  { value: "ending", label: "Ending soon" },
];
const DEFAULT_SORT: SortKey = "relevance";

type ResultsToolbarProps = {
  /** What search understood, shown after the count on desktop: "8 deals for [Lahore ×] [Fashion ×]". */
  understood?: ReactNode;
};

/**
 * One line above the deals: the count (and, on desktop, what search understood), then brand (phones; a Radix Dialog),
 * sort (Radix Select) and the Liked filter (Radix Toggle). Scrolls sideways on narrow phones.
 * The tools rest as icons and explain themselves on hover / keyboard focus (Hint); a tool that is changing the
 * results (a filter on, a sort other than the default) shows its label, so what you see is always explained.
 */
export function ResultsToolbar({ understood }: ResultsToolbarProps) {
  const {
    state: { total, status, sort, likedOnly, liked },
    actions: { setSort: onSort, toggleLikedOnly: onToggleLiked },
  } = useDealsContext();
  const likedCount = liked.length;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Best match";
  const likedDetail = likedCount === 0 ? "Use the heart on any deal to save it here." : `See the ${likedCount} deal${likedCount === 1 ? "" : "s"} you saved.`;
  return (
    <div className="-mx-gutter flex items-center gap-2 overflow-x-auto px-gutter py-1 [scrollbar-width:none] sm:mx-0 sm:px-0.5 lg:overflow-visible">
      <div className="mr-auto flex min-w-0 shrink-0 items-center gap-2 lg:shrink lg:flex-wrap">
        {/* No count on screen (the deals speak for themselves); screen readers still hear how many were found.
            A heading, so the cards (h3) sit under "Deals" in the page outline. */}
        <h2 className="shrink-0 text-body font-semibold whitespace-nowrap text-ink" aria-live="polite">
          {total === null || status === "loading" ? (
            "Searching…"
          ) : (
            <>
              Deals<span className="sr-only">: {total} found</span>
            </>
          )}
        </h2>
        {understood && (
          <span className="hidden items-center gap-2 lg:flex lg:flex-wrap">
            <span className="text-body text-soft">for</span>
            {understood}
          </span>
        )}
      </div>
      <CardPicker />
      {/* On desktop the brand list lives in the sidebar. */}
      <div className="shrink-0 lg:hidden">
        <BrandPicker />
      </div>
      {/* "Best match" is what everyone expects, so it rests as an icon; any other order is spelled out. */}
      <Select
        label="Sort deals"
        prefix="Sort:"
        icon="sort"
        variant={sort === DEFAULT_SORT ? "icon" : "label"}
        hint={{ label: "Sort deals", detail: `Now: ${sortLabel}` }}
        value={sort}
        options={SORT_OPTIONS}
        onChange={onSort}
      />
      {/* The heart and how many are saved say enough; "Liked" is spelled out only while the filter is on. */}
      <Hint label="Liked deals" detail={likedOnly ? "Showing only these. Turn off to see every deal." : likedDetail}>
        <Toggle.Root
          pressed={likedOnly}
          onPressedChange={onToggleLiked}
          className="pill gap-1.5"
          data-iconic={likedOnly ? undefined : ""}
          aria-label={`Show only liked deals (${likedCount} saved)`}
        >
          <Icon name="heart" className="size-5" fill={likedOnly ? "currentColor" : "none"} />
          {likedOnly && <span className="animate-fade">Liked</span>}
          {(likedOnly || likedCount > 0) && <span className="count">{likedCount}</span>}
        </Toggle.Root>
      </Hint>
    </div>
  );
}
