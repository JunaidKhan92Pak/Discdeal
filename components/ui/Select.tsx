"use client";

import { Select as RadixSelect } from "radix-ui";
import { Hint } from "@/components/ui/Hint";
import { Icon, type IconName } from "@/components/ui/Icon";

type SelectProps<T extends string> = {
  /** Accessible name, e.g. "Your city". */
  label: string;
  /** Short visible lead-in, e.g. "Sort:". Hidden on phones to save room. */
  prefix?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** Shown on hover / keyboard focus, e.g. { label: "Sort", detail: "Best match" }. */
  hint?: { label: string; detail?: string };
} & (
  /** "label" (default): the pill spells out the current choice. */
  | { variant?: "label"; icon?: IconName }
  /** "icon": the pill rests as just its icon (the value is still read out to screen readers). */
  | { variant: "icon"; icon: IconName }
);

/** A pill that opens a Radix Select list: big rows, a tick on the current choice, full keyboard and screen-reader support. */
export function Select<T extends string>({ label, icon, prefix, value, options, onChange, variant = "label", hint }: SelectProps<T>) {
  const iconOnly = variant === "icon";
  const trigger = (
    <RadixSelect.Trigger aria-label={label} className="pill" data-iconic={iconOnly ? "" : undefined}>
      {icon && <Icon name={icon} className={iconOnly ? "size-5" : "size-4 text-primary"} />}
      {prefix && !iconOnly && <span className="hidden font-medium text-muted sm:inline">{prefix}</span>}
      <span className={iconOnly ? "sr-only" : "max-w-36 animate-fade truncate"}>
        <RadixSelect.Value />
      </span>
      {!iconOnly && (
        <RadixSelect.Icon>
          <Icon name="chevron-down" className="size-4 text-muted" />
        </RadixSelect.Icon>
      )}
    </RadixSelect.Trigger>
  );

  return (
    <RadixSelect.Root value={value} onValueChange={(next) => onChange(next as T)}>
      {hint ? (
        <Hint label={hint.label} detail={hint.detail}>
          {trigger}
        </Hint>
      ) : (
        trigger
      )}

      <RadixSelect.Portal>
        <RadixSelect.Content position="popper" sideOffset={6} align="end" className="menu animate-pop">
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item key={option.value} value={option.value} className="menu-item">
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-3">
                  <Icon name="check" className="size-5" strokeWidth={2.25} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
