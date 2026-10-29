import { Icon } from "@/components/ui/Icon";
import type { IntentPart } from "@/lib/types";

type IntentChipsProps = {
  parts: IntentPart[];
  onRemove: (part: IntentPart) => void;
  /** "row": its own scrolling row with a "Showing:" label (phones). "inline": just the chips, for the results line (desktop). */
  variant?: "row" | "inline";
};

/** What smart search understood from the query, as removable chips (one tap undoes a guess). */
export function IntentChips({ parts, onRemove, variant = "row" }: IntentChipsProps) {
  if (parts.length === 0) return null;

  const chips = parts.map((part) => (
    <button
      key={part.key}
      type="button"
      className="chip h-9 animate-fade border-primary/30 bg-primary-soft"
      onClick={() => onRemove(part)}
      aria-label={`Remove ${part.label} from search`}
      title={part.typed ? `You typed “${part.typed}”` : undefined}
    >
      <Icon name={part.icon} className="size-4 text-primary" />
      {part.label}
      {part.typed && <span className="text-caption text-muted">(you typed {part.typed})</span>}
      <Icon name="close" className="size-4 text-muted" />
    </button>
  ));

  if (variant === "inline") {
    return (
      <span className="contents" aria-label="Search understood as">
        {chips}
      </span>
    );
  }

  return (
    <div className="-mx-gutter flex items-center gap-2 overflow-x-auto px-gutter py-0.5 [scrollbar-width:none] sm:mx-0 sm:px-0" aria-label="Search understood as">
      <span className="shrink-0 text-small text-soft">Showing:</span>
      {chips}
    </div>
  );
}
