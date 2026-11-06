"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, createLenis, gsap, reducedMotion, sleepWhenIdle } from "@/lib/motion";

/**
 * For the readable pages (/deals…, /about): smooth scrolling with Lenis (mouse and trackpad only, and only drawing
 * while it scrolls), and every element marked `data-reveal` fades up as it scrolls into view, a few at a time.
 * ScrollTrigger lives only here (it runs a small timer while active) and is switched off when leaving these pages.
 */
/** ScrollTrigger's state across page visits: registering starts it; after a disable it must be enabled (once) again. */
let scrollTrigger: "off" | "on" | "disabled" = "off";

export function PageMotion() {
  useEffect(() => {
    if (reducedMotion()) return;
    if (scrollTrigger === "off") gsap.registerPlugin(ScrollTrigger);
    else if (scrollTrigger === "disabled") ScrollTrigger.enable();
    scrollTrigger = "on";

    const lenis = createLenis({ anchors: true });
    lenis?.on("scroll", ScrollTrigger.update);

    const triggers = ScrollTrigger.batch("[data-reveal]", {
      // As soon as any part is on screen, so even the last line of a short page is revealed.
      start: "top bottom",
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.06, overwrite: true, onComplete: sleepWhenIdle }),
    });

    return () => {
      triggers.forEach((t) => t.kill());
      lenis?.destroy();
      // Revealed elements keep their final inline styles; only ScrollTrigger's listeners and timer are stopped.
      ScrollTrigger.disable(false);
      scrollTrigger = "disabled";
    };
  }, []);

  return null;
}
