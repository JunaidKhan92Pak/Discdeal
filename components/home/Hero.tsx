"use client";

import { useLayoutEffect, useRef } from "react";
import { EASE, gsap, reducedMotion, sleepWhenIdle } from "@/lib/motion";

type HeroProps = {
  collapsed: boolean;
};

/**
 * The welcome: a live pill (what DiscDeal finds), the promise as the headline, and one line on what it saves you.
 * Each part rises in turn (GSAP) when the screen opens and again when coming back from results.
 * Starts hidden in CSS (`data-hero`) so nothing flashes.
 */
export function Hero({ collapsed }: HeroProps) {
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
          {/* No numbers: the two kinds of discount the site finds, with a pulse that says "live". */}
          Live store sales &amp; bank card offers
        </p>
        {/* The promise: both kinds of discount (the brands' own sales, the banks' card offers), in one place. */}
        <h1 className="mx-auto mt-5 max-w-hero text-display text-balance">
          <span data-hero="line" className="block">
            Every sale, every card.
          </span>
          <em data-hero="line" className="block pb-[0.08em] font-serif font-normal tracking-normal text-primary">
            All in one place.
          </em>
        </h1>
        {/* What that saves you: no going site to site, and knowing what your own cards get you. */}
        <p data-hero="copy" className="mx-auto mt-5 mb-7 max-w-[34rem] text-body text-balance text-soft sm:text-lg [@media(max-height:40rem)]:hidden">
          No more checking each store&apos;s website or your bank&apos;s offers page. Search once, and see what the
          cards in your wallet get you.
        </p>
      </section>
    </div>
  );
}
