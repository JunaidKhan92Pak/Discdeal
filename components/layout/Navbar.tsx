import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar({ onHome }: { onHome: () => void }) {
  return (
    <nav className="flex items-center justify-between" aria-label="Main navigation">
      <Link
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
        className="flex items-center gap-2 text-title font-bold" aria-label="DiscDeal home">
        <span className="grid size-7 place-items-center rounded-full bg-brand pb-0.5 text-accent ring-1 ring-line">d</span>
        discdeal
      </Link>
      <div className="flex items-center gap-4">
        <span className="eyebrow hidden sm:block">new deals every day</span>
        <ThemeToggle />
      </div>
    </nav>
  );
}
