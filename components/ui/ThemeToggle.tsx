"use client";

import { Icon } from "@/components/ui/Icon";

const STORAGE_KEY = "theme";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {}
    setTimeout(() => root.classList.remove("theme-fade"), 350);
  }

  // Both icons are always rendered; CSS (the `dark` class) decides which one shows,
  // so there is no state, no hydration mismatch and no icon flicker on load.
  return (
    <button type="button" onClick={toggle} aria-label="Toggle light / dark mode" className="icon-btn size-9 border border-line bg-surface text-ink hover:scale-105">
      <Icon name="sun" className="hidden size-4 dark:block" />
      <Icon name="moon" className="size-4 dark:hidden" />
    </button>
  );
}
