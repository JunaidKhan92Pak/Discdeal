import { DealCard } from "@/components/deals/DealCard";
import { ScrollRow } from "@/components/ui/ScrollRow";
import type { SearchStatus } from "@/hooks/useDealSearch";
import type { Deal } from "@/lib/types";

type ResultsListProps = {
  results: Deal[];
  status: SearchStatus;
  emptyMessage: string;
  likedIds: number[];
  onToggleLike: (id: number) => void;
  onOpen: (deal: Deal) => void;
};

const SLOT = "w-64 shrink-0 snap-start sm:w-72";

/** All matching deals in ONE horizontal row, so the page never needs vertical scrolling. */
export function ResultsList({ results, status, emptyMessage, likedIds, onToggleLike, onOpen }: ResultsListProps) {
  const note = "grid h-full place-items-center rounded-card border border-dashed border-line px-4 text-center text-small text-muted";

  if (status === "error") return <p className={note}>Something went wrong. Please try again.</p>;

  // First load only: placeholders. Later loads keep the old cards visible and dimmed.
  if (status === "loading" && results.length === 0) {
    return (
      <div className="scroller h-full" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${SLOT} skeleton`} />
        ))}
      </div>
    );
  }

  if (results.length === 0) return <p className={note}>{emptyMessage}</p>;

  return (
    <div className={`h-full transition-opacity duration-300 ${status === "loading" ? "opacity-60" : "opacity-100"}`} aria-live="polite">
      <ScrollRow label="Deals">
        {results.map((deal, i) => (
          <div key={deal.id} className={SLOT}>
            <DealCard deal={deal} index={i} liked={likedIds.includes(deal.id)} onToggleLike={onToggleLike} onOpen={onOpen} />
          </div>
        ))}
      </ScrollRow>
    </div>
  );
}
