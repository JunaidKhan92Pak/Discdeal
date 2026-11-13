"use client";

import type Lenis from "lenis";
import type { LenisOptions } from "lenis";
import { smoothScrollAllowed } from "@/lib/network";

/**
 * Lenis smooth scrolling that only runs while it is actually scrolling. Lenis normally draws every frame forever
 * (60–120 times a second, even on a page nobody touches); this wakes it on wheel input or a scrollTo and lets it
 * sleep again once the scroll has settled, so an idle page costs no battery. Resolves to null where smooth scrolling
 * is not wanted (touch screens, reduced motion, Data Saver): the browser's own scrolling is used there.
 * Lenis itself is downloaded only here, the first time it is wanted, so phones and the start screen never load it.
 */
export async function createLenis(options: LenisOptions = {}): Promise<Lenis | null> {
  if (!smoothScrollAllowed()) return null;
  const { default: LenisClass } = await import("lenis");
  const lenis = new LenisClass({ lerp: 0.12, ...options, autoRaf: false });
  let frame = 0;

  const loop = (time: number) => {
    lenis.raf(time);
    frame = lenis.isScrolling === "smooth" ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => {
    if (frame) return;
    // Lenis measures each step from its last frame; after a sleep that would be one huge jump, so restart its clock.
    lenis.time = performance.now();
    frame = requestAnimationFrame(loop);
  };

  lenis.on("virtual-scroll", wake);
  const scrollTo = lenis.scrollTo.bind(lenis);
  lenis.scrollTo = ((...args: Parameters<Lenis["scrollTo"]>) => {
    scrollTo(...args);
    wake();
  }) as Lenis["scrollTo"];
  const destroy = lenis.destroy.bind(lenis);
  lenis.destroy = () => {
    cancelAnimationFrame(frame);
    destroy();
  };
  return lenis;
}
