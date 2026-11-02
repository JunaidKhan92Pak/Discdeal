"use client";

import { useEffect, useState } from "react";
import { PAGE_SIZE, toSearchParams } from "@/lib/query";
import type { DealQuery, Deal, DealsPage } from "@/lib/types";

/** loading = nothing to show yet · refreshing = old results shown while new ones load · done · error */
export type DealsStatus = "loading" | "refreshing" | "done" | "error";

type Filters = Omit<DealQuery, "offset" | "limit">;

/* Pages already fetched in this tab, by URL (most recent last). Going back to an earlier search is instant. */
const cache = new Map<string, DealsPage>();
const CACHE_LIMIT = 60;
/* Requests on their way: asking for the same page again joins the same request instead of sending another. */
const inflight = new Map<string, Promise<DealsPage>>();

/**
 * Typing waits this long after the last key before asking the server, so a whole word is one request instead of
 * one per letter. Long enough for slow typists, short enough to feel live. Enter skips the wait.
 */
const TYPING_DELAY_MS = 500;

function fetchPage(url: string): Promise<DealsPage> {
  const hit = cache.get(url);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(url);
  if (pending) return pending;
  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) throw new Error(`GET ${url} → ${response.status}`);
      const page = (await response.json()) as DealsPage;
      cache.set(url, page);
      if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
      return page;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, request);
  return request;
}

function urlFor(filters: Filters, offset: number): string {
  return `/api/deals?${toSearchParams({ ...filters, offset, limit: PAGE_SIZE })}`;
}

/** `value`, but only after it stopped changing for `delay` ms. A new `now` value skips the wait. */
function useDebounced<T>(value: T, delay: number, now?: unknown): T {
  const [debounced, setDebounced] = useState(value);
  const [lastNow, setLastNow] = useState(now);
  if (now !== lastNow) {
    setLastNow(now);
    setDebounced(value);
  }
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type Loaded = { key: string; items: Deal[]; page: DealsPage | null; error: boolean; loadingMore: boolean; moreFailed: boolean };

/**
 * Deals for the current filters from /api/deals. Typing is debounced, one-letter searches are not sent, identical
 * requests are shared, answers are kept for the tab, and an outdated answer is ignored (but still cached for later).
 * The previous results stay on screen (dimmed) until the new ones arrive, so the list never flashes empty.
 */
export function useDeals(input: Filters, searchNow?: number) {
  // Spaces are tidied first, so "pizza " and "pizza  lahore" do not count as new searches.
  const typed = useDebounced(input.q.trim().replace(/\s+/g, " "), TYPING_DELAY_MS, searchNow);
  const filters: Filters = { ...input, q: typed.length < 2 ? "" : typed };
  const key = urlFor(filters, 0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);

  const hit = cache.get(key);
  const current: Loaded | null =
    loaded?.key === key ? loaded : hit ? { key, items: hit.results, page: hit, error: false, loadingMore: false, moreFailed: false } : null;

  useEffect(() => {
    if (cache.has(key)) return;
    // Not aborted when outdated: the answer still lands in the cache, so going back to that search is instant.
    let outdated = false;
    fetchPage(key)
      .then((page) => {
        if (!outdated) setLoaded({ key, items: page.results, page, error: false, loadingMore: false, moreFailed: false });
      })
      .catch(() => {
        if (!outdated) setLoaded({ key, items: [], page: null, error: true, loadingMore: false, moreFailed: false });
      });
    return () => {
      outdated = true;
    };
  }, [key, attempt]);

  const shown = current ?? (loaded && !loaded.error ? loaded : null);
  const status: DealsStatus = current?.error ? "error" : current ? "done" : shown ? "refreshing" : "loading";

  function loadMore() {
    const base = current;
    const offset = base?.page?.nextOffset;
    if (!base || offset == null || base.loadingMore) return;
    setLoaded({ ...base, loadingMore: true, moreFailed: false });
    fetchPage(urlFor(filters, offset))
      .then((page) =>
        setLoaded((prev) => {
          if (prev?.key !== key) return prev;
          const seen = new Set(prev.items.map((d) => d.id));
          return { ...prev, items: [...prev.items, ...page.results.filter((d) => !seen.has(d.id))], page, loadingMore: false };
        }),
      )
      .catch(() => setLoaded((prev) => (prev?.key === key ? { ...prev, loadingMore: false, moreFailed: true } : prev)));
  }

  function retry() {
    setLoaded(null);
    setAttempt((n) => n + 1);
  }

  return {
    items: shown?.items ?? [],
    page: shown?.page ?? null,
    status,
    loadingMore: current?.loadingMore ?? false,
    moreFailed: current?.moreFailed ?? false,
    loadMore,
    retry,
  };
}
