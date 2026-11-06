import Link from "next/link";
import { OfferText } from "@/components/deals/OfferText";
import { Icon } from "@/components/ui/Icon";
import { topicPath } from "@/lib/deal-pages";
import { cardName, formatChannels, formatCityList, formatDate, formatEnds, isEndingSoon } from "@/lib/format";
import type { Card, Deal } from "@/lib/types";

/** One deal as readable text: offer, what you get, brand, card, where, until when, and the source to check it. */
export function DealRow({ deal, cards, linkBrand = true }: { deal: Deal; cards: Card[]; linkBrand?: boolean }) {
  const urgent = isEndingSoon(deal.endsInDays);
  return (
    <li className="flex flex-col gap-3 rounded-card bg-surface p-5 sm:flex-row sm:gap-6 sm:p-6" data-reveal>
      <div className="shrink-0 sm:w-40">
        <OfferText deal={deal} className="inline-block rounded-panel bg-save-soft px-4 py-2.5 text-title leading-tight font-extrabold text-balance text-save tabular-nums" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-body leading-snug font-semibold text-ink sm:text-lg">
          {linkBrand ? (
            <Link href={topicPath("brand", deal.brandId)} className="quiet-link">
              {deal.brand}
            </Link>
          ) : (
            deal.brand
          )}
          <span className="font-normal text-soft">: {deal.title}</span>
        </h3>
        <ul className="mt-3 flex flex-wrap gap-2 text-caption font-medium text-soft">
          <li className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-primary">
            <Icon name="card" className="size-4" />
            {deal.cards.length ? deal.cards.map((id) => cardName(id, cards)).join(" or ") : "No card needed"}
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5">
            <Icon name="pin" className="size-4" />
            {formatCityList(deal.cities)} · {formatChannels(deal.channels)}
          </li>
          <li className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${urgent ? "bg-urgent-soft font-semibold text-urgent" : "bg-fill"}`}>
            <Icon name="clock" className="size-4" />
            {formatEnds(deal.endsInDays, deal.endsAt)}
          </li>
        </ul>
        {deal.description && <p className="mt-3 text-small text-soft">{deal.description}</p>}
        <p className="mt-3 text-caption text-muted">
          Checked {formatDate(deal.checkedAt)} ·{" "}
          <a href={deal.sourceUrl} target="_blank" rel="noopener nofollow" className="link">
            See the offer at the source
          </a>
        </p>
      </div>
    </li>
  );
}
