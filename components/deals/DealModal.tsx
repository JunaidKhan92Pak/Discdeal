"use client";

import { useEffect, useRef } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { CopyCodeButton } from "@/components/ui/CopyCodeButton";
import { LikeButton } from "@/components/ui/LikeButton";
import { CATEGORIES } from "@/lib/catalog";
import { formatEnds, formatPrice } from "@/lib/format";
import type { Deal } from "@/lib/types";

type DealModalProps = { deal: Deal; liked: boolean; onToggleLike: (id: number) => void; onClose: () => void };

/** Full details for one deal. Closes with Esc, the × button, or a click on the backdrop. */
export function DealModal({ deal, liked, onToggleLike, onClose }: DealModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const category = CATEGORIES.find((c) => c.id === deal.category);
  const subcategory = category?.subcategories.find((sc) => sc.id === deal.subcategory);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid animate-fade place-items-center bg-scrim p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deal-modal-title"
        data-cat={deal.category}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90svh] w-full max-w-lg animate-pop overflow-y-auto rounded-card border border-line bg-surface shadow-card-hover"
      >
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close details" className="icon-btn absolute top-3 right-3 z-10 size-9 bg-surface text-ink shadow-soft">
          <Icon name="close" className="size-5" />
        </button>

        <LikeButton className="absolute top-3 right-14 z-10" liked={liked} title={deal.title} onToggle={() => onToggleLike(deal.id)} />

        <div className="media h-40 grow-0 basis-auto">
          {deal.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.image} alt={deal.title} className="size-full object-cover" />
          ) : (
            <span className="grid size-24 place-items-center rounded-full bg-surface/70 text-ink shadow-soft">
              <Icon name={deal.icon} className="size-12" strokeWidth={1.5} />
            </span>
          )}
          <span className="badge absolute top-3 left-3 shadow-soft">-{deal.discountPct}%</span>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <BrandLogo brand={deal.brand} />
            <span className="text-small font-semibold">{deal.brand}</span>
            {category && (
              <span className="eyebrow ml-auto inline-flex items-center gap-1.5">
                <Icon name={category.icon} className="size-4" /> {category.label}{subcategory ? ` · ${subcategory.label}` : ""}
              </span>
            )}
          </div>

          <div>
            <h2 id="deal-modal-title" className="text-title">{deal.title}</h2>
            <p className="mt-2 text-body text-soft">{deal.description}</p>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong className="text-headline tabular-nums">{formatPrice(deal.price)}</strong>
            <s className="text-body tabular-nums text-muted">{formatPrice(deal.originalPrice)}</s>
            <span className="text-small font-semibold text-olive">You save {formatPrice(deal.originalPrice - deal.price)} ({deal.discountPct}%)</span>
          </div>

          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 rounded-card border border-line-soft p-3 text-small">
            <dt className="text-muted">Offer ends</dt>
            <dd className="text-right font-semibold">{formatEnds(deal.endsInDays)}</dd>
            <dt className="text-muted">Coupon code</dt>
            <dd className="flex justify-end">{deal.code ? <CopyCodeButton code={deal.code} /> : <span className="font-semibold">No code needed</span>}</dd>
          </dl>

          <a href={deal.url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
            Go to {deal.brand} <Icon name="arrow-up-right" className="size-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
