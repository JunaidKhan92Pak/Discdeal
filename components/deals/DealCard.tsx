"use client";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { CopyCodeButton } from "@/components/ui/CopyCodeButton";
import { LikeButton } from "@/components/ui/LikeButton";
import { formatEnds, formatPrice } from "@/lib/format";
import type { Deal } from "@/lib/types";

type DealCardProps = { deal: Deal; index: number; liked: boolean; onToggleLike: (id: number) => void; onOpen: (deal: Deal) => void };

export function DealCard({ deal, index, liked, onToggleLike, onOpen }: DealCardProps) {
  const saved = deal.originalPrice - deal.price;

  return (
    <article className="card group h-full animate-rise" data-cat={deal.category} style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className="media">
        {deal.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.image} alt={deal.title} loading="lazy" className="size-full object-cover transition duration-500 ease-smooth group-hover:scale-105" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-surface/70 text-ink shadow-soft transition duration-500 ease-smooth group-hover:scale-110 group-hover:-rotate-6">
            <Icon name={deal.icon} className="size-8" strokeWidth={1.5} />
          </span>
        )}
        <span className="badge absolute top-3 left-3 shadow-soft">-{deal.discountPct}%</span>
        <LikeButton className="absolute top-2 right-2" liked={liked} title={deal.title} onToggle={() => onToggleLike(deal.id)} />
      </div>

      <div className="flex shrink-0 flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <BrandLogo brand={deal.brand} />
          <span className="eyebrow">{deal.brand}</span>
        </div>

        <div>
          <h3 className="line-clamp-2 text-title">{deal.title}</h3>
          <p className="mt-1 line-clamp-2 text-small text-soft [@media(max-height:48rem)]:line-clamp-1 [@media(max-height:40rem)]:hidden">{deal.description}</p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <strong className="text-price tabular-nums">{formatPrice(deal.price)}</strong>
          <s className="text-small tabular-nums text-muted">{formatPrice(deal.originalPrice)}</s>
          <span className="ml-auto text-caption font-semibold text-olive">Save {formatPrice(saved)}</span>
        </div>

        <div className="flex items-center justify-between text-caption text-muted">
          <span>{formatEnds(deal.endsInDays)}</span>
          {deal.code && <CopyCodeButton code={deal.code} />}
        </div>

        <button type="button" className="btn-primary" onClick={() => onOpen(deal)} aria-haspopup="dialog">
          View details
          <Icon name="arrow-right" className="size-4 transition duration-300 ease-smooth group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}
