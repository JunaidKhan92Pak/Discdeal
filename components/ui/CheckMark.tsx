import { Icon } from "@/components/ui/Icon";

/**
 * The tick box at the end of a row in a pick-several list. Purely visual: the row itself is the button and says
 * whether it is on (aria-pressed); the box fills in through CSS (`.list-row[aria-pressed="true"] .check-box`).
 */
export function CheckMark() {
  return (
    <span className="check-box" aria-hidden="true">
      <Icon name="check" className="size-3.5" strokeWidth={3} />
    </span>
  );
}
