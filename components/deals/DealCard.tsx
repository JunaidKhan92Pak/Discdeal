"use client";

import { OfferPanel, dealKind } from "@/components/deals/OfferPanel";
import { Icon } from "@/components/ui/Icon";
import { LikeButton } from "@/components/ui/LikeButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { topicPath } from "@/lib/deal-pages";
import { formatCards, formatCities, formatGiver, formatOffer, formatOtherOffer, formatPrice, formatShareText, formatUntil } from "@/lib/format";
import { dataSaver } from "@/lib/network";
import type { Bank, Card, CityId, Deal } from "@/lib/types";

/** Like and share on a card. Phones: 10% smaller (40px, still an easy tap) so they crowd the text column less. */
const CARD_ACTION = "card-action max-sm:size-10 max-sm:[&_svg]:size-[1.3rem]";

type DealCardProps = {
  deal: Deal;
  liked: boolean;
  searchedCities: CityId[];
  myCardIds: string[];
  /** Card names from the data, to show which card a deal needs. */
  cards: Card[];
  /** Bank names from the data, to say who gives a card offer ("By HBL"). */
  banks: Bank[];
  onToggleLike: (id: number) => void;
  onOpen: (deal: Deal) => void;
};

/**
 * One deal. Under the big discount, every card answers the same questions in the same order, so a bank's offer is
 * never mistaken for the shop's own sale:
 *
 *                 BANK OFFER                         STORE SALE
 *   Who gives it  By HBL                             By Breakout
 *   On what       Domino's (where to use it)         Jeans · T-shirts (what is reduced)
 *                 Pizza · Fast food bill             Clothing sale
 *   How           Pay with HBL Konnect Debit         Pay any way · for everyone
 *   (Also)        + Also 30% off with …              + Also 15% off with …
 *   Where, until  Nationwide · Ongoing               Online · Till 31 Dec
 *
 * Without a photo the offer itself is the picture; with one, the photo fills the same frame. The whole card opens the
 * details; the heart is its own button.
 */
export function DealCard({ deal, liked, searchedCities, myCardIds, cards, banks, onToggleLike, onOpen }: DealCardProps) {
  const storeSale = deal.cards.length === 0;
  const items = deal.items ?? [];
  const giver = formatGiver(deal, cards, banks);
  const cardText = formatCards(deal.cards, cards, myCardIds);
  const mine = deal.cards.some((id) => myCardIds.includes(id));
  // The best other way to save here, preferring one the user's own card unlocks.
  const other = deal.otherOffers?.find((o) => o.cards.some((id) => myCardIds.includes(id))) ?? deal.otherOffers?.[0];
  const otherMine = other?.cards.some((id) => myCardIds.includes(id)) ?? false;
  // Three days or less: the date turns amber (with the clock icon, never colour alone).
  const soon = deal.endsInDays !== null && deal.endsInDays <= 3;
  const online = deal.cities.length === 0 && deal.channels.length === 1 && deal.channels[0] === "online";
  const saver = dataSaver();

  // "On what". A bank offer is used AT a place, so the place leads and what it sells follows.
  // A store sale is the shop's own price cut, so the things that are cheaper lead (the shop is already the heading).
  const headline = storeSale ? (items.length > 0 ? items.join(" · ") : deal.title) : deal.brand;
  const detail = storeSale ? (items.length > 0 ? deal.title : dealKind(deal)) : null;
  const label = storeSale
    ? `${formatOffer(deal)} by ${deal.brand} on ${items.length > 0 ? items.join(", ") : deal.title}, for everyone. Show details`
    : `${formatOffer(deal)} by ${giver} at ${deal.brand}, ${items.length > 0 ? `${items.join(", ")}, ` : ""}${deal.title}. Pay with ${cardText}. Show details`;

  return (
    <article className="deal-card">
      {/* Room is kept in the tag's top row; the heart sits on the card itself so it stays above the card-wide tap area.
          With Data Saver on, pictures are left out of the list (they still show in the details). */}
      <OfferPanel deal={deal} showImage={!saver} action={<span className="size-9 shrink-0 max-sm:hidden" aria-hidden="true" />} />
      {/* Like, and share right under it. Phones: they sit in the text column's top-right corner, so the first lines
          of text keep clear of them (pr-11). */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <LikeButton className={CARD_ACTION} liked={liked} title={`${deal.brand} ${formatOffer(deal)}`} onToggle={() => onToggleLike(deal.id)} />
        <ShareButton className={CARD_ACTION} title={`${deal.brand} ${formatOffer(deal)}`} text={formatShareText(deal, cards)} path={topicPath("brand", deal.brandId)} />
      </div>

      {/* Phones: this column sits to the right of the offer, with room kept at the top for the heart. */}
      <div className="flex min-w-0 flex-1 flex-col py-1.5 pr-1.5 pl-3 sm:px-4 sm:pt-4 sm:pb-3.5">
        {/* 1. Who gives it. Blue with a card for a bank; the shop icon for the brand's own sale. */}
        <p className={`flex min-w-0 items-center gap-1.5 text-caption font-bold max-sm:pr-11 sm:text-small ${storeSale ? "text-soft" : "text-primary"}`}>
          <Icon name={storeSale ? "store" : "card"} className="size-4 shrink-0" strokeWidth={2} />
          <span className="truncate">By {giver}</span>
        </p>

        {/* 2. On what: the place (bank offer) or the things that are cheaper (store sale). Opens the details. */}
        <h3 className="mt-0.5 line-clamp-2 text-body leading-snug font-bold text-ink max-sm:pr-11 sm:text-[1.0625rem]" title={headline}>
          <button
            type="button"
            onClick={() => onOpen(deal)}
            aria-haspopup="dialog"
            aria-label={label}
            className="text-left outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
          >
            {headline}
          </button>
        </h3>
        <p className="mt-0.5 truncate text-small leading-snug text-soft max-sm:pr-11">
          {storeSale ? (
            detail
          ) : items.length > 0 ? (
            <>
              <span className="font-semibold text-ink">{items.join(" · ")}</span>
              <span className="text-muted"> · {deal.title}</span>
            </>
          ) : (
            <>
              <span className="text-muted">on </span>
              {deal.title}
            </>
          )}
        </p>

        {deal.price !== undefined && deal.originalPrice !== undefined && (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <strong className="text-body font-bold tabular-nums text-ink">{formatPrice(deal.price)}</strong>
            <s className="text-caption tabular-nums text-muted">{formatPrice(deal.originalPrice)}</s>
          </p>
        )}

        {/* 3. How to get it, on every card (so cards in a row line up). Green when it is the user's own card. */}
        <p
          className={`mt-2 inline-flex max-w-full items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-caption font-semibold max-sm:max-w-[calc(100%-2.75rem)] sm:mt-3 ${
            storeSale ? "bg-fill text-ink" : mine ? "bg-save-soft text-save" : "bg-primary-soft text-primary"
          }`}
        >
          <Icon name={storeSale ? "tag" : mine ? "check" : "card"} className="size-4 shrink-0" strokeWidth={mine ? 2.5 : 1.75} />
          <span className="truncate">
            {storeSale ? (
              <>
                Pay any way<span className="font-medium text-soft"> · for everyone</span>
              </>
            ) : mine ? (
              `Your card: ${cardText}`
            ) : (
              `Pay with ${cardText}`
            )}
          </span>
        </p>

        {/* Another way to save at this brand (a store sale beside a card offer, or a different card). Green when it
            is one of the user's own cards. Whether the two combine is the store's call, so it never says "extra". */}
        {other && (
          <p className={`mt-1.5 flex min-w-0 items-start gap-1 px-1 text-caption leading-snug font-medium ${otherMine ? "text-save" : "text-soft"}`}>
            <Icon name="plus" className="mt-px size-3.5 shrink-0" strokeWidth={2.25} />
            {/* Up to two lines: the card's name comes last and is the part that matters. */}
            <span className="line-clamp-2">
              Also {formatOtherOffer(other, cards, myCardIds)}
              {otherMine && " (your card)"}
            </span>
          </p>
        )}

        {/* 4. Where (left) and until when (right), spread across the card's width, a quiet footnote under the offer.
            Phones: two small pills. Larger screens: plain text with icons, so the card has fewer shapes to read past;
            only an offer that is about to end keeps its amber pill there. */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-caption font-medium sm:gap-3 sm:pt-3.5">
          <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-fill px-2 py-1 text-soft sm:bg-transparent sm:px-0">
            <Icon name="pin" className="size-3.5 shrink-0" />
            <span className="truncate">{online ? "Online" : formatCities(deal.cities, searchedCities)}</span>
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 ${
              soon ? "bg-urgent-soft font-semibold text-urgent" : "bg-fill text-soft sm:bg-transparent sm:px-0"
            }`}
          >
            <Icon name="clock" className="size-3.5 shrink-0" />
            {formatUntil(deal.endsInDays, deal.endsAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
