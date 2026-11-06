"use client";

import { useLayoutEffect, useRef } from "react";
import { popIn } from "@/lib/motion";

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
    return popIn(rowRef.current.children, { y: 10, scale: 0.94, start: 450, step: 50, ease: "outBack(1.4)" });
  }, [shown]);

  if (!shown) return null;
  return (
    <div ref={rowRef} className="mx-auto mt-5 flex max-w-search flex-wrap items-center justify-center gap-2 [@media(max-height:40rem)]:hidden">
      <span className="px-1 text-small text-muted">Try:</span>
      {examples.map((example) => (
        <button key={example} type="button" className="chip" dir="auto" onClick={() => onPick(example)}>
          {example}
        </button>
      ))}
    </div>
  );
}
