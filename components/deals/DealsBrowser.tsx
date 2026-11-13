"use client";

import { useRef, useState } from "react";
import { CategoryBar } from "@/components/deals/CategoryBar";
import { DealModal } from "@/components/deals/DealModal";
import { DealsContext, type DealsContextValue } from "@/components/deals/DealsContext";
import { FilterSidebar } from "@/components/deals/FilterSidebar";
import { IntentChips } from "@/components/deals/IntentChips";
import { ResultsGrid } from "@/components/deals/ResultsGrid";
import { ResultsToolbar } from "@/components/deals/ResultsToolbar";
import { account } from "@/hooks/useAccount";
import { useBrowseFilters } from "@/hooks/useBrowseFilters";
import { useDeals } from "@/hooks/useDeals";
import { useLikedDeals } from "@/hooks/useLikedDeals";
import { useMeta } from "@/hooks/useMeta";
import { useMyCards } from "@/hooks/useMyCards";
import { removeWords } from "@/lib/intent";
import { CATEGORIES } from "@/lib/taxonomy";
import type { CityId, Deal, IntentPart } from "@/lib/types";

/** searchNow: changes when the user presses Enter, so the search runs without waiting for typing to pause. */
type DealsBrowserProps = { query: string; city: CityId | null; searchNow: number; onQueryChange: (query: string) => void };

/**
 * Everything below the search bar, top to bottom in the order people decide:
 * what search understood → which category → how many / sort / liked → the deals.
 */
export function DealsBrowser({ query, city, searchNow, onQueryChange }: DealsBrowserProps) {
  const filters = useBrowseFilters();
  const { liked, toggle } = useLikedDeals();
  const { myCards, save: saveCards } = useMyCards();
  const meta = useMeta();
  // Removing a chip is a deliberate change, so it searches at once too.
  const [chipRemoved, setChipRemoved] = useState(0);
  const { items, page, status, loadingMore, moreFailed, loadMore, retry } = useDeals({
    q: query,
    city,
    categories: filters.categories,
    subs: filters.subs,
    brands: filters.brands.map((b) => b.id),
    cards: myCards.only ? myCards.cards : null,
    sort: filters.sort,
    ids: filters.likedOnly ? liked : null,
  }, searchNow * 1000 + chipRemoved);
  // The dialog stays mounted after closing (with the last deal) so Radix can return focus to the card.
  const [selected, setSelected] = useState<Deal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  // The brand list follows the chosen categories, named by their short labels: "Brands with Food deals",
  // "… with Food & Fashion deals". Types are left out (the list above shows them), so the line stays short.
  const scopeNames = CATEGORIES.filter((c) => filters.categories.includes(c.id)).map((c) => c.short);
  const brandScope = scopeNames.length === 0 ? null : scopeNames.length <= 2 ? scopeNames.join(" & ") : `${scopeNames.length} categories`;
  const brandNames = filters.brands.length <= 2 ? filters.brands.map((b) => b.name).join(" or ") : `${filters.brands.length} chosen brands`;

  function showBrand(deal: Deal) {
    filters.showBrand({ id: deal.brandId, name: deal.brand });
    openerRef.current = null;
    setDetailsOpen(false);
  }

  function openDeal(deal: Deal) {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(deal);
    setDetailsOpen(true);
  }

  const parts = page?.intent.parts ?? [];
  const typedCities = parts.filter((p) => p.kind === "city").map((p) => p.key.slice("city:".length) as CityId);
  const searchedCities = typedCities.length > 0 ? typedCities : city ? [city] : [];

  // Saved deals belong to an account: logged out, "Liked" asks to log in first, then shows them.
  function showLiked() {
    if (account.user || filters.likedOnly) filters.toggleLiked();
    else account.ask({ mode: "login", reason: "Log in to see the deals you saved.", then: filters.toggleLiked });
  }

  function removePart(part: IntentPart) {
    setChipRemoved((n) => n + 1);
    onQueryChange(removeWords(query, part.words));
  }

  const context: DealsContextValue = {
    state: {
      categories: filters.categories,
      subs: filters.subs,
      selectedBrands: filters.brands,
      sort: filters.sort,
      likedOnly: filters.likedOnly,
      brandScope,
      ready: page !== null,
      total: page?.total ?? null,
      status,
      categoryCounts: page?.categoryCounts ?? {},
      subCounts: page?.subCounts ?? {},
      brands: page?.brands ?? [],
      searchedCities,
      liked,
      myCards,
      cards: meta?.cards ?? [],
      banks: meta?.banks ?? [],
      catalogReady: meta !== null,
    },
    actions: {
      toggleCategory: filters.toggleCategory,
      clearCategories: filters.clearCategories,
      toggleSub: filters.toggleSub,
      toggleBrand: filters.toggleBrand,
      clearBrands: filters.clearBrands,
      setSort: filters.setSort,
      toggleLikedOnly: showLiked,
      toggleLike: toggle,
      saveCards,
      openDeal,
      showBrand,
    },
  };

  const trimmed = query.trim();
  const emptyMessage = filters.likedOnly
    ? liked.length === 0
      ? "You haven’t liked any deals yet. Tap the heart on a deal to save it here."
      : "None of your liked deals match these filters."
    : myCards.only
      ? `None of your cards have a deal here${trimmed ? ` for “${trimmed}”` : ""} yet. Choose “Show all deals” in My cards to see everything.`
      : filters.brands.length > 0
      ? `No deals from ${brandNames} match${trimmed ? ` “${trimmed}”` : " these filters"}. Choose “All brands” to see more.`
      : `No deals found${trimmed ? ` for “${trimmed}”` : ""}. Try another word or category.`;

  return (
    <DealsContext value={context}>
      <section
        aria-label="Browse deals"
        className="mx-auto mt-3 grid min-h-0 w-full max-w-browse flex-1 animate-rise gap-4 lg:grid-rows-[minmax(0,1fr)] lg:mt-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 [@media(max-height:34rem)]:min-h-[26rem]"
      >
        {/* Desktop: every filter visible at once in a sidebar. Phones and tablets: pills + a Brand sheet below. */}
        <FilterSidebar className="hidden lg:flex" />

        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          {/* Phones: what search understood gets its own row. Desktop: it joins the results line below. */}
          <div className="empty:hidden lg:hidden">
            <IntentChips parts={parts} onRemove={removePart} />
          </div>

          <div className="empty:hidden lg:hidden">
            <CategoryBar />
          </div>

          <ResultsToolbar understood={parts.length > 0 ? <IntentChips parts={parts} onRemove={removePart} variant="inline" /> : undefined} />

          {/* Always present (empty when there is nothing to say), so a new notice is read out. */}
          <p className="-mt-1 text-small text-soft empty:hidden" aria-live="polite">
            {page?.intent.notice ?? ""}
          </p>

          <div className="min-h-0 flex-1">
            <ResultsGrid
              items={items}
              status={status}
              total={page?.total ?? 0}
              hasMore={page?.nextOffset != null}
              loadingMore={loadingMore}
              moreFailed={moreFailed}
              emptyMessage={emptyMessage}
              resetKey={`${filters.categories.join(",")}-${filters.subs.join(",")}-${filters.brands.map((b) => b.id).join(",")}-${filters.sort}-${filters.likedOnly}-${myCards.only}-${city}-${items[0]?.id}`}
              onLoadMore={loadMore}
              onRetry={retry}
            />
          </div>
        </div>

        {selected && <DealModal deal={selected} open={detailsOpen} returnFocusTo={openerRef} onOpenChange={setDetailsOpen} />}
      </section>
    </DealsContext>
  );
}
