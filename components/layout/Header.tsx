import type { ReactNode } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/Select";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CITIES } from "@/lib/taxonomy";
import type { CityId } from "@/lib/types";

const CITY_OPTIONS: { value: CityId | "all"; label: string }[] = [{ value: "all", label: "All Pakistan" }, ...CITIES.map((c) => ({ value: c.id, label: c.label }))];

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
 * moves up into the logo row (one band instead of two); on phones it stays on its own row under the logo.
 * The search input is never re-mounted, so typing and focus are not interrupted when it moves.
 */
export function Header({ city, onCityChange, onHome, browsing, children }: HeaderProps) {
  return (
    <header
      className={`mx-auto grid w-full max-w-browse grid-cols-[1fr_auto] items-center gap-x-4 ${
        // Same first column as the sidebar below, so the search bar starts exactly where the results start.
        browsing ? "shrink-0 lg:grid-cols-[16rem_minmax(0,1fr)_auto] lg:gap-x-8" : "min-h-0 grow grid-rows-[auto_1fr]"
      }`}
    >
      <Link
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
        className="col-start-1 row-start-1 flex items-center gap-2 justify-self-start text-title font-bold"
        aria-label="DiscDeal home"
      >
        <span className="grid size-8 place-items-center rounded-button bg-primary pb-0.5 font-bold text-on-primary">d</span>
        <span className="hidden min-[360px]:inline">discdeal</span>
      </Link>

      <div className={`col-start-2 row-start-1 flex items-center gap-2 sm:gap-4 ${browsing ? "lg:col-start-3" : ""}`}>
        {!browsing && <span className="hidden text-small text-muted md:block">New deals every day</span>}
        <Select label="Your city" icon="pin" value={city ?? "all"} options={CITY_OPTIONS} onChange={(value) => onCityChange(value === "all" ? null : value)} />
        <ThemeToggle />
      </div>

      <div className={`col-span-2 row-start-2 min-h-0 ${browsing ? "lg:col-span-1 lg:col-start-2 lg:row-start-1" : "h-full"}`}>{children}</div>
    </header>
  );
}
