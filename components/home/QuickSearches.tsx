"use client";

import { useLayoutEffect, useRef } from "react";
import { EASE_BACK, popIn } from "@/lib/animate";

/**
 * One-tap example searches under the search bar; they also show people what smart search understands.
 * They are worked out from the live data on the server (lib/server/catalog.ts), so every example finds deals.
 * They pop in one after another (anime.js) once they arrive.
 */
export function QuickSearches({ examples, onPick }: { examples: string[]; onPick: (query: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const shown = examples.length > 0;

  useLayoutEffect(() => {
    if (!shown || !rowRef.current) return;
    return popIn(rowRef.current.children, { y: 10, scale: 0.94, start: 450, step: 50, ease: EASE_BACK });
  }, [shown]);

  if (!shown) return null;
  return (
    // Phones: one row you swipe sideways (edge to edge, fading out on the right to show there is more), instead of
    // three wrapped rows that push everything else down. Larger screens: centred and wrapping, as before.
    <div
      ref={rowRef}
      className="mx-auto mt-5 flex max-w-search items-center gap-2 [@media(max-height:40rem)]:hidden max-sm:-mx-gutter max-sm:overflow-x-auto max-sm:px-gutter max-sm:py-0.5 max-sm:[mask-image:linear-gradient(to_right,black_85%,transparent)] max-sm:[scrollbar-width:none] sm:flex-wrap sm:justify-center"
    >
      <span className="shrink-0 px-1 text-small text-muted">Try:</span>
      {examples.map((example) => (
        <button key={example} type="button" className="chip" dir="auto" onClick={() => onPick(example)}>
          {example}
        </button>
      ))}
    </div>
  );
}
