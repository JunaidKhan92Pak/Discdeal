"use client";

import { Select as RadixSelect } from "radix-ui";
import { Icon, type IconName } from "@/components/ui/Icon";

type SelectProps<T extends string> = {
  /** Accessible name, e.g. "Your city". */
  label: string;
  icon?: IconName;
  /** Short visible lead-in, e.g. "Sort:". Hidden on phones to save room. */
  prefix?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

/** A pill that opens a Radix Select list: big rows, a tick on the current choice, full keyboard and screen-reader support. */
export function Select<T extends string>({ label, icon, prefix, value, options, onChange }: SelectProps<T>) {
  return (
    <RadixSelect.Root value={value} onValueChange={(next) => onChange(next as T)}>
      <RadixSelect.Trigger aria-label={label} className="pill">
        {icon && <Icon name={icon} className="size-4 text-primary" />}
        {prefix && <span className="hidden font-medium text-muted sm:inline">{prefix}</span>}
        <span className="max-w-36 truncate">
          <RadixSelect.Value />
        </span>
        <RadixSelect.Icon>
          <Icon name="chevron-down" className="size-4 text-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

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
