"use client";

import type { RefObject } from "react";
import { Dialog } from "radix-ui";
import { OfferText } from "@/components/deals/OfferText";
import { CopyCodeButton } from "@/components/ui/CopyCodeButton";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES } from "@/lib/taxonomy";
import { formatChannels, formatCityList, formatEnds, formatPrice, isEndingSoon } from "@/lib/format";
import type { Deal } from "@/lib/types";

type DealModalProps = {
  deal: Deal;
  open: boolean;
  /** Gets focus back on close (Radix only does this for its own Dialog.Trigger, and cards open the dialog themselves). */
  returnFocusTo: RefObject<HTMLElement | null>;
  liked: boolean;
  onToggleLike: (id: number) => void;
  onOpenChange: (open: boolean) => void;
  /** "All deals from {brand}": filter the results to this deal's brand. */
  onShowBrand: (deal: Deal) => void;
};

/**
 * Full details for one deal, as a Radix Dialog: focus stays inside, Esc / × / tapping outside closes it,
 * the page behind does not scroll, and focus returns to the card afterwards.
 * A bottom sheet on phones (within thumb reach), a centred dialog on larger screens.
 */
export function DealModal({ deal, open, returnFocusTo, liked, onToggleLike, onOpenChange, onShowBrand }: DealModalProps) {
  const category = CATEGORIES.find((c) => c.id === deal.category);
  const subcategory = category?.subcategories.find((sc) => sc.id === deal.subcategory);
  const urgent = isEndingSoon(deal.endsInDays);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            if (!returnFocusTo.current) return;
            event.preventDefault();
            returnFocusTo.current.focus();
          }}
          className="sheet max-h-[92svh] overflow-y-auto overscroll-contain">
          <div className="media relative h-40 rounded-t-[inherit] sm:h-48">
            {deal.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={deal.image} alt="" className="size-full object-cover" />
            ) : (
              <Icon name={deal.icon} className="size-14 text-muted" strokeWidth={1.5} />
            )}
            <Dialog.Close className="icon-btn absolute top-2 right-2 bg-surface/90 shadow-soft" aria-label="Close details">
              <Icon name="close" className="size-6" />
            </Dialog.Close>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <OfferText deal={deal} className="text-headline text-save" />
              <Dialog.Title className="mt-1 text-title text-ink">{deal.title}</Dialog.Title>
              <p className="mt-1 text-small font-semibold text-soft">
                {deal.brand}
                {category && (
                  <span className="font-normal text-muted">
                    {" · "}
                    {subcategory?.label ?? category.label}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => onShowBrand(deal)}
                className="-ml-1 mt-1 inline-flex min-h-9 items-center gap-1 rounded-button px-1 text-small font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                All deals from {deal.brand}
                <Icon name="chevron-right" className="size-4" />
              </button>
            </div>

            <div>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <strong className="text-price tabular-nums">{formatPrice(deal.price)}</strong>
                <s className="text-body tabular-nums text-muted">{formatPrice(deal.originalPrice)}</s>
              </p>
              <p className="mt-0.5 text-body font-semibold text-save">You save {formatPrice(deal.originalPrice - deal.price)}</p>
            </div>

            <Dialog.Description className="text-body text-soft">{deal.description}</Dialog.Description>

            <dl className="divide-y divide-line-soft rounded-card border border-line text-body">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="shrink-0 text-soft">Available in</dt>
                <dd className="text-right font-semibold">{formatCityList(deal.cities)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="shrink-0 text-soft">How to use</dt>
                <dd className="text-right font-semibold">{formatChannels(deal.channels)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="shrink-0 text-soft">Offer ends</dt>
                <dd className={`inline-flex items-center gap-1.5 font-semibold ${urgent ? "text-urgent" : ""}`}>
                  <Icon name="clock" className="size-4" />
                  {formatEnds(deal.endsInDays)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="shrink-0 text-soft">Coupon code</dt>
                <dd>{deal.code ? <CopyCodeButton code={deal.code} /> : <span className="font-semibold">No code needed</span>}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <a href={deal.url} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1">
                Go to {deal.brand}
                <Icon name="arrow-up-right" className="size-5" />
              </a>
              <button type="button" className="btn-secondary" aria-pressed={liked} onClick={() => onToggleLike(deal.id)}>
                <Icon name="heart" className="size-5" fill={liked ? "currentColor" : "none"} />
                {liked ? "Liked" : "Like"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
