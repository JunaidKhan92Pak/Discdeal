"use client";

import type { RefObject } from "react";
import { Dialog } from "radix-ui";
import { useDealsContext } from "@/components/deals/DealsContext";
import { OfferPanel } from "@/components/deals/OfferPanel";
import { CopyCodeButton } from "@/components/ui/CopyCodeButton";
import { LikeButton } from "@/components/ui/LikeButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { topicPath } from "@/lib/deal-pages";
import { Icon } from "@/components/ui/Icon";
import { cardName, formatChannels, formatCityList, formatDate, formatEnds, formatGiver, formatOffer, formatOtherOffer, formatPrice, formatShareText, isEndingSoon } from "@/lib/format";
import type { Deal } from "@/lib/types";

type DealModalProps = {
  deal: Deal;
  open: boolean;
  /** Gets focus back on close (Radix only does this for its own Dialog.Trigger, and cards open the dialog themselves). */
  returnFocusTo: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
};

/**
 * Full details for one deal, as a Radix Dialog: focus stays inside, Esc / × / tapping outside closes it,
 * the page behind does not scroll, and focus returns to the card afterwards.
 * A bottom sheet on phones (within thumb reach), a centred dialog on larger screens.
 */
export function DealModal({ deal, open, returnFocusTo, onOpenChange }: DealModalProps) {
  const {
    state: { liked: likedIds, myCards, cards },
    actions: { toggleLike: onToggleLike, showBrand: onShowBrand },
  } = useDealsContext();
  const liked = likedIds.includes(deal.id);
  const myCardIds = myCards.cards;
  const urgent = isEndingSoon(deal.endsInDays);
  const hasPrice = deal.price !== undefined && deal.originalPrice !== undefined;
  const source = sourceName(deal.sourceUrl);
  const others = deal.otherOffers ?? [];
  // The one place the dialog decides what kind of deal this is; each kind lays out its own parts below.
  const Kind = deal.cards.length === 0 ? STORE_SALE : CARD_OFFER;

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
          className="sheet flex max-h-[92svh] flex-col">
          {/* Close sits outside the panel, so the panel's corner can hold like and share. Phones: floating just above
              the sheet. Larger screens: beside the dialog's top-right corner. (The dialog itself does not scroll, the
              inner part does, so this button is never clipped.) Esc and tapping outside close it too. */}
          <Dialog.Close className="icon-btn glass absolute -top-14 right-3 z-10 text-ink sm:top-0 sm:-right-14" aria-label="Close details">
            <Icon name="close" className="size-6" />
          </Dialog.Close>

          {/* The clip: keeps the scrollbar inside the rounded corners (the sheet itself cannot clip, or the close
              button outside it would be cut off). scroll-pb: the pinned "View offer" bar never covers the field that
              has keyboard focus. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
          <div className="sheet-scroll scroll-pb-28">
            <div className="p-2">
              <OfferPanel
                deal={deal}
                image={deal.image}
                size="lg"
                action={
                  <div className="relative z-10 -mt-1 -mr-1 flex shrink-0 gap-2">
                    <LikeButton className="glass text-ink" liked={liked} title={`${deal.brand} ${formatOffer(deal)}`} onToggle={() => onToggleLike(deal.id)} />
                    <ShareButton className="glass text-ink" title={`${deal.brand} ${formatOffer(deal)}`} text={formatShareText(deal, cards)} path={topicPath("brand", deal.brandId)} />
                  </div>
                }
              />
            </div>

            <div className="space-y-5 px-5 pt-3 sm:px-6">
              <div>
                {/* Same order as the card: who gives it, then the place (bank offer) or the things on sale (store sale). */}
                <Kind.Heading deal={deal} />
                {deal.items && deal.items.length > 0 && (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Good for">
                    {deal.items.map((item) => (
                      <li key={item} className="inline-flex items-center rounded-full bg-fill px-3 py-1 text-small font-semibold text-ink">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => onShowBrand(deal)}
                  className="chip mt-3 h-9 bg-primary-soft font-semibold text-primary hover:bg-primary hover:text-on-primary"
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

              {/* How to get it. A store sale is the brand's own reduced price; a card offer is the bank's, card only. */}
              <Kind.HowToPay deal={deal} />

              {/* Other ways to save at this brand. Honest about combining: some stores let a bank offer apply on top of
                  a sale, many do not, so we say so instead of promising a bigger total. */}
              {others.length > 0 && (
                <div className="rounded-panel bg-fill px-4 py-3.5">
                  <p className="text-small font-semibold text-soft">Also at {deal.brand}</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {others.map((other) => {
                      const yours = other.cards.some((id) => myCardIds.includes(id));
                      return (
                        <li key={other.id} className="flex items-start gap-2 text-body font-semibold text-ink">
                          <Icon name={other.cards.length === 0 ? "tag" : yours ? "check" : "card"} className={`mt-0.5 size-5 shrink-0 ${yours ? "text-save" : "text-soft"}`} />
                          <span>
                            {sentenceCase(formatOtherOffer(other, cards, myCardIds))}
                            {yours && <span className="block text-small font-semibold text-save"><span aria-hidden="true">✓ </span>You have this card</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-small text-muted">
                    {others.some((o) => (o.cards.length === 0) !== (deal.cards.length === 0))
                      ? "A store sale and a bank offer are separate. Ask the store whether both apply to the same bill."
                      : "Each card has its own offer. Use whichever card you have."}
                  </p>
                </div>
              )}

              <Dialog.Description className="text-body text-soft">
                {deal.description || Kind.note}
              </Dialog.Description>

              <dl className="grid gap-1.5 text-body">
                <div className="panel flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="shrink-0 text-soft">Available in</dt>
                  <dd className="text-right font-semibold">{formatCityList(deal.cities)}</dd>
                </div>
                <div className="panel flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="shrink-0 text-soft">How to use</dt>
                  <dd className="text-right font-semibold">{formatChannels(deal.channels)}</dd>
                </div>
                <div className={`flex items-center justify-between gap-4 rounded-panel px-4 py-3 ${urgent ? "bg-urgent-soft" : "bg-fill"}`}>
                  <dt className="shrink-0 text-soft">Offer ends</dt>
                  <dd className={`inline-flex items-center gap-1.5 text-right font-semibold ${urgent ? "text-urgent" : ""}`}>
                    <Icon name="clock" className="size-4 shrink-0" />
                    {deal.endsAt ? `${formatDate(deal.endsAt)} (${formatEnds(deal.endsInDays, null).toLowerCase()})` : "No end date given"}
                  </dd>
                </div>
                {deal.code && (
                  <div className="panel flex items-center justify-between gap-4 px-4 py-3">
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

              {/* Always within thumb reach: the one main action stays pinned to the bottom while the details scroll.
                  Like and share live on the offer panel at the top, so this button has the full width. */}
              <div className="sticky bottom-0 -mx-5 flex bg-glass-strong px-5 pt-3 pb-4 backdrop-blur-xl sm:-mx-6 sm:px-6 sm:pb-5">
                <a href={deal.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-primary min-w-0 flex-1">
                  <span className="truncate">View offer on {source}</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                  <Icon name="arrow-up-right" className="size-5 shrink-0" />
                </a>
              </div>
            </div>
          </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type DealPartProps = { deal: Deal };

/** A store sale: the brand has cut its own price, for everyone. */
function StoreSaleHeading({ deal }: DealPartProps) {
  return (
    <>
      <p className="flex items-center gap-1.5 text-small font-bold text-soft">
        <Icon name="store" className="size-4 shrink-0" strokeWidth={2} />
        By {deal.brand} · its own sale
      </p>
      <Dialog.Title className="mt-1 text-headline text-ink">
        <span className="sr-only">
          {formatOffer(deal)} by {deal.brand} on{" "}
        </span>
        {deal.title}
      </Dialog.Title>
    </>
  );
}

function StoreSaleHowToPay() {
  return (
    <div className="flex items-start gap-3 rounded-panel bg-fill px-4 py-3.5">
      <Icon name="tag" className="mt-0.5 size-5 shrink-0 text-ink" />
      <div>
        <p className="text-body font-semibold text-ink">Pay any way, for everyone</p>
        <p className="mt-0.5 text-small text-soft">The store has cut the price itself. Pay any way it accepts: cash or any card.</p>
      </div>
    </div>
  );
}

/** A bank card offer: the bank gives it, at this brand, only when paying with its cards. */
function CardOfferHeading({ deal }: DealPartProps) {
  const {
    state: { cards, banks },
  } = useDealsContext();
  const giver = formatGiver(deal, cards, banks);
  return (
    <>
      <p className="flex items-center gap-1.5 text-small font-bold text-primary">
        <Icon name="card" className="size-4 shrink-0" strokeWidth={2} />
        By {giver} · bank card offer
      </p>
      <Dialog.Title className="mt-1 text-headline text-ink">
        <span className="sr-only">
          {formatOffer(deal)} by {giver} at{" "}
        </span>
        {deal.brand}
      </Dialog.Title>
      <p className="mt-1 text-body text-soft">
        <span className="text-muted">on </span>
        {deal.title}
      </p>
    </>
  );
}

function CardOfferHowToPay({ deal }: DealPartProps) {
  const {
    state: { cards, myCards },
  } = useDealsContext();
  return (
    <div className="rounded-panel bg-primary-soft px-4 py-3.5">
      <p className="text-small font-semibold text-primary">Bank card offer: pay with</p>
      <ul className="mt-1 space-y-1">
        {deal.cards.map((id) => (
          <li key={id} className="flex items-start gap-2 text-body font-semibold text-ink">
            <Icon name="card" className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              {cardName(id, cards)}
              {myCards.cards.includes(id) && <span className="block text-small font-semibold text-save"><span aria-hidden="true">✓ </span>You have this card</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STORE_SALE = {
  Heading: StoreSaleHeading,
  HowToPay: StoreSaleHowToPay,
  note: "The reduced price is already set by the store. It may change or end at any time.",
};

const CARD_OFFER = {
  Heading: CardOfferHeading,
  HowToPay: CardOfferHowToPay,
  note: "Show your card when you pay. The bank may change or end the offer at any time.",
};

const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "https://www.hbl.com/…" → "hbl.com" */
function sourceName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the source";
  }
}
