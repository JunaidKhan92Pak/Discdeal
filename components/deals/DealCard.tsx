"use client";

import { OfferPanel } from "@/components/deals/OfferPanel";
import { Icon } from "@/components/ui/Icon";
import { LikeButton } from "@/components/ui/LikeButton";
import { formatCards, formatCities, formatOffer, formatPrice, formatUntil } from "@/lib/format";
import { dataSaver } from "@/lib/network";
import type { Card, CityId, Deal } from "@/lib/types";

type DealCardProps = {
  deal: Deal;
  liked: boolean;
  searchedCities: CityId[];
  myCardIds: string[];
  /** Card names from the data, to show which card a deal needs. */
  cards: Card[];
  onToggleLike: (id: number) => void;
  onOpen: (deal: Deal) => void;
};

/**
 * One deal, read top to bottom in the order people decide:
 *   the discount, big ("UP TO 50% OFF"), and what it is on ("Pizza, burgers & fast food")
 *   → who gives it (brand) and on what ("on Fast food bill") → the bank card it needs, if any
 *   → where and until when ("Karachi +4", "Till 9 May").
 * Without a photo the offer itself is the picture; with one, the photo fills the same frame. The whole card opens the
 * details; the heart is its own button.
 */
export function DealCard({ deal, liked, searchedCities, myCardIds, cards, onToggleLike, onOpen }: DealCardProps) {
  const mine = deal.cards.some((id) => myCardIds.includes(id));
  // Three days or less: the date turns amber (with the clock icon, never colour alone).
  const soon = deal.endsInDays !== null && deal.endsInDays <= 3;
  const online = deal.cities.length === 0 && deal.channels.length === 1 && deal.channels[0] === "online";
  const saver = dataSaver();

  return (
    <article className="deal-card">
      {/* Room is kept in the tag's top row; the heart sits on the card itself so it stays above the card-wide tap area.
          With Data Saver on, pictures are left out of the list (they still show in the details). */}
      <OfferPanel deal={deal} showImage={!saver} action={<span className="size-9 shrink-0" aria-hidden="true" />} />
      <LikeButton className="card-action absolute top-2 right-2 z-10" liked={liked} title={deal.title} onToggle={() => onToggleLike(deal.id)} />

      <div className="flex flex-1 flex-col px-2.5 pt-3 pb-2.5 sm:px-3">
        <h3 className="truncate text-body leading-snug font-bold text-ink sm:text-[1.0625rem]">
          <button
            type="button"
            onClick={() => onOpen(deal)}
            aria-haspopup="dialog"
            aria-label={`${formatOffer(deal)} at ${deal.brand}: ${deal.title}. Show details`}
            className="text-left outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
          >
            {deal.brand}
          </button>
        </h3>
        <p className="mt-0.5 truncate text-small leading-snug text-soft">
          <span className="text-muted">on </span>
          {deal.title}
        </p>

        {deal.price !== undefined && deal.originalPrice !== undefined && (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <strong className="text-body font-bold tabular-nums text-ink">{formatPrice(deal.price)}</strong>
            <s className="text-caption tabular-nums text-muted">{formatPrice(deal.originalPrice)}</s>
          </p>
        )}

        {/* Every card has this line, so cards in a row line up with no empty gaps. */}
        <p
          className={`mt-2.5 inline-flex max-w-full items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-caption font-semibold ${
            deal.cards.length === 0 ? "bg-fill text-soft" : mine ? "bg-save-soft text-save" : "bg-primary-soft text-primary"
          }`}
        >
          <Icon name={deal.cards.length === 0 ? "tag" : mine ? "check" : "card"} className="size-4 shrink-0" strokeWidth={mine ? 2.5 : 1.75} />
          <span className="truncate">
            {deal.cards.length === 0 ? "No card needed" : mine ? `Your card: ${formatCards(deal.cards, cards, myCardIds)}` : `with ${formatCards(deal.cards, cards)}`}
          </span>
        </p>

        <div className="mt-auto flex items-center gap-1 pt-2 text-caption font-medium">
          <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-fill px-2 py-1 text-soft">
            <Icon name="pin" className="size-3.5 shrink-0" />
            <span className="truncate">{online ? "Online" : formatCities(deal.cities, searchedCities)}</span>
          </span>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 ${soon ? "bg-urgent-soft font-semibold text-urgent" : "bg-fill text-soft"}`}>
            <Icon name="clock" className="size-3.5 shrink-0" />
            {formatUntil(deal.endsInDays, deal.endsAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
