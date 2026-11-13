"use client";

import { addTransitionType, startTransition, useEffect, useState, ViewTransition, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LazyAuthDialog } from "@/components/auth/LazyAuthDialog";
import { Header } from "@/components/layout/Header";
import { Benefits } from "@/components/home/Benefits";
import { Hero } from "@/components/home/Hero";
import { QuickSearches } from "@/components/home/QuickSearches";
import { SearchBar } from "@/components/home/SearchBar";
import { useMeta } from "@/hooks/useMeta";
import { useSavedCity } from "@/hooks/useSavedCity";

/*
 * The results (cards, filters, details dialog) are not part of the start screen, so they are not in its first
 * download. They are fetched as soon as the browser is idle, or the moment the search box is focused, so they are
 * ready long before the first results arrive.
 */
const loadDealsBrowser = () => import("@/components/deals/DealsBrowser").then((mod) => mod.DealsBrowser);
const DealsBrowser = dynamic(loadDealsBrowser, { ssr: false });
const preloadDealsBrowser = () => void loadDealsBrowser();

/** The search bar's glide between the two screens (styles in globals.css). Nothing else moves it with a transition. */
const MOVE_SEARCH = { "to-results": "search-move", "to-home": "search-move", default: "none" };

/**
 * Start-screen extras (headline, example searches, benefits): fade out quickly when results open, so the search bar
 * and the results are what the eye follows. Coming back they are not animated here: they have their own entrances.
 */
function LeavesForResults({ children }: { children: ReactNode }) {
  return (
    <ViewTransition exit={{ "to-results": "start-out", default: "none" }} default="none">
      {children}
    </ViewTransition>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const { city, setCity } = useSavedCity();
  const meta = useMeta();
  const [focused, setFocused] = useState(false);
  // Nothing but the search screen is shown until the user searches.
  const [browsing, setBrowsing] = useState(false);
  // Counts Enter presses: each one searches at once instead of waiting for typing to pause.
  const [searchNow, setSearchNow] = useState(0);

  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(preloadDealsBrowser, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(preloadDealsBrowser, 1500);
    return () => clearTimeout(timer);
  }, []);

  // A shared link like /?q=pizza+lahore opens straight on that search (also how AI assistants and Google's
  // search box link in). Read once after the page loads, so the prerendered page stays the same for everyone.
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("q")?.trim().slice(0, 120);
    if (!shared) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after hydration
    setQuery(shared);
    setBrowsing(true);
  }, []);

  // The address bar follows the search, so it can be copied and shared. replaceState: no new history entry per letter.
  useEffect(() => {
    const q = query.trim();
    const next = browsing && q ? `/?${new URLSearchParams({ q })}` : "/";
    if (window.location.pathname + window.location.search !== next) window.history.replaceState(window.history.state, "", next);
  }, [query, browsing]);

  /**
   * Switches between the search screen and the results as a React view transition: the search bar glides from the
   * middle of the screen up into the header row (and back), the start screen's extras fade out, the results rise in.
   * The type says which way it goes, so each <ViewTransition> below animates only for its own direction.
   * Browsers without view transitions (and people who asked for less motion, see globals.css) just switch.
   */
  function changeBrowsing(next: boolean) {
    if (next === browsing) return;
    startTransition(() => {
      addTransitionType(next ? "to-results" : "to-home");
      setBrowsing(next);
    });
  }

  // Switching tabs/windows blurs the input too; only treat it as "left the search" when the page itself still has focus.
  function handleBlur() {
    if (document.hasFocus()) setFocused(false);
  }

  // Results start appearing as soon as the user types; no need to press Search.
  function handleChange(value: string) {
    setQuery(value);
    if (value.trim().length >= 2) changeBrowsing(true);
  }

  function pickExample(value: string) {
    setQuery(value);
    changeBrowsing(true);
  }

  function goHome() {
    setQuery("");
    changeBrowsing(false);
  }

  const active = focused || browsing || query.trim().length > 0;

  return (
    <div className="page">
      <a href="#main" className="skip-link">
        Skip to {browsing ? "deals" : "search"}
      </a>
      <Header city={city} onCityChange={setCity} onHome={goHome} browsing={browsing}>
        {/* Search stage: fills the screen and centres its content while idle; just the search bar once browsing */}
        <div className="flex h-full flex-col">
          <div className={`min-h-2 transition-[flex-grow] motion-layout ${browsing ? "hidden" : active ? "grow-[.001]" : "grow"}`} />

          {!browsing && (
            <LeavesForResults>
              <Hero collapsed={active} />
            </LeavesForResults>
          )}

          <div className={browsing ? "pt-3 lg:pt-0" : `transition-[padding] motion-layout ${active ? "pt-4" : "pt-0"}`}>
            {/* The same search bar on both screens (never re-mounted): only its place and size change, so it glides. */}
            <ViewTransition name="search-bar" update={MOVE_SEARCH} default="none">
              <SearchBar
                value={query}
                variant={browsing ? "bar" : "hero"}
                examples={meta?.suggestions}
                onChange={handleChange}
                onFocus={() => {
                  preloadDealsBrowser();
                  setFocused(true);
                }}
                onBlur={handleBlur}
                onSubmit={() => {
                  setSearchNow((n) => n + 1);
                  changeBrowsing(true);
                }}
              />
            </ViewTransition>
            {!browsing && (
              <LeavesForResults>
                <QuickSearches examples={meta?.suggestions ?? []} onPick={pickExample} />
              </LeavesForResults>
            )}
          </div>

          {!browsing && (
            <LeavesForResults>
              <Benefits collapsed={active} />
            </LeavesForResults>
          )}

          {!browsing && <div className="min-h-2 grow" />}
        </div>
      </Header>

      {browsing && (
        // Rises in under the search bar; sinks away when going back to the start screen.
        <ViewTransition enter={{ "to-results": "results-in", default: "none" }} exit={{ "to-home": "results-out", default: "none" }} default="none">
          <main id="main" tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
            {/* The start screen's headline is gone once results show; this keeps one page heading for screen readers. */}
            <h1 className="sr-only">{query.trim() ? `Deals for “${query.trim()}”` : "All deals"}</h1>
            <DealsBrowser query={query} city={city} searchNow={searchNow} onQueryChange={setQuery} />
          </main>
        </ViewTransition>
      )}

      {/* On phones the footer gives its height to the results while browsing. */}
      <footer className={`shrink-0 justify-center pt-3 text-caption text-muted [@media(max-height:34rem)]:hidden ${browsing ? "hidden sm:flex" : "flex"}`}>
        Prices and offers may change. Please check with the store.
        <span className="mx-2" aria-hidden="true">·</span>
        <Link href="/deals" className="quiet-link hover:underline">
          All deals
        </Link>
        <span className="mx-2" aria-hidden="true">·</span>
        <Link href="/about" className="quiet-link hover:underline">
          About
        </Link>
      </footer>

      {/* One log-in window for the whole page; anything that needs an account opens it (see useAccount). */}
      <LazyAuthDialog city={city} />
    </div>
  );
}
