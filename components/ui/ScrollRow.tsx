"use client";

import { Icon } from "@/components/ui/Icon";
import { ReactNode, useCallback, useLayoutEffect, useRef, useState } from "react";

/** Horizontal, swipeable row of items with snap points and arrow buttons for mouse users. */
export function ScrollRow({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Both arrows start hidden; they are measured before the first paint, so an arrow never flashes when everything fits.
  const [edge, setEdge] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useLayoutEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, children]);

  function scrollBy(direction: 1 | -1) {
    const el = ref.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="relative h-full">
      <div ref={ref} onScroll={update} role="group" aria-label={label} className="scroller h-full">
        {children}
      </div>
      <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)} className="scroll-arrow left-1" data-hidden={edge.start}>
        <Icon name="chevron-left" className="size-5" />
      </button>
      <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)} className="scroll-arrow right-1" data-hidden={edge.end}>
        <Icon name="chevron-right" className="size-5" />
      </button>
    </div>
  );
}
