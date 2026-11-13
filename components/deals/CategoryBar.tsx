"use client";

import { ToggleGroup } from "radix-ui";
import { useDealsContext } from "@/components/deals/DealsContext";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES } from "@/lib/taxonomy";
import type { CategoryId } from "@/lib/types";

const ROW =
  "-mx-gutter flex gap-2 overflow-x-auto px-gutter py-1 [scrollbar-width:none] sm:mx-0 sm:px-0.5";

/** The one value that is in `next` but not `prev`, or the other way round: what a tap just changed. */
function changed(prev: string[], next: string[]): string | undefined {
  return next.find((v) => !prev.includes(v)) ?? prev.find((v) => !next.includes(v));
}

/**
 * Categories as one row of Radix toggle pills (one tap turns one on or off; several can be on; arrow keys move
 * between them). "All" clears them. Every chosen category opens its types in a second, smaller row, where several
 * can be ticked too. Categories with no matches are hidden.
 */
export function CategoryBar() {
  const {
    state: { categories, subs, categoryCounts, subCounts },
    actions: { toggleCategory: onToggleCategory, clearCategories: onClearCategories, toggleSub: onToggleSub },
  } = useDealsContext();
  const visible = CATEGORIES.filter((c) => (categoryCounts[c.id] ?? 0) > 0 || categories.includes(c.id));
  const open = CATEGORIES.filter((c) => categories.includes(c.id))
    .map((c) => ({ category: c, subs: c.subcategories.filter((s) => (subCounts[s.id] ?? 0) > 0 || subs.includes(s.id)) }))
    .filter((g) => g.subs.length > 1);

  // Nothing to choose (e.g. the search already narrowed it to one category): give the row's space to the deals.
  if (categories.length === 0 && visible.length <= 1) return null;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className={ROW}>
        <button type="button" className="pill" aria-pressed={categories.length === 0} onClick={onClearCategories}>
          All
        </button>
        <ToggleGroup.Root
          type="multiple"
          value={categories}
          onValueChange={(next) => {
            const id = changed(categories, next);
            if (id) onToggleCategory(id as CategoryId);
          }}
          aria-label="Filter by category (choose one or more)"
          className="flex gap-2"
        >
          {visible.map((c) => (
            <ToggleGroup.Item key={c.id} value={c.id} className="pill">
              <Icon name={c.icon} className="size-5" />
              {c.short}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      {open.length > 0 && (
        <ToggleGroup.Root
          type="multiple"
          value={subs}
          onValueChange={(next) => {
            const id = changed(subs, next);
            if (id) onToggleSub(id);
          }}
          aria-label="Narrow by type (choose one or more)"
          className={`${ROW} animate-fade items-center`}
        >
          {open.map(({ category, subs: shown }) => (
            // Grouped and named, so a screen reader says which category "Pizza" or "Jeans" belongs to.
            <div key={category.id} role="group" aria-label={`Types of ${category.label}`} className="flex shrink-0 items-center gap-2">
              <span className="shrink-0 text-small text-muted" aria-hidden="true">
                {category.short}:
              </span>
              {shown.map((s) => (
                <ToggleGroup.Item key={s.id} value={s.id} className="chip">
                  {s.label}
                </ToggleGroup.Item>
              ))}
            </div>
          ))}
        </ToggleGroup.Root>
      )}
    </div>
  );
}
