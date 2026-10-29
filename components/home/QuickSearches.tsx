/** One-tap example searches under the search bar; they also show people what smart search understands. */
const EXAMPLES = ["Lahore mein kapray", "Pizza under 3000", "کراچی میں کھانا", "Salon Islamabad", "50% off online"];

export function QuickSearches({ onPick }: { onPick: (query: string) => void }) {
  return (
    <div className="mx-auto mt-4 flex max-w-search flex-wrap items-center justify-center gap-2 [@media(max-height:40rem)]:hidden">
      <span className="text-small text-muted">Try:</span>
      {EXAMPLES.map((example) => (
        <button key={example} type="button" className="chip" dir="auto" onClick={() => onPick(example)}>
          {example}
        </button>
      ))}
    </div>
  );
}
