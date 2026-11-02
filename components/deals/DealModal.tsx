"use client";

import type { RefObject } from "react";
import { Dialog } from "radix-ui";
import { OfferText } from "@/components/deals/OfferText";
import { CopyCodeButton } from "@/components/ui/CopyCodeButton";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES } from "@/lib/taxonomy";
import { cardName, formatChannels, formatCityList, formatDate, formatEnds, formatPrice, isEndingSoon } from "@/lib/format";
import type { Card, Deal } from "@/lib/types";

type DealModalProps = {
  deal: Deal;
  /** The user's saved cards (to mark "You have this card"). */
  myCardIds: string[];
  /** Card names from the data. */
  cards: Card[];
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
export function DealModal({ deal, myCardIds, cards, open, returnFocusTo, liked, onToggleLike, onOpenChange, onShowBrand }: DealModalProps) {
  const category = CATEGORIES.find((c) => c.id === deal.category);
  const subcategory = category?.subcategories.find((sc) => sc.id === deal.subcategory);
  const urgent = isEndingSoon(deal.endsInDays);
  const hasPrice = deal.price !== undefined && deal.originalPrice !== undefined;
  const source = sourceName(deal.sourceUrl);

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

            {hasPrice && (
              <div>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <strong className="text-price tabular-nums">{formatPrice(deal.price!)}</strong>
                  <s className="text-body tabular-nums text-muted">{formatPrice(deal.originalPrice!)}</s>
                </p>
                <p className="mt-0.5 text-body font-semibold text-save">You save {formatPrice(deal.originalPrice! - deal.price!)}</p>
              </div>
            )}

            {deal.cards.length > 0 && (
              <div className="rounded-card bg-primary-soft px-4 py-3">
                <p className="text-small font-semibold text-primary">Pay with</p>
                <ul className="mt-1 space-y-1">
                  {deal.cards.map((id) => (
                    <li key={id} className="flex items-start gap-2 text-body font-semibold text-ink">
                      <Icon name="card" className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span>
                        {cardName(id, cards)}
                        {myCardIds.includes(id) && <span className="block text-small font-semibold text-save">✓ You have this card</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Dialog.Description className="text-body text-soft">
              {deal.description || "Show your card when you pay. The bank may change or end the offer at any time."}
            </Dialog.Description>

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
                <dd className={`inline-flex items-center gap-1.5 text-right font-semibold ${urgent ? "text-urgent" : ""}`}>
                  <Icon name="clock" className="size-4 shrink-0" />
                  {deal.endsAt ? `${formatDate(deal.endsAt)} (${formatEnds(deal.endsInDays, null).toLowerCase()})` : "No end date given"}
                </dd>
              </div>
              {deal.code && (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="shrink-0 text-soft">Coupon code</dt>
                  <dd>
                    <CopyCodeButton code={deal.code} />
                  </dd>
                </div>
              )}
            </dl>

            <p className="flex items-start gap-2 text-small text-muted">
              <Icon name="check" className="mt-0.5 size-4 shrink-0" />
              <span>
                From {source}, checked on {formatDate(deal.checkedAt)}. Offers can change, so please confirm before you pay.
              </span>
            </p>

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <a href={deal.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1">
                View offer on {source}
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

/** "https://www.hbl.com/…" → "hbl.com" */
function sourceName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the source";
  }
}
