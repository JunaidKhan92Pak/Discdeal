import { formatOffer } from "@/lib/format";
import type { Deal } from "@/lib/types";

/**
 * The deal's headline ("30% OFF", "Buy 1 Get 1"). A leading "Up to" is set smaller, so the number stays the
 * loudest part and the headline fits on one line in a half-width card.
 */
export function OfferText({ deal, className = "" }: { deal: Pick<Deal, "offer" | "discountPct">; className?: string }) {
  const text = formatOffer(deal);
  const upTo = /^(up to)\s+(.+)$/i.exec(text);

  return (
    <p className={className}>
      {upTo ? (
        <>
          <span className="text-[0.6em] font-semibold">{upTo[1]} </span>
          {upTo[2]}
        </>
      ) : (
        text
      )}
    </p>
  );
}
