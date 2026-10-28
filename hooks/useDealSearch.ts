"use client";

import { useEffect, useMemo, useState } from "react";
import { queryDeals } from "@/lib/search";
import type { DealQuery } from "@/lib/types";

export type SearchStatus = "loading" | "done" | "error";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Deals for the current search text, categories, brand and (optionally) liked ids.
 * The catalog is small and bundled with the app, so this filters synchronously on the client:
 * a filter click shows the right cards on the same render, never a stale list while a request is in flight.
 */
export function useDealSearch({ q, subs, brand, ids }: DealQuery) {
  const debouncedQ = useDebounced(q.trim(), 250);
  const subsKey = subs.join(",");
  const idsKey = ids ? ids.join(",") : null;

  const data = useMemo(
    () => queryDeals({ q: debouncedQ, subs: subsKey ? subsKey.split(",") : [], brand, ids: idsKey === null ? null : idsKey ? idsKey.split(",").map(Number) : [] }),
    [debouncedQ, subsKey, brand, idsKey],
  );

  const status: SearchStatus = "done";
  return { ...data, status };
}
