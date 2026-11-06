"use client";

import { useLayoutEffect, useRef } from "react";
import { EASE, gsap, reducedMotion, sleepWhenIdle } from "@/lib/motion";
import type { CatalogStats } from "@/lib/types";

type HeroProps = {
  collapsed: boolean;
  /** Live numbers from the data (null while loading), so the claim on the page is always true. */
  stats: CatalogStats | null;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * The welcome: a live-numbers pill, the headline and one line on how to search. Each part rises in turn (GSAP) when
 * the screen opens and again when coming back from results. Starts hidden in CSS (`data-hero`) so nothing flashes.
 */
export function Hero({ collapsed, stats }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: EASE, duration: 0.9 }, onComplete: sleepWhenIdle })
        .to("[data-hero='eyebrow']", { opacity: 1, y: 0 })
        .to("[data-hero='line']", { opacity: 1, y: 0, stagger: 0.12 }, "-=0.7")
        .to("[data-hero='copy']", { opacity: 1, y: 0 }, "-=0.7");
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] motion-layout ${
        collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
      aria-hidden={collapsed}
    >
      <section ref={rootRef} className="overflow-hidden text-center">
        <p data-hero="eyebrow" className="inline-flex items-center gap-2 rounded-full bg-save-soft px-3.5 py-1.5 text-caption font-semibold text-save">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-save opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-save" />
          </span>
          {stats ? `${plural(stats.deals, "live discount")} · ${plural(stats.cards, "bank card")} · ${`${stats.cities} ${stats.cities === 1 ? "city" : "cities"}`}` : "Live discounts across Pakistan"}
        </p>
        <h1 className="mx-auto mt-5 max-w-hero text-display">
          <span data-hero="line" className="block">
            Find the deal.
          </span>
          <em data-hero="line" className="block pb-[0.08em] font-serif font-normal tracking-normal text-primary">
            Skip the full price.
          </em>
        </h1>
        <p data-hero="copy" className="mx-auto mt-5 mb-7 max-w-copy text-body text-soft sm:text-lg [@media(max-height:40rem)]:hidden">
          Discounts from stores across Pakistan. Type what you want, in English, Roman Urdu or اردو.
        </p>
      </section>
    </div>
  );
}
