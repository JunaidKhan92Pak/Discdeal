import Link from "next/link";
import { OfferText } from "@/components/deals/OfferText";
import { Icon } from "@/components/ui/Icon";
import { topicPath } from "@/lib/deal-pages";
import { cardName, formatChannels, formatCityList, formatDate, formatEnds } from "@/lib/format";
import type { Card, Deal } from "@/lib/types";

/** One deal as readable text: offer, what you get, brand, card, where, until when, and the source to check it. */
export function DealRow({ deal, cards, linkBrand = true }: { deal: Deal; cards: Card[]; linkBrand?: boolean }) {
  return (
    <li className="flex gap-4 border-b border-line-soft py-4 last:border-b-0">
      <OfferText deal={deal} className="w-28 shrink-0 text-title font-bold text-save tabular-nums sm:w-32" />
      <div className="min-w-0 flex-1">
        <h3 className="text-body font-semibold text-ink">
          {linkBrand ? (
            <Link href={topicPath("brand", deal.brandId)} className="hover:text-primary hover:underline">
              {deal.brand}
            </Link>
          ) : (
            deal.brand
          )}
          <span className="font-normal text-soft">: {deal.title}</span>
        </h3>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-small text-soft">
          <span className="inline-flex items-center gap-1">
            <Icon name="card" className="size-4 text-primary" />
            {deal.cards.length ? deal.cards.map((id) => cardName(id, cards)).join(" or ") : "No card needed"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="pin" className="size-4" />
            {formatCityList(deal.cities)} · {formatChannels(deal.channels)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" className="size-4" />
            {formatEnds(deal.endsInDays, deal.endsAt)}
          </span>
        </p>
        {deal.description && <p className="mt-1 text-small text-muted">{deal.description}</p>}
        <p className="mt-1 text-caption text-muted">
          Checked {formatDate(deal.checkedAt)} ·{" "}
          <a href={deal.sourceUrl} target="_blank" rel="noopener nofollow" className="text-primary hover:underline">
            See the offer at the source
          </a>
        </p>
      </div>
    </li>
  );
}
