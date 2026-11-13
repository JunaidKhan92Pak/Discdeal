import type { ReactNode } from "react";
import Link from "next/link";
import { AccountButton } from "@/components/auth/AccountButton";
import { InstallButton } from "@/components/home/InstallButton";
import { Select } from "@/components/ui/Select";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CITIES } from "@/lib/taxonomy";
import type { CityId } from "@/lib/types";

const CITY_OPTIONS: { value: CityId | "all"; label: string }[] = [{ value: "all", label: "All Pakistan" }, ...CITIES.map((c) => ({ value: c.id, label: c.label }))];
const cityLabel = (id: CityId) => CITIES.find((c) => c.id === id)?.label ?? id;

type HeaderProps = {
  city: CityId | null;
  onCityChange: (city: CityId | null) => void;
  onHome: () => void;
  browsing: boolean;
  /** The search stage (hero + search bar). */
  children: ReactNode;
};

/**
 * Logo, search and city in one grid, the same width as the results below so their edges line up.
 * Before a search the search stage fills the screen under the logo row. Once browsing, on desktop the search bar
 * moves up into the logo row (one band instead of two); on phones it stays on its own row under the logo, and while
 * scrolling the logo row slides away and the search stays pinned to the top (app-bar).
 * The search input is never re-mounted, so typing and focus are not interrupted when it moves.
 */
export function Header({ city, onCityChange, onHome, browsing, children }: HeaderProps) {
  return (
    // One grid for logo, search and tools (so they line up), but only the logo and tools are the page's banner
    // (<header>, display: contents). The search stage is the main content until results show.
    <div
      className={`grid grid-cols-[1fr_auto] items-center gap-x-4 ${
        browsing
          ? // Phones: a sticky search bar (app-bar). Desktop: same first column as the sidebar, so the search starts where the results do.
            "app-bar shrink-0 lg:mx-auto lg:w-full lg:max-w-browse lg:grid-cols-[16rem_minmax(0,1fr)_auto] lg:gap-x-8"
          : "mx-auto min-h-0 w-full max-w-browse grow grid-rows-[auto_1fr]"
      }`}
    >
      <header className="contents">
      <Link
        href="/"
        onClick={(e) => {
          // Ctrl/Cmd/Shift/middle click: let the browser open home in a new tab or window.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          onHome();
        }}
        className="col-start-1 row-start-1 flex items-center gap-2.5 justify-self-start rounded-full text-title font-bold focus-ring"
        aria-label="DiscDeal home"
      >
        <span className="grid size-9 place-items-center rounded-full bg-primary pb-0.5 font-bold text-on-primary">d</span>
        {/* The word needs room: on narrow phones the city, account and theme buttons come first. */}
        <span className="hidden text-ink min-[420px]:inline" translate="no">
          disc<span className="text-primary">deal</span>
        </span>
      </Link>

      <div className={`col-start-2 row-start-1 flex items-center gap-2 sm:gap-3 ${browsing ? "lg:col-start-3" : ""}`}>
        {/* The start screen offers the app (hidden once installed); while browsing, the header is for searching. */}
        {!browsing && <InstallButton />}
        {/* "All Pakistan" is the starting point, so it rests as a pin; a chosen city is always spelled out. */}
        <Select
          label="Your city"
          icon="pin"
          variant={city === null ? "icon" : "label"}
          hint={{ label: "Your city", detail: city ? `Showing deals in ${cityLabel(city)}` : "Showing deals from all of Pakistan" }}
          value={city ?? "all"}
          options={CITY_OPTIONS}
          onChange={(value) => onCityChange(value === "all" ? null : value)}
        />
        <AccountButton />
        <ThemeToggle />
      </div>
      </header>

      {/* Always the same element (the search input inside must never re-mount); only its landmark role changes. */}
      <div
        id={browsing ? undefined : "main"}
        role={browsing ? undefined : "main"}
        tabIndex={browsing ? undefined : -1}
        className={`col-span-2 row-start-2 min-h-0 outline-none ${browsing ? "lg:col-span-1 lg:col-start-2 lg:row-start-1" : "h-full"}`}
      >
        {children}
      </div>
    </div>
  );
}
