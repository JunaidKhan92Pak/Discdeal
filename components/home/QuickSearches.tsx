/**
 * One-tap example searches under the search bar; they also show people what smart search understands.
 * They are worked out from the live data on the server (lib/server/catalog.ts), so every example finds deals.
 */
export function QuickSearches({ examples, onPick }: { examples: string[]; onPick: (query: string) => void }) {
  if (examples.length === 0) return null;
  return (
    <div className="mx-auto mt-4 flex animate-fade max-w-search flex-wrap items-center justify-center gap-2 [@media(max-height:40rem)]:hidden">
      <span className="text-small text-muted">Try:</span>
      {examples.map((example) => (
        <button key={example} type="button" className="chip" dir="auto" onClick={() => onPick(example)}>
          {example}
        </button>
      ))}
    </div>
  );
}
