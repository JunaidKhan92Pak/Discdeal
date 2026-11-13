"use client";

import { useRef } from "react";
import { BrandList } from "@/components/deals/BrandList";
import { useDealsContext } from "@/components/deals/DealsContext";
import { CheckMark } from "@/components/ui/CheckMark";
import { Icon } from "@/components/ui/Icon";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { CATEGORIES } from "@/lib/taxonomy";

type FilterSidebarProps = { className?: string };

/**
 * Desktop filters, all visible at once (on phones the same filters are pills and a Brand sheet):
 * categories with their types opening underneath, then brands. Several can be ticked at each level ("All …" clears
 * them); no counts, to keep it calm. Ticking categories narrows the brand list below.
 */
export function FilterSidebar({ className }: FilterSidebarProps) {
  const { state, actions } = useDealsContext();
  // Until the first results arrive every category is listed; empty ones are hidden after.
  const { ready, categories, subs: chosenSubs, categoryCounts, subCounts, brands, selectedBrands, brandScope } = state;
  const visible = ready ? CATEGORIES.filter((c) => (categoryCounts[c.id] ?? 0) > 0 || categories.includes(c.id)) : CATEGORIES;
  const scrollRef = useRef<HTMLElement>(null);
  // The whole sidebar scrolls (smoothly) as one: categories, then every brand. No "Show all" button.
  useSmoothScroll(scrollRef);

  return (
    <aside
      ref={scrollRef}
      aria-label="Filters"
      className={`min-h-0 flex-col scroll-pt-16 overflow-y-auto overscroll-contain pr-2 pb-4 [scrollbar-width:thin] ${className ?? ""}`}
    >
      <div className="flex flex-col gap-7">
      <section aria-label="Categories">
        <h2 className="eyebrow px-3 pt-1 pb-2">Categories</h2>
        <button type="button" className="list-row" data-quiet aria-pressed={categories.length === 0} onClick={actions.clearCategories}>
          <Icon name="sparkles" className="size-5 shrink-0" />
          <span className="flex-1 truncate">All deals</span>
        </button>

        {visible.map((c) => {
          const active = categories.includes(c.id);
          // A ticked category opens its types underneath; ticking some of them narrows that category to just those.
          const subs = active ? c.subcategories.filter((s) => (subCounts[s.id] ?? 0) > 0 || chosenSubs.includes(s.id)) : [];
          return (
            <div key={c.id}>
              <button
                type="button"
                className="list-row"
                aria-pressed={active}
                // Only says "expanded" when a list of types really opens underneath.
                aria-expanded={subs.length > 1 ? true : undefined}
                aria-controls={subs.length > 1 ? `types-${c.id}` : undefined}
                onClick={() => actions.toggleCategory(c.id)}
              >
                <Icon name={c.icon} className="size-5 shrink-0" />
                <span className="flex-1 truncate">{c.label}</span>
                <CheckMark />
              </button>

              {subs.length > 1 && (
                <div id={`types-${c.id}`} className="mb-1 ml-6 animate-fade pl-1" role="group" aria-label={`Types of ${c.label}`}>
                  {subs.map((s) => (
                    <button key={s.id} type="button" className="list-row text-small" aria-pressed={chosenSubs.includes(s.id)} onClick={() => actions.toggleSub(s.id)}>
                      <span className="flex-1 truncate">{s.label}</span>
                      <CheckMark />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section aria-labelledby="sidebar-brands">
        <div className="px-3 pb-2">
          <h2 id="sidebar-brands" className="eyebrow">
            Brands
          </h2>
          {brandScope && <p className="mt-0.5 text-caption text-muted">with {brandScope} deals</p>}
        </div>
        <BrandList brands={brands} selected={selectedBrands} onToggle={actions.toggleBrand} onClear={actions.clearBrands} searchBackground="bg-bg/85" />
      </section>
      </div>
    </aside>
  );
}
