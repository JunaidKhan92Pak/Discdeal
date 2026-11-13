import { Icon, type IconName } from "@/components/ui/Icon";

const BENEFITS: { icon: IconName; lead: string; rest: string }[] = [
  { icon: "store", lead: "Brand sales", rest: "open to everyone" },
  { icon: "card", lead: "Your bank cards", rest: "see what each one gets you" },
  { icon: "search", lead: "One search", rest: "in English, Roman Urdu or اردو" },
];

/**
 * Under the search on the start screen: the three things DiscDeal does for you, one short line each. It finishes the
 * promise in the headline (both kinds of discount, your own cards, no going site to site). Folds away with the
 * headline once the search is in use, and is left out on short desktop screens so the start screen never scrolls.
 */
export function Benefits({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] motion-layout lg:[@media(max-height:50rem)]:hidden ${
        collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
      aria-hidden={collapsed}
    >
      <ul className="mx-auto flex max-w-content animate-rise flex-col items-center gap-x-6 gap-y-2.5 overflow-hidden pt-8 [animation-delay:0.9s] sm:flex-row sm:flex-wrap sm:justify-center">
        {BENEFITS.map((b) => (
          <li key={b.lead} className="flex items-center gap-2 text-small text-soft">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary" aria-hidden="true">
              <Icon name={b.icon} className="size-3.5" strokeWidth={2.25} />
            </span>
            <span>
              <strong className="font-semibold text-ink">{b.lead}</strong> {b.rest}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
