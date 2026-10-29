"use client";

import { ToggleGroup } from "radix-ui";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES } from "@/lib/taxonomy";
import type { CategoryId } from "@/lib/types";

type CategoryBarProps = {
  category: CategoryId | null;
  sub: string | null;
  allCount: number;
  categoryCounts: Record<string, number>;
  subCounts: Record<string, number>;
  onSelectCategory: (category: CategoryId | null) => void;
  onSelectSub: (sub: string | null) => void;
};

const ROW =
  "-mx-gutter flex gap-2 overflow-x-auto px-gutter py-1 [mask-image:linear-gradient(to_right,black_90%,transparent)] [scrollbar-width:none] sm:mx-0 sm:px-0.5 lg:[mask-image:none]";

/**
 * Categories as one row of Radix toggle pills (one tap filters; arrow keys move between them).
 * Picking a category opens a second, smaller row with its types. Categories with no matches are hidden.
 */
export function CategoryBar({ category, sub, allCount, categoryCounts, subCounts, onSelectCategory, onSelectSub }: CategoryBarProps) {
  const visible = CATEGORIES.filter((c) => (categoryCounts[c.id] ?? 0) > 0 || c.id === category);
  const selected = CATEGORIES.find((c) => c.id === category);
  const subs = selected?.subcategories.filter((s) => (subCounts[s.id] ?? 0) > 0 || s.id === sub) ?? [];

  // Nothing to choose (e.g. the search already narrowed it to one category): give the row's space to the deals.
  if (category === null && visible.length <= 1) return null;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <ToggleGroup.Root
        type="single"
        value={category ?? "all"}
        onValueChange={(value) => onSelectCategory(value && value !== "all" ? (value as CategoryId) : null)}
        aria-label="Filter by category"
        className={ROW}
      >
        <ToggleGroup.Item value="all" className="pill">
          All
          <span className="count">{allCount}</span>
        </ToggleGroup.Item>
        {visible.map((c) => (
          <ToggleGroup.Item key={c.id} value={c.id} className="pill">
            <Icon name={c.icon} className="size-5" />
            {c.short}
            <span className="count">{categoryCounts[c.id] ?? 0}</span>
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      {selected && subs.length > 1 && (
        <ToggleGroup.Root
          type="single"
          value={sub ?? ""}
          onValueChange={(value) => onSelectSub(value || null)}
          aria-label={`Filter ${selected.label}`}
          className={`${ROW} animate-fade items-center`}
        >
          <span className="shrink-0 text-small text-muted">{selected.short}:</span>
          {subs.map((s) => (
            <ToggleGroup.Item key={s.id} value={s.id} className="chip">
              {s.label}
              <span className="count">{subCounts[s.id] ?? 0}</span>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      )}
    </div>
  );
}
