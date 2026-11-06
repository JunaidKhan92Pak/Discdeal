"use client";

import { useSyncExternalStore } from "react";

/** True while the CSS media query matches; follows window resizes and rotation. False on the server. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** The desktop layout (sidebar, results scrolling in their own panel): the `lg` breakpoint. */
export const DESKTOP = "(min-width: 64rem)";
