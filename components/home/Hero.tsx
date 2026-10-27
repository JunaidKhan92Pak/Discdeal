type HeroProps = { collapsed: boolean };

export function Hero({ collapsed }: HeroProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] motion-layout ${
        collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
      aria-hidden={collapsed}
    >
      <section className="overflow-hidden text-center">
        <p className="eyebrow inline-flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent-dot" />
          thousands of discounts, one search
        </p>
        <h1 className="mx-auto mt-4 max-w-hero text-display">
          Find the deal.
          <br />
          <em className="font-serif font-normal tracking-normal text-olive">Skip the full price.</em>
        </h1>
        <p className="mx-auto mt-4 mb-6 max-w-copy text-body text-soft [@media(max-height:40rem)]:hidden">
          Search coupons, sales and exclusive offers from your favourite stores — all in one place.
        </p>
      </section>
    </div>
  );
}
