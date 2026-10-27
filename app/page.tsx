"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
import { SearchBar } from "@/components/home/SearchBar";
import { DealsBrowser } from "@/components/deals/DealsBrowser";

export default function Home() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  // Nothing but the search screen is shown until the user presses Search.
  const [browsing, setBrowsing] = useState(false);

  // Switching tabs/windows blurs the input too; only treat it as "left the search" when the page itself still has focus.
  function handleBlur() {
    if (document.hasFocus()) setFocused(false);
  }

  function goHome() {
    setQuery("");
    setBrowsing(false);
  }

  const active = focused || browsing || query.trim().length > 0;

  return (
    <main className="page">
      <Navbar onHome={goHome} />

      {/* Intro stage: fills the screen and centres its content while idle; shrinks to the search bar once browsing */}
      <div className={`flex flex-col transition-[flex-grow] motion-layout ${browsing ? "grow-0" : "grow"}`}>
        <div className={`min-h-2 transition-[flex-grow] motion-layout ${active ? "grow-[.001]" : "grow"}`} />

        <Hero collapsed={active} />

        <div className={`transition-[padding] motion-layout ${active ? "pt-4" : "pt-0"}`}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            onSubmit={() => setBrowsing(true)}
          />
        </div>

        <div className="min-h-2 grow" />
      </div>

      {browsing && <DealsBrowser query={query} />}

      <footer className="eyebrow flex shrink-0 justify-between pt-3 [@media(max-height:34rem)]:hidden">
        <span>01 — deals worth opening</span>
        <span>prices may change</span>
      </footer>
    </main>
  );
}
