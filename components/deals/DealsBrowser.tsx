"use client";

import { useCallback, useState } from "react";
import { BrandTabs } from "@/components/deals/BrandTabs";
import { CategorySidebar } from "@/components/deals/CategorySidebar";
import { DealModal } from "@/components/deals/DealModal";
import { ResultsList } from "@/components/deals/ResultsList";
import { useBrowseFilters } from "@/hooks/useBrowseFilters";
import { useDealSearch } from "@/hooks/useDealSearch";
import { useLikedDeals } from "@/hooks/useLikedDeals";
import type { Deal } from "@/lib/types";

/** Category checkboxes + brand/Liked tabs + one horizontal row of deals, sized to fill the rest of the screen. */
export function DealsBrowser({ query }: { query: string }) {
  const { selected, brand, view, toggleSub, toggleCategory, clear, selectBrand, showLiked } = useBrowseFilters();
  const { liked, toggle } = useLikedDeals();
  const likedView = view === "liked";
  const { results, counts, brands, status } = useDealSearch({ q: query, subs: selected, brand, ids: likedView ? liked : null });
  const [open, setOpen] = useState<Deal | null>(null);
  const closeModal = useCallback(() => setOpen(null), []);

  const trimmed = query.trim();
  const emptyMessage = likedView
    ? liked.length === 0
      ? "You haven\u2019t liked any deals yet. Tap the heart on a deal to save it here."
      : "None of your liked deals match these filters."
    : trimmed
      ? `No deals found for \u201c${trimmed}\u201d. Try another search or category.`
      : "No deals here yet. Try another category.";

  return (
    <section aria-label="Browse deals" className="mx-auto mt-3 min-h-0 w-full max-w-browse flex-1 animate-rise [@media(max-height:34rem)]:min-h-[26rem]">
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-[17rem_minmax(0,1fr)] lg:grid-rows-1 lg:gap-4">
        <CategorySidebar selected={selected} counts={counts} onToggleSub={toggleSub} onToggleCategory={toggleCategory} onClear={clear} />

        <div className="flex min-h-0 min-w-0 flex-col gap-2">
          {trimmed && <h2 className="animate-rise text-title">Results for {"“"}{trimmed}{"”"}</h2>}

          <BrandTabs
            brands={brands}
            brand={brand}
            view={view}
            likedCount={liked.length}
            onSelectBrand={selectBrand}
            onSelectLiked={showLiked}
            count={results.length}
          />

          {/* Re-keyed so the cards re-animate whenever the view changes */}
          <div className="min-h-0 flex-1">
            <ResultsList
              key={`${selected.join(",")}-${brand}-${view}`}
              results={results}
              status={status}
              emptyMessage={emptyMessage}
              likedIds={liked}
              onToggleLike={toggle}
              onOpen={setOpen}
            />
          </div>
        </div>
      </div>

      {open && <DealModal deal={open} liked={liked.includes(open.id)} onToggleLike={toggle} onClose={closeModal} />}
    </section>
  );
}
