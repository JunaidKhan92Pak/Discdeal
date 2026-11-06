"use client";

import { useRef } from "react";
import { BrandList } from "@/components/deals/BrandList";
import { Icon } from "@/components/ui/Icon";
import type { BrandChoice } from "@/hooks/useBrowseFilters";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { CATEGORIES } from "@/lib/taxonomy";
import type { BrandFacet, CategoryId } from "@/lib/types";

type FilterSidebarProps = {
  /** False until the first results arrive; until then every category is listed without counts. */
  ready: boolean;
  category: CategoryId | null;
  sub: string | null;
  allCount: number;
  categoryCounts: Record<string, number>;
  subCounts: Record<string, number>;
  onSelectCategory: (category: CategoryId | null) => void;
  onSelectSub: (sub: string | null) => void;
  brands: BrandFacet[];
  brand: BrandChoice | null;
  /** What the brand list is narrowed to ("Food", "Fast food"), or null. */
  brandScope: string | null;
  onBrand: (brand: BrandChoice | null) => void;
  className?: string;
};

/**
 * Desktop filters, all visible at once (on phones the same filters are pills and a Brand sheet):
 * categories with their types opening underneath, then brands. One choice per level, with counts.
 * Counts are faceted: picking a brand shows only its categories, picking a category only its brands.
 */
export function FilterSidebar(props: FilterSidebarProps) {
  const { ready, category, sub, allCount, categoryCounts, subCounts, brands, brand, brandScope } = props;
  const visible = ready ? CATEGORIES.filter((c) => (categoryCounts[c.id] ?? 0) > 0 || c.id === category) : CATEGORIES;
  const scrollRef = useRef<HTMLElement>(null);
  // The whole sidebar scrolls (smoothly) as one: categories, then every brand. No "Show all" button.
  useSmoothScroll(scrollRef);

  return (
    <aside
      ref={scrollRef}
      aria-label="Filters"
      className={`min-h-0 flex-col overflow-y-auto overscroll-contain pr-2 pb-4 [scrollbar-width:thin] ${props.className ?? ""}`}
    >
      <div className="flex flex-col gap-7">
      <nav aria-label="Categories">
        <h2 className="eyebrow px-3 pt-1 pb-2">Categories</h2>
        <button type="button" className="list-row" data-quiet aria-pressed={category === null} onClick={() => props.onSelectCategory(null)}>
          <Icon name="sparkles" className="size-5 shrink-0" />
          <span className="flex-1 truncate">All deals</span>
          {ready && <span className="count">{allCount}</span>}
        </button>

        {visible.map((c) => {
          const active = c.id === category;
          const subs = active ? c.subcategories.filter((s) => (subCounts[s.id] ?? 0) > 0 || s.id === sub) : [];
          return (
            <div key={c.id}>
              <button
                type="button"
                className="list-row"
                aria-pressed={active && sub === null}
                aria-expanded={active}
                onClick={() => props.onSelectCategory(c.id)}
              >
                <Icon name={c.icon} className="size-5 shrink-0" />
                <span className={`flex-1 truncate ${active ? "font-semibold" : ""}`}>{c.label}</span>
                {ready && <span className="count">{categoryCounts[c.id] ?? 0}</span>}
              </button>

              {subs.length > 1 && (
                <div className="mb-1 ml-6 animate-fade pl-1">
                  {subs.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="list-row text-small"
                      aria-pressed={s.id === sub}
                      onClick={() => props.onSelectSub(s.id === sub ? null : s.id)}
                    >
                      <span className="flex-1 truncate">{s.label}</span>
                      <span className="count">{subCounts[s.id] ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <section aria-labelledby="sidebar-brands">
        <div className="px-3 pb-2">
          <h2 id="sidebar-brands" className="eyebrow">
            Brands
          </h2>
          {brandScope && <p className="mt-0.5 text-caption text-muted">with {brandScope} deals</p>}
        </div>
        <BrandList brands={brands} selected={brand} onSelect={props.onBrand} searchBackground="bg-bg/85" />
      </section>
      </div>
    </aside>
  );
}
