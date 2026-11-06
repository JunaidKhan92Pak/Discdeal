import type { ReactNode } from "react";
import Link from "next/link";
import { PageMotion } from "@/components/motion/PageMotion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icon";

/**
 * Frame for the readable pages (/deals…, /about): a frosted header that stays on top while you scroll (logo, a big
 * "Search deals" button back to the app), the content, and a footer of links. Plain server-rendered HTML, so search
 * engines and AI assistants read all of it; smooth scrolling and reveals are added on top (PageMotion).
 */
export function SiteShell({ children, breadcrumbs = [] }: { children: ReactNode; breadcrumbs?: { name: string; path: string }[] }) {
  return (
    <div className="min-h-svh">
      <PageMotion />
      <header className="glass sticky top-0 z-40">
        <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter py-3">
          <Link href="/" className="flex items-center gap-2.5 rounded-full text-title font-bold focus-ring" aria-label="DiscDeal home">
            <span className="grid size-9 place-items-center rounded-full bg-primary pb-0.5 font-bold text-on-primary">d</span>
            <span className="hidden min-[360px]:inline">discdeal</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-primary h-11 px-5 whitespace-nowrap" aria-label="Search deals">
              <Icon name="search" className="size-5" />
              Search
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-content px-gutter pt-6 pb-16 sm:pt-10">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 text-small text-muted" data-reveal>
            <ol className="flex flex-wrap items-center gap-1.5">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.path} className="flex items-center gap-1.5">
                  {i > 0 && <Icon name="chevron-right" className="size-4 text-muted/70" />}
                  {i < breadcrumbs.length - 1 ? (
                    <Link href={crumb.path} className="quiet-link">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span aria-current="page" className="rounded-full bg-fill px-3 py-1 font-medium text-soft">
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

      <footer className="mx-auto w-full max-w-content px-gutter pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-fill px-6 py-5 text-small text-soft">
          <p>Prices and offers may change. Please check with the store.</p>
          <nav aria-label="Site" className="flex flex-wrap gap-2">
            <Link href="/deals" className="chip">
              All deals
            </Link>
            <Link href="/about" className="chip">
              About &amp; FAQ
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Section heading used on these pages. */
export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-14 mb-4 scroll-mt-24 text-headline text-ink" data-reveal>
      {children}
    </h2>
  );
}

/** Questions and answers, one tinted card each, so every answer reads on its own. */
export function FaqList({ items, className = "" }: { items: { question: string; answer: string }[]; className?: string }) {
  return (
    <dl className={`grid gap-2.5 ${className}`}>
      {items.map((f) => (
        <div key={f.question} className="rounded-card bg-surface px-5 py-4 sm:px-6 sm:py-5" data-reveal>
          <dt className="text-body font-semibold text-ink sm:text-lg">{f.question}</dt>
          <dd className="mt-1.5 text-body text-soft">{f.answer}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The page's one heading and its intro paragraph. */
export function PageIntro({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-page text-ink" data-reveal>
        {title}
      </h1>
      {children && (
        <p className="mt-4 text-body text-soft sm:text-lg sm:leading-relaxed" data-reveal>
          {children}
        </p>
      )}
    </div>
  );
}
