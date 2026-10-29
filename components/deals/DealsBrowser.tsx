"use client";

import { useRef, useState } from "react";
import { CategoryBar } from "@/components/deals/CategoryBar";
import { DealModal } from "@/components/deals/DealModal";
import { FilterSidebar } from "@/components/deals/FilterSidebar";
import { IntentChips } from "@/components/deals/IntentChips";
import { ResultsGrid } from "@/components/deals/ResultsGrid";
import { ResultsToolbar } from "@/components/deals/ResultsToolbar";
import { useBrowseFilters } from "@/hooks/useBrowseFilters";
import { useDeals } from "@/hooks/useDeals";
import { useLikedDeals } from "@/hooks/useLikedDeals";
import { removeWords } from "@/lib/intent";
import { CATEGORIES } from "@/lib/taxonomy";
import type { CityId, Deal, IntentPart } from "@/lib/types";

type DealsBrowserProps = { query: string; city: CityId | null; onQueryChange: (query: string) => void };

/**
 * Everything below the search bar, top to bottom in the order people decide:
 * what search understood → which category → how many / sort / liked → the deals.
 */
export function DealsBrowser({ query, city, onQueryChange }: DealsBrowserProps) {
  const filters = useBrowseFilters();
  const { liked, toggle } = useLikedDeals();
  const { items, page, status, loadingMore, moreFailed, loadMore, retry } = useDeals({
    q: query,
    city,
    category: filters.category,
    sub: filters.sub,
    brand: filters.brand?.id ?? null,
    sort: filters.sort,
    ids: filters.likedOnly ? liked : null,
  });
  // The dialog stays mounted after closing (with the last deal) so Radix can return focus to the card.
  const [selected, setSelected] = useState<Deal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  // The brand list follows the category pills: "Brands with Fast food deals".
  const category = CATEGORIES.find((c) => c.id === filters.category);
  const brandScope = category ? (category.subcategories.find((s) => s.id === filters.sub)?.label ?? category.short) : null;

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

  function removePart(part: IntentPart) {
    onQueryChange(removeWords(query, part.words));
  }

  const trimmed = query.trim();
  const emptyMessage = filters.likedOnly
    ? liked.length === 0
      ? "You haven’t liked any deals yet. Tap the heart on a deal to save it here."
      : "None of your liked deals match these filters."
    : filters.brand
      ? `No ${filters.brand.name} deals match${trimmed ? ` “${trimmed}”` : " these filters"}. Choose “All brands” to see more.`
      : `No deals found${trimmed ? ` for “${trimmed}”` : ""}. Try another word or category.`;

  return (
    <section
      aria-label="Browse deals"
      className="mx-auto mt-3 grid min-h-0 w-full max-w-browse flex-1 animate-rise grid-rows-[minmax(0,1fr)] gap-4 lg:mt-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 [@media(max-height:34rem)]:min-h-[26rem]"
    >
      {/* Desktop: every filter visible at once in a sidebar. Phones and tablets: pills + a Brand sheet below. */}
      <FilterSidebar
        className="hidden lg:flex"
        ready={page !== null}
        category={filters.category}
        sub={filters.sub}
        allCount={page?.allCount ?? 0}
        categoryCounts={page?.categoryCounts ?? {}}
        subCounts={page?.subCounts ?? {}}
        onSelectCategory={filters.selectCategory}
        onSelectSub={filters.selectSub}
        brands={page?.brands ?? []}
        brand={filters.brand}
        brandScope={brandScope}
        onBrand={filters.selectBrand}
      />

      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        {/* Phones: what search understood gets its own row. Desktop: it joins the results line below. */}
        <div className="empty:hidden lg:hidden">
          <IntentChips parts={parts} onRemove={removePart} />
        </div>

        <div className="empty:hidden lg:hidden">
          <CategoryBar
            category={filters.category}
            sub={filters.sub}
            allCount={page?.allCount ?? 0}
            categoryCounts={page?.categoryCounts ?? {}}
            subCounts={page?.subCounts ?? {}}
            onSelectCategory={filters.selectCategory}
            onSelectSub={filters.selectSub}
          />
        </div>

        <ResultsToolbar
          total={page?.total ?? null}
          status={status}
          sort={filters.sort}
          likedOnly={filters.likedOnly}
          likedCount={liked.length}
          brands={page?.brands ?? []}
          brand={filters.brand}
          brandScope={brandScope}
          onBrand={filters.selectBrand}
          onSort={filters.setSort}
          onToggleLiked={filters.toggleLiked}
          understood={parts.length > 0 ? <IntentChips parts={parts} onRemove={removePart} variant="inline" /> : undefined}
        />

        {page?.intent.notice && <p className="-mt-1 text-small text-soft">{page.intent.notice}</p>}

        <div className="min-h-0 flex-1">
          <ResultsGrid
            items={items}
            status={status}
            total={page?.total ?? 0}
            hasMore={page?.nextOffset != null}
            loadingMore={loadingMore}
            moreFailed={moreFailed}
            emptyMessage={emptyMessage}
            likedIds={liked}
            searchedCities={searchedCities}
            resetKey={`${filters.category}-${filters.sub}-${filters.brand?.id}-${filters.sort}-${filters.likedOnly}-${city}-${items[0]?.id}`}
            onToggleLike={toggle}
            onOpen={openDeal}
            onLoadMore={loadMore}
            onRetry={retry}
          />
        </div>
      </div>

      {selected && (
        <DealModal deal={selected} open={detailsOpen} returnFocusTo={openerRef} liked={liked.includes(selected.id)} onToggleLike={toggle} onOpenChange={setDetailsOpen} onShowBrand={showBrand} />
      )}
    </section>
  );
}
