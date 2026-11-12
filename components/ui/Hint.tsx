"use client";

import type { ReactNode } from "react";
import { Tooltip } from "radix-ui";

type HintProps = {
  /** What the control is, in two or three words: "Liked deals". */
  label: string;
  /** Optional second line: what it does or what it is set to right now. */
  detail?: string;
  side?: "top" | "bottom" | "left" | "right";
  /** The control. It must be a single element that accepts a ref (a button, or a Radix trigger). */
  children: ReactNode;
};

/** How the person last interacted: focus that follows a click or tap should not open a hint, focus from Tab should. */
let lastInput: "pointer" | "keyboard" = "pointer";
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => (lastInput = "pointer"), { capture: true, passive: true });
  window.addEventListener("keydown", () => (lastInput = "keyboard"), { capture: true, passive: true });
}

/**
 * The detail that appears when someone comes near a control: hovering it with a mouse or reaching it with the
 * keyboard. It lets buttons rest as plain icons and still explain themselves. Touch screens never show it, so the
 * control must make sense without it (a familiar icon, a visible label while it is on).
 * Shares one TooltipProvider (app/layout.tsx): after the first hint, moving to the next one shows it at once.
 */
export function Hint({ label, detail, side = "bottom", children }: HintProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        asChild
        // Menus and dialogs hand focus back to their button when they close. After a click that is not someone
        // arriving with the keyboard, so it must not pop the hint open (and leave it stuck there).
        onFocus={(e) => {
          if (lastInput === "pointer") e.preventDefault();
        }}
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side={side} sideOffset={8} collisionPadding={12} className="hint">
          <span className="block font-semibold">{label}</span>
          {detail && <span className="block text-bg/75">{detail}</span>}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
