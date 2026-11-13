/**
 * Small UI reactions (card stagger, heart pop, chips) with the browser's own Web Animations API: no library to
 * download. Nothing here leaves inline styles behind, and people who ask their device for less motion get none.
 * The big entrances use GSAP (lib/motion.ts); smooth scrolling uses Lenis (lib/smooth-scroll.ts).
 */

export function reducedMotion(): boolean {
  return typeof window === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** CSS versions of the curves used for reactions. */
export const EASE_OUT = "cubic-bezier(0.33, 1, 0.68, 1)"; // out-cubic
export const EASE_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // out-back: a little past the end, then settles

type PopInOptions = { y?: number; scale?: number; duration?: number; step?: number; start?: number; ease?: string; onDone?: () => void };

/**
 * Elements fade and rise in one after another. Each is held hidden while it waits its turn (fill: backwards), so
 * nothing flashes. Returns a cancel function for effect cleanups.
 */
export function popIn(targets: Iterable<Element>, { y = 14, scale = 1, duration = 600, step = 45, start = 0, ease = EASE_OUT, onDone }: PopInOptions = {}) {
  const elements = [...targets].filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (elements.length === 0 || reducedMotion()) return () => {};
  const from = `translateY(${y}px)${scale !== 1 ? ` scale(${scale})` : ""}`;
  const to = `translateY(0)${scale !== 1 ? " scale(1)" : ""}`;
  const animations = elements.map((el, i) =>
    el.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: to }], { duration, delay: start + i * step, easing: ease, fill: "backwards" }),
  );
  Promise.all(animations.map((a) => a.finished)).then(
    () => onDone?.(),
    () => {}, // cancelled
  );
  return () => {
    for (const a of animations) a.cancel();
  };
}

/** A quick springy "boing" on an icon, for a like or a copy: up to 135%, then a few shrinking wobbles back. */
export function boing(target: Element | null) {
  if (!target || reducedMotion()) return;
  target.animate(
    [
      { transform: "scale(1)", easing: "cubic-bezier(0.5, 1, 0.89, 1)" },
      { transform: "scale(1.35)", offset: 0.28 },
      { transform: "scale(0.9)", offset: 0.48 },
      { transform: "scale(1.06)", offset: 0.66 },
      { transform: "scale(0.98)", offset: 0.83 },
      { transform: "scale(1)" },
    ],
    { duration: 580 },
  );
}
