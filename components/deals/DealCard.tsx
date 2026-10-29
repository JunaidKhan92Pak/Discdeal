"use client";

import { OfferText } from "@/components/deals/OfferText";
import { Icon } from "@/components/ui/Icon";
import { LikeButton } from "@/components/ui/LikeButton";
import { MagicCard } from "@/components/ui/MagicCard";
import { formatCities, formatEnds, formatPrice, isEndingSoon } from "@/lib/format";
import type { CityId, Deal } from "@/lib/types";

type DealCardProps = { deal: Deal; index: number; liked: boolean; searchedCities: CityId[]; onToggleLike: (id: number) => void; onOpen: (deal: Deal) => void };

/**
 * One deal, one fact per line, in the order people decide:
 * picture → the discount (biggest) → what you get → who gives it → price → when it ends and where.
 * Nothing is said twice; the saving in rupees, the code and how to use it are in the details.
 * The whole card opens the details; the heart is its own button. Built on Magic UI's MagicCard (mouse spotlight).
 */
export function DealCard({ deal, index, liked, searchedCities, onToggleLike, onOpen }: DealCardProps) {
  const urgent = isEndingSoon(deal.endsInDays);

  return (
    <MagicCard className="deal-card h-full animate-rise rounded-card">
      <article className="flex h-full flex-col" style={{ animationDelay: `${Math.min(index % 24, 8) * 30}ms` }}>
        <div className="media aspect-[16/10] w-full bg-bg sm:aspect-auto sm:h-36">
          {deal.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.image} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <Icon name={deal.icon} className="size-10 text-muted/70" strokeWidth={1.25} />
          )}
          <LikeButton className="absolute top-1.5 right-1.5 z-10 bg-surface/90 shadow-soft" liked={liked} title={deal.title} onToggle={() => onToggleLike(deal.id)} />
        </div>

        <div className="flex flex-1 flex-col px-3 pt-3 pb-3.5 sm:px-4 sm:pt-4 sm:pb-4">
          <OfferText deal={deal} className="text-offer text-save" />

          <h3 className="mt-1 line-clamp-2 text-small leading-snug font-medium text-ink">
            <button
              type="button"
              onClick={() => onOpen(deal)}
              aria-haspopup="dialog"
              className="text-left outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
            >
              {deal.title}
            </button>
          </h3>

          <p className="mt-1 truncate text-caption font-semibold text-soft">{deal.brand}</p>

          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <strong className="text-body font-bold tabular-nums text-ink">{formatPrice(deal.price)}</strong>
            <s className="text-caption tabular-nums text-muted">{formatPrice(deal.originalPrice)}</s>
          </p>

          <p className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-caption">
            <span className={`inline-flex items-center gap-1 ${urgent ? "font-semibold text-urgent" : "text-soft"}`}>
              <Icon name="clock" className="size-3.5 shrink-0" />
              {formatEnds(deal.endsInDays)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1 text-soft">
              <Icon name="pin" className="size-3.5 shrink-0" />
              <span className="truncate">{formatCities(deal.cities, searchedCities)}</span>
            </span>
          </p>
        </div>
      </article>
    </MagicCard>
  );
}
