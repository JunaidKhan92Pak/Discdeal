"use client";

import { useEffect, useRef, type RefObject } from "react";
import type Lenis from "lenis";
import { createLenis } from "@/lib/motion";

/**
 * Lenis smooth scrolling inside one scrolling box (the results grid, the filter sidebar). The box's first child is
 * what moves, so give the box a single wrapper inside. Only with a mouse or trackpad, and only drawing while it
 * scrolls (see createLenis); phones keep their own native scrolling.
 * Returns the Lenis instance (or null) for jumps like "back to top".
 */
export function useSmoothScroll(ref: RefObject<HTMLElement | null>, enabled = true): RefObject<Lenis | null> {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const wrapper = ref.current;
    const content = wrapper?.firstElementChild;
    if (!enabled || !wrapper || !(content instanceof HTMLElement)) return;
    const lenis = createLenis({ wrapper, content });
    lenisRef.current = lenis;
    return () => {
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, [ref, enabled]);

  return lenisRef;
}
