"use client";

import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { BrandList } from "@/components/deals/BrandList";
import { Icon } from "@/components/ui/Icon";
import type { BrandChoice } from "@/hooks/useBrowseFilters";
import type { BrandFacet } from "@/lib/types";

type BrandPickerProps = {
  /** Brands in the current results (already narrowed by category, search, city …), A–Z. */
  brands: BrandFacet[];
  selected: BrandChoice | null;
  /** Where the list comes from, for the subtitle: "Food", "Fast food" … null = everything. */
  scope: string | null;
  onSelect: (brand: BrandChoice | null) => void;
};

/**
 * Phones and tablets: the "Brand" button and its list in a Radix Dialog (a bottom sheet on phones).
 * On desktop the same list sits in the sidebar instead. Picking a brand closes the sheet.
 */
export function BrandPicker({ brands, selected, scope, onSelect }: BrandPickerProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  function choose(brand: BrandChoice | null) {
    onSelect(brand);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="pill" data-active={selected !== null}>
        <Icon name="tag" className="size-4" />
        <span className="max-w-36 truncate">{selected?.name ?? "Brand"}</span>
        <Icon name="chevron-down" className="size-4" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content
          ref={contentRef}
          className="sheet flex max-h-[85svh] flex-col"
          onOpenAutoFocus={(event) => {
            // On touch screens, opening the keyboard straight away would hide the list; let people scroll first.
            if (matchMedia("(pointer: coarse)").matches) {
              event.preventDefault();
              contentRef.current?.focus();
            }
          }}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div>
              <Dialog.Title className="text-title">Choose a brand</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-small text-soft">
                {scope ? `Brands with ${scope} deals` : "Brands with deals right now"}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-btn -mt-2 -mr-2 shrink-0" aria-label="Close brand list">
              <Icon name="close" className="size-6" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
            <BrandList brands={brands} selected={selected} onSelect={choose} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
