"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { DealCard } from "@/components/deals/DealCard";
import type { DealsStatus } from "@/hooks/useDeals";
import { DESKTOP, useMediaQuery } from "@/hooks/useMediaQuery";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { popIn } from "@/lib/motion";
import { dataSaver } from "@/lib/network";
import type { Card, CityId, Deal } from "@/lib/types";

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
  /** The user's saved cards: deals they get are marked "Your card". */
  myCardIds: string[];
  cards: Card[];
  /** Scrolls back to the top whenever this changes (a new search or filter). */
  resetKey: string;
  onToggleLike: (id: number) => void;
  onOpen: (deal: Deal) => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

// Phones: one deal per row, laid out sideways (offer left, details right), so nothing is cut short. Larger screens:
// as many columns as fit at 14rem or wider: 4 next to the sidebar on a laptop, so the screen is filled with deals.
const GRID = "grid grid-cols-1 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] sm:gap-4 lg:gap-5";
const NOTE = "grid min-h-[50svh] place-items-center content-center gap-4 rounded-card bg-fill px-6 py-10 text-center text-body text-soft lg:h-full lg:min-h-0";
/** Only the first screenful of new cards is staggered; the rest are off-screen anyway. */
const ANIMATED = 12;
/** Start loading the next page this far before the end comes into view, so scrolling rarely has to wait. With Data
 * Saver on, only just before: someone who stops scrolling then never pays for a page they did not see. */
const preload = () => (dataSaver() ? "0px 0px 250px 0px" : "0px 0px 800px 0px");

/**
 * Deals as a grid. Desktop: it scrolls inside the results panel, with Lenis smooth scrolling. Phones and tablets: the
 * whole page scrolls (more room for deals, the phone's own scrolling), under the sticky search bar.
 * More deals load by themselves as you near the end (no "Show more" button); a slow or failed page says so in place.
 * New cards rise in one after another (anime.js): all of them for a new search, only the added ones while scrolling.
 */
export function ResultsGrid(props: ResultsGridProps) {
  const { items, status, total, hasMore, loadingMore, moreFailed, emptyMessage, likedIds, searchedCities, resetKey, onLoadMore } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const animatedFor = useRef("");
  const loadMoreRef = useRef(onLoadMore);
  const showingList = status !== "error" && status !== "loading" && items.length > 0;
  // Desktop: the panel is its own scroll box. Phones and tablets: the page (window) scrolls.
  const desktop = useMediaQuery(DESKTOP);
  const lenisRef = useSmoothScroll(scrollRef, showingList && desktop);

  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  });

  // A new search or filter starts at the top.
  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
    else if (desktop) scrollRef.current?.scrollTo({ top: 0 });
    else if (window.scrollY > 0) window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on a new search, not when the window is resized
  }, [resetKey, lenisRef]);

  // Infinite scroll: watch a marker after the last card. Re-created after each page, so if the marker is still in
  // view (a tall screen, a short page) the next page is asked for straight away.
  useEffect(() => {
    const end = endRef.current;
    if (!showingList || !end || !hasMore || loadingMore || moreFailed) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMoreRef.current();
    }, { root: desktop ? scrollRef.current : null, rootMargin: preload() });
    observer.observe(end);
    return () => observer.disconnect();
  }, [showingList, hasMore, loadingMore, moreFailed, items.length, desktop]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // A new search or filter: every card is new, even one that was also in the last results.
    const fresh = [...list.children].filter((li) => li instanceof HTMLElement && li.dataset.id && (animatedFor.current !== resetKey || !li.dataset.shown)) as HTMLElement[];
    animatedFor.current = resetKey;
    if (fresh.length === 0) return;
    for (const li of fresh) li.dataset.shown = "1";
    let done = false;
    const cancel = popIn(fresh.slice(0, ANIMATED), { y: 20, step: 45, duration: 650, onDone: () => (done = true) });
    return () => {
      cancel();
      // Interrupted (or React's development double run): let these cards animate next time.
      if (!done) for (const li of fresh) delete li.dataset.shown;
    };
  }, [items, resetKey]);

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
          <SkeletonCard key={i} delay={i * 80} />
        ))}
      </div>
    );
  }

  if (items.length === 0) return <p className={NOTE}>{emptyMessage}</p>;

  return (
    <div ref={scrollRef} className="pt-1 pb-6 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:px-1 lg:[scrollbar-width:thin]" aria-busy={status === "refreshing" || loadingMore}>
      <div>
        <ul ref={listRef} className={`${GRID} transition-opacity ${status === "refreshing" ? "opacity-50" : "opacity-100"}`}>
          {items.map((deal) => (
            <li key={deal.id} data-id={deal.id}>
              <DealCard deal={deal} liked={likedIds.includes(deal.id)} searchedCities={searchedCities} myCardIds={props.myCardIds} cards={props.cards} onToggleLike={props.onToggleLike} onOpen={props.onOpen} />
            </li>
          ))}
          {loadingMore &&
            Array.from({ length: 4 }, (_, i) => (
              <li key={`more-${i}`} aria-hidden="true">
                <SkeletonCard delay={i * 80} />
              </li>
            ))}
        </ul>

        <div ref={endRef} className="flex min-h-12 items-center justify-center pt-6" aria-live="polite">
          {moreFailed ? (
            <button type="button" className="btn-secondary" onClick={onLoadMore}>
              Couldn’t load more deals. Try again
            </button>
          ) : loadingMore ? (
            <span className="sr-only">Loading more deals…</span>
          ) : !hasMore && total > 6 ? (
            <span className="rounded-full bg-fill px-4 py-2 text-caption font-medium text-muted">That’s all {total} deals</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** A grey card in the shape of a real one, while deals load. */
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div className="flex h-40 animate-pulse gap-3 rounded-card bg-fill p-1.5 sm:h-64 sm:flex-col" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-30 shrink-0 rounded-panel bg-fill sm:h-28 sm:w-auto" />
      <div className="flex flex-1 flex-col gap-2.5 py-2.5 pr-2.5 sm:px-2.5 sm:pt-0">
        <div className="h-4 w-2/3 rounded-full bg-fill" />
        <div className="h-3 w-1/2 rounded-full bg-fill" />
        <div className="mt-auto flex gap-1.5">
          <div className="h-6 w-20 rounded-full bg-fill" />
          <div className="h-6 w-16 rounded-full bg-fill" />
        </div>
      </div>
    </div>
  );
}
