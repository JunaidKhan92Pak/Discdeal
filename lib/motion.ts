"use client";

import { animate, stagger, type EasingParam } from "animejs";
import { gsap } from "gsap";
import Lenis, { type LenisOptions } from "lenis";
import { smoothScrollAllowed } from "@/lib/network";

/**
 * Shared motion setup. GSAP drives the big entrances (hero, page reveals), anime.js the small reactions
 * (card stagger, heart pop, chips), Lenis the smooth scrolling. Everything checks `reducedMotion()` first:
 * people who ask their device for less motion get none. Nothing here draws frames while nothing moves:
 * GSAP is put to sleep after its animations (sleepWhenIdle), Lenis only runs while scrolling (createLenis), and
 * ScrollTrigger (which runs a timer) is loaded only on the pages that use it (components/motion/PageMotion).
 */
export { gsap };

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

export function reducedMotion(): boolean {
  return typeof window === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** One curve for everything scripted, the same as the CSS `ease-smooth` (300 ms transitions). */
export const EASE = "power3.out";

/**
 * Lenis smooth scrolling that only runs while it is actually scrolling. Lenis normally draws every frame forever
 * (60–120 times a second, even on a page nobody touches); this wakes it on wheel input or a scrollTo and lets it
 * sleep again once the scroll has settled, so an idle page costs no battery. Returns null where smooth scrolling
 * is not wanted (touch screens, reduced motion, Data Saver): the browser's own scrolling is used there.
 */
export function createLenis(options: LenisOptions = {}): Lenis | null {
  if (!smoothScrollAllowed()) return null;
  const lenis = new Lenis({ lerp: 0.12, ...options, autoRaf: false });
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

function clearStyles(elements: HTMLElement[]) {
  for (const el of elements) {
    el.style.removeProperty("opacity");
    el.style.removeProperty("transform");
  }
}

type PopInOptions = { y?: number; scale?: number; duration?: number; step?: number; start?: number; ease?: EasingParam; onDone?: () => void };

/**
 * anime.js: elements fade and rise in one after another. They are hidden first (so nothing flashes during the delay)
 * and left with no inline styles afterwards. Returns a cancel function for effect cleanups.
 */
export function popIn(targets: Iterable<Element>, { y = 14, scale = 1, duration = 600, step = 45, start = 0, ease = "outCubic", onDone }: PopInOptions = {}) {
  const elements = [...targets].filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (elements.length === 0 || reducedMotion()) return () => {};
  for (const el of elements) el.style.opacity = "0";
  const anim = animate(elements, {
    opacity: [0, 1],
    translateY: [y, 0],
    ...(scale !== 1 ? { scale: [scale, 1] } : {}),
    duration,
    delay: stagger(step, { start }),
    ease,
    onComplete: () => {
      clearStyles(elements);
      onDone?.();
    },
  });
  return () => {
    anim.pause();
    clearStyles(elements);
  };
}

/** anime.js: a quick springy "boing" on an icon, for a like or a copy. */
export function boing(target: Element | null) {
  if (!target || reducedMotion()) return;
  animate(target, {
    scale: [
      { to: 1.35, duration: 160, ease: "outQuad" },
      { to: 1, duration: 420, ease: "outElastic(1, .45)" },
    ],
  });
}
