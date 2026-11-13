"use client";

import { gsap } from "gsap";

/**
 * GSAP for the big entrances (hero, page reveals). Small reactions (card stagger, heart pop, chips) use the
 * browser's own animations (lib/animate.ts), smooth scrolling uses Lenis (lib/smooth-scroll.ts), so pages that
 * only need one of them do not download the others. Everything checks `reducedMotion()` first: people who ask their
 * device for less motion get none. GSAP is put to sleep after its animations (sleepWhenIdle), and ScrollTrigger
 * (which runs a timer) is loaded only on the pages that use it (components/motion/PageMotion).
 */
export { gsap };
export { reducedMotion } from "@/lib/animate";

/**
 * GSAP's clock keeps ticking every frame once anything has animated, even with nothing left to move. Call this
 * when an animation finishes: if nothing else is playing, the clock stops. Any new GSAP animation restarts it.
 */
export function sleepWhenIdle() {
  // "Busy" includes animations still waiting out their delay (isActive() is false for those), so a delayed entrance
  // is never frozen half-way. Finished animations have progress 1; paused ones do not need the clock.
  const busy = gsap.globalTimeline.getChildren(true, true, true).some((child) => !child.paused() && child.progress() < 1);
  if (!busy) gsap.ticker.sleep();
}

/** One curve for everything scripted, the same as the CSS `ease-smooth` (300 ms transitions). */
export const EASE = "power3.out";
