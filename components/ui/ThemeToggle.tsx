"use client";

import { Icon } from "@/components/ui/Icon";

const STORAGE_KEY = "theme";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    const apply = () => root.classList.toggle("dark", next);

    // A view transition cross-fades one snapshot of the page, so it costs the same with 5 deals or 500
    // (no per-element transitions) and the card gradients, which can't transition, fade like everything else.
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
    else apply();

    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {}
  }

  // Both icons are always rendered; CSS (the `dark` class) decides which one shows,
  // so there is no state, no hydration mismatch and no icon flicker on load.
  return (
    <button type="button" onClick={toggle} aria-label="Toggle light / dark mode" className="icon-btn border border-line bg-surface text-ink">
      <Icon name="sun" className="hidden size-5 dark:block" />
      <Icon name="moon" className="size-5 dark:hidden" />
    </button>
  );
}
