import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icon";

/**
 * Frame for the readable pages (/deals…, /about): logo, a big "Search deals" button back to the app, the content,
 * and a footer of links. Plain server-rendered HTML, so search engines and AI assistants read all of it.
 */
export function SiteShell({ children, breadcrumbs = [] }: { children: ReactNode; breadcrumbs?: { name: string; path: string }[] }) {
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter py-4">
        <Link href="/" className="flex items-center gap-2 text-title font-bold" aria-label="DiscDeal home">
          <span className="grid size-8 place-items-center rounded-button bg-primary pb-0.5 font-bold text-on-primary">d</span>
          <span className="hidden min-[360px]:inline">discdeal</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn-primary h-10 px-4 whitespace-nowrap" aria-label="Search deals">
            <Icon name="search" className="size-5" />
            Search
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-content px-gutter pb-16">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 text-small text-muted">
            <ol className="flex flex-wrap items-center gap-1">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.path} className="flex items-center gap-1">
                  {i > 0 && <Icon name="chevron-right" className="size-4" />}
                  {i < breadcrumbs.length - 1 ? (
                    <Link href={crumb.path} className="hover:text-primary hover:underline">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-soft">
                      {crumb.name}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {children}
      </main>

      <footer className="border-t border-line-soft">
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-3 px-gutter py-6 text-small text-muted">
          <p>Prices and offers may change. Please check with the store.</p>
          <nav aria-label="Site" className="flex gap-4">
            <Link href="/deals" className="hover:text-primary hover:underline">
              All deals
            </Link>
            <Link href="/about" className="hover:text-primary hover:underline">
              About &amp; FAQ
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Small section heading used on these pages. */
export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-10 mb-3 text-title text-ink">
      {children}
    </h2>
  );
}
