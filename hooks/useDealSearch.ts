"use client";

import { useEffect, useState } from "react";
import type { DealQuery, DealsResponse } from "@/lib/types";

export type SearchStatus = "loading" | "done" | "error";

const EMPTY: DealsResponse = { results: [], counts: {}, brands: [] };

type Loaded = { key: string; data: DealsResponse; failed: boolean };

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Loads deals for the current search text, categories, brand and (optionally) liked ids. */
export function useDealSearch({ q, subs, brand, ids }: DealQuery) {
  const debouncedQ = useDebounced(q.trim(), 250);
  const params = new URLSearchParams({ q: debouncedQ, subs: subs.join(","), brand });
  if (ids) params.set("ids", [...ids].sort((a, b) => a - b).join(","));
  const key = params.toString();
  const [loaded, setLoaded] = useState<Loaded>({ key: "", data: EMPTY, failed: false });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/deals?${key}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json() as Promise<DealsResponse>;
      })
      .then((data) => setLoaded({ key, data, failed: false }))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setLoaded({ key, data: EMPTY, failed: true });
      });

    return () => controller.abort();
  }, [key]);

  // Loading = the data on screen belongs to an older request than the one we want now.
  const status: SearchStatus = loaded.key !== key ? "loading" : loaded.failed ? "error" : "done";

  return { ...loaded.data, status };
}
