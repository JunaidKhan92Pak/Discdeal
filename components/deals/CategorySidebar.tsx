"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES } from "@/lib/catalog";
import type { Category } from "@/lib/types";

type CategorySidebarProps = {
  selected: string[];
  counts: Record<string, number>;
  onToggleSub: (id: string) => void;
  onToggleCategory: (category: Category) => void;
  onClear: () => void;
};

function Checkbox({ checked, indeterminate = false, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return <input ref={ref} type="checkbox" className="checkbox" checked={checked} onChange={onChange} aria-label={label} />;
}

/**
 * Category checkboxes with expandable subcategories, shown as a dedicated navigation panel.
 * Desktop: a panel beside the deals. Phones: a "Categories" button that opens a bottom sheet
 * (vertical scroll only — nothing in here scrolls sideways).
 */
export function CategorySidebar({ selected, counts, onToggleSub, onToggleCategory, onClear }: CategorySidebarProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  function toggleExpanded(id: string) {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  return (
    <aside aria-label="Deal categories" className="min-h-0 lg:flex lg:flex-col">
      <button type="button" className="filter-trigger" aria-haspopup="dialog" aria-expanded={sheetOpen} onClick={() => setSheetOpen(true)}>
        <Icon name="tag" className="size-4" />
        Categories
        {selected.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-caption font-bold text-on-accent">{selected.length}</span>}
      </button>

      {sheetOpen && <div className="fixed inset-0 z-40 animate-fade bg-scrim lg:hidden" onClick={() => setSheetOpen(false)} aria-hidden="true" />}

      <div className="filter-panel" data-open={sheetOpen} role={sheetOpen ? "dialog" : undefined} aria-label="Categories">
        <div className="mb-2 flex items-center justify-between border-b border-line px-1 pb-3">
          <h2 className="flex items-center gap-2 text-title">
            <Icon name="tag" className="size-5 text-olive" />
            Categories
          </h2>
          <div className="flex items-center gap-3">
            {selected.length > 0 && (
              <button type="button" onClick={onClear} className="text-caption font-bold text-olive underline-offset-2 hover:underline">
                Clear all
              </button>
            )}
            <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close categories" className="icon-btn size-8 lg:hidden">
              <Icon name="close" className="size-4" />
            </button>
          </div>
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-line overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((category) => {
            const ids = category.subcategories.map((s) => s.id);
            const picked = ids.filter((id) => selected.includes(id)).length;
            const total = ids.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
            const open = expanded.includes(category.id);

            return (
              <li key={category.id} className="py-1.5 first:pt-0 last:pb-0">
                <div className="filter-row" data-active={picked > 0}>
                  <Checkbox
                    checked={picked === ids.length}
                    indeterminate={picked > 0 && picked < ids.length}
                    onChange={() => onToggleCategory(category)}
                    label={`Select all ${category.label}`}
                  />
                  <button type="button" aria-expanded={open} onClick={() => toggleExpanded(category.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <Icon name={category.icon} className="size-5 text-olive" />
                    <span className="flex-1 text-small leading-tight font-bold">{category.label}</span>
                    <span className="count">{total}</span>
                    <Icon name="chevron-right" className={`size-4 text-muted transition-transform duration-300 ease-smooth ${open ? "rotate-90" : ""}`} />
                  </button>
                </div>

                <div className={`grid transition-[grid-template-rows] duration-300 ease-smooth ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <ul inert={!open} className="ml-5 min-h-0 overflow-hidden border-l-2 border-line pl-2">
                    {category.subcategories.map((sub) => (
                      <li key={sub.id}>
                        <label className="filter-row cursor-pointer py-2">
                          <Checkbox checked={selected.includes(sub.id)} onChange={() => onToggleSub(sub.id)} label={sub.label} />
                          <span className="flex-1 text-small leading-tight font-medium text-soft">{sub.label}</span>
                          <span className="count">{counts[sub.id] ?? 0}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>

        <button type="button" className="btn-primary mt-3 w-full lg:hidden" onClick={() => setSheetOpen(false)}>
          Show deals
        </button>
      </div>
    </aside>
  );
}
