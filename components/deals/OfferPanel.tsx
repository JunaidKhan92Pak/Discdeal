import type { ReactNode } from "react";
import { DealImage } from "@/components/deals/DealImage";
import { Icon } from "@/components/ui/Icon";
import { formatOffer, splitOffer } from "@/lib/format";
import { CATEGORIES } from "@/lib/taxonomy";
import type { Deal } from "@/lib/types";

type OfferPanelProps = {
  deal: Pick<Deal, "offer" | "discountPct" | "category" | "subcategory" | "icon" | "image">;
  /** "card" in the grid, "lg" at the top of the details dialog. */
  size?: "card" | "lg";
  /** Top-right button over the panel: the close button in the dialog, or an empty spacer on cards. */
  action?: ReactNode;
  /** False to leave the picture out (Data Saver): the green panel is shown instead. */
  showImage?: boolean;
};

/**
 * The deal's big tag, the first thing the eye lands on. Always the same shape (16:10 on cards), so a row of cards
 * lines up whether or not they have pictures, and nothing jumps while a picture loads.
 *   No picture: the number large in the middle of the money-green panel ("UP TO 50% OFF").
 *   Picture:    the photo fills the panel and the offer sits on a solid label in its corner, still easy to read.
 * Top-left, what the deal is on ("Pizza, burgers & fast food"). Type scales with the panel's width (container units).
 */
export function OfferPanel({ deal, size = "card", action, showImage = true }: OfferPanelProps) {
  const kind = dealKind(deal);
  const lg = size === "lg";
  const image = showImage ? deal.image : undefined;

  return (
    <div
      className={`offer-panel @container flex flex-col ${
        // Cards on phones: a 7.5rem column on the left, as tall as the card (DealCard lays the card out sideways).
        lg ? "aspect-2/1 p-4 sm:p-5" : "w-30 shrink-0 p-2 sm:w-auto sm:shrink sm:p-2.5 sm:aspect-16/10"
      }`}
    >
      {image ? (
        <DealImage src={image} quality={lg ? 75 : 55} sizes={lg ? "(max-width: 640px) 100vw, 32rem" : "(max-width: 640px) 7.5rem, 18rem"} />
      ) : (
        <Icon name={deal.icon} className="offer-watermark" strokeWidth={1.5} />
      )}

      <div className="flex items-start justify-between gap-2">
        {kind && (
          <span className="offer-tag">
            <Icon name={deal.icon} className="size-3.5" strokeWidth={2} />
            {/* On a narrow phone panel only the icon; the words are in the card's text instead. */}
            <span className={`truncate ${lg ? "" : "max-sm:hidden"}`}>{kind}</span>
          </span>
        )}
        {action}
      </div>

      {image ? (
        <OfferHeadline
          deal={deal}
          className={`mt-auto self-start rounded-2xl bg-surface/90 px-3 py-2 ${lg ? "text-[clamp(1.75rem,9cqi,2.75rem)]" : "text-[clamp(1.125rem,11cqi,1.75rem)]"}`}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <OfferHeadline deal={deal} className={lg ? "text-[clamp(3rem,18cqi,4.75rem)]" : "text-[clamp(1.875rem,19cqi,3.25rem)] @max-[10rem]:text-[2.125rem]"} />
        </div>
      )}
    </div>
  );
}

/** What the deal is on, in plain words: its subcategory ("Pizza, burgers & fast food"), else its category. */
export function dealKind(deal: Pick<Deal, "category" | "subcategory">): string | undefined {
  const category = CATEGORIES.find((c) => c.id === deal.category);
  return category?.subcategories.find((s) => s.id === deal.subcategory)?.label ?? category?.label;
}

/** "UP TO  50%  OFF": number big, the words beside it half size, the "%" a little smaller so the number leads. */
export function OfferHeadline({ deal, className = "" }: { deal: Pick<Deal, "offer" | "discountPct">; className?: string }) {
  const text = formatOffer(deal);
  const { before, main, after } = splitOffer(text);
  const pct = main.endsWith("%");
  // Wording without a number ("Buy 1 Get 1") is set smaller so it still fits on one or two lines.
  const long = !pct && main.length > 6;

  // In a narrow panel (a phone card) the three parts stack: "UP TO" / "60%" / "OFF".
  return (
    <p className={`offer-headline @max-[10rem]:flex-col @max-[10rem]:gap-y-1 ${className}`}>
      {before && <span className="offer-side text-right @max-[10rem]:max-w-none @max-[10rem]:text-center">{before}</span>}
      <span className={long ? "text-[0.55em] leading-tight" : ""}>
        {pct ? (
          <>
            {main.slice(0, -1)}
            <span className="text-[0.62em]">%</span>
          </>
        ) : (
          main
        )}
      </span>
      {after && <span className="offer-side text-left @max-[10rem]:max-w-none @max-[10rem]:text-center">{after}</span>}
    </p>
  );
}
