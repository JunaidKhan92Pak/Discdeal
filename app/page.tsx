"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { QuickSearches } from "@/components/home/QuickSearches";
import { SearchBar } from "@/components/home/SearchBar";
import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { useSavedCity } from "@/hooks/useSavedCity";

export default function Home() {
  const [query, setQuery] = useState("");
  const { city, setCity } = useSavedCity();
  const [focused, setFocused] = useState(false);
  // Nothing but the search screen is shown until the user searches.
  const [browsing, setBrowsing] = useState(false);

  /**
   * Switches between the search screen and the results; a short cross-fade covers the layout change.
   * The cross-fade waits for the browser to paint, which a throttled or background tab may never do, so after
   * 300 ms the switch happens anyway: the fade is decoration, showing results is not.
   */
  function changeBrowsing(next: boolean) {
    if (next === browsing) return;
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBrowsing(next);
      return;
    }
    let applied = false;
    const apply = () => {
      if (applied) return;
      applied = true;
      flushSync(() => setBrowsing(next));
    };
    const transition = document.startViewTransition(apply);
    // Skipping rejects `ready`; that is expected here, not an error.
    transition.ready.catch(() => {});
    setTimeout(() => {
      if (applied) return;
      transition.skipTransition();
      apply();
    }, 300);
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
    <main className="page">
      <Header city={city} onCityChange={setCity} onHome={goHome} browsing={browsing}>
        {/* Search stage: fills the screen and centres its content while idle; just the search bar once browsing */}
        <div className="flex h-full flex-col">
          <div className={`min-h-2 transition-[flex-grow] motion-layout ${browsing ? "hidden" : active ? "grow-[.001]" : "grow"}`} />

          {!browsing && <Hero collapsed={active} />}

          <div className={browsing ? "pt-3 lg:pt-0" : `transition-[padding] motion-layout ${active ? "pt-4" : "pt-0"}`}>
            <SearchBar
              value={query}
              compact={browsing}
              onChange={handleChange}
              onFocus={() => setFocused(true)}
              onBlur={handleBlur}
              onSubmit={() => changeBrowsing(true)}
            />
            {!browsing && <QuickSearches onPick={pickExample} />}
          </div>

          {!browsing && <div className="min-h-2 grow" />}
        </div>
      </Header>

      {browsing && <DealsBrowser query={query} city={city} onQueryChange={setQuery} />}

      {/* On phones the footer gives its height to the results while browsing. */}
      <footer className={`shrink-0 justify-center pt-3 text-caption text-muted [@media(max-height:34rem)]:hidden ${browsing ? "hidden sm:flex" : "flex"}`}>
        Prices and offers may change. Please check with the store.
      </footer>
    </main>
  );
}
