"use client";

import { useEffect, useRef } from "react";
import { DealCard } from "@/components/deals/DealCard";
import type { DealsStatus } from "@/hooks/useDeals";
import type { CityId, Deal } from "@/lib/types";

type ResultsGridProps = {
  items: Deal[];
  status: DealsStatus;
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  moreFailed: boolean;
  emptyMessage: string;
  likedIds: number[];
  searchedCities: CityId[];
  /** Scrolls back to the top whenever this changes (a new search or filter). */
  resetKey: string;
  onToggleLike: (id: number) => void;
  onOpen: (deal: Deal) => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

// Phones: two columns (a picture-first card reads well at half width). Larger screens: as many columns as fit at
// 17rem or wider, so cards never get cramped (3 on a laptop next to the sidebar, never the 5 that felt crowded).
const GRID = "grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] sm:gap-5 lg:gap-6";
const NOTE = "grid h-full place-items-center content-center gap-3 rounded-card border border-dashed border-line px-4 text-center text-body text-soft";

/**
 * Deals as a grid that scrolls inside the results panel (the page itself never scrolls).
 * A grid shows several deals at once, unlike a carousel that hides all but a few. More deals load on request.
 */
export function ResultsGrid(props: ResultsGridProps) {
  const { items, status, total, hasMore, loadingMore, moreFailed, emptyMessage, likedIds, searchedCities, resetKey } = props;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  if (status === "error") {
    return (
      <div className={NOTE} role="alert">
        <p>We couldn’t load deals. Check your connection and try again.</p>
        <button type="button" className="btn-primary" onClick={props.onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className={`${GRID} h-full content-start overflow-hidden`} aria-busy="true" aria-label="Loading deals">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton h-72" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return <p className={NOTE}>{emptyMessage}</p>;

  return (
    <div ref={scrollRef} className="-mx-gutter h-full overflow-y-auto overscroll-contain px-gutter pt-1 pb-4 [scrollbar-width:thin] sm:mx-0 sm:px-1" aria-busy={status === "refreshing"}>
      <ul className={`${GRID} transition-opacity duration-200 ${status === "refreshing" ? "opacity-60" : "opacity-100"}`}>
        {items.map((deal, i) => (
          <li key={deal.id}>
            <DealCard deal={deal} index={i} liked={likedIds.includes(deal.id)} searchedCities={searchedCities} onToggleLike={props.onToggleLike} onOpen={props.onOpen} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button type="button" className="btn-secondary" onClick={props.onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : moreFailed ? "Couldn’t load, try again" : "Show more deals"}
            <span className="text-small font-medium text-muted tabular-nums">
              {items.length} of {total}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
