"use client";

import { useRef } from "react";
import { Label } from "radix-ui";
import { Icon } from "@/components/ui/Icon";

type SearchBarProps = {
  value: string;
  /** Slimmer bar once results show (it sits in the header row on desktop). */
  compact?: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
};

export function SearchBar({ value, compact = false, onChange, onFocus, onBlur, onSubmit }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form role="search" onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
        onSubmit();
      }} className={`mx-auto w-full max-w-search ${compact ? "lg:mx-0" : ""}`}>
      <Label.Root htmlFor="search" className="sr-only">Search deals</Label.Root>
      <div className="field" data-compact={compact}>
        <input
          id="search"
          ref={inputRef}
          type="search"
          autoComplete="off"
          dir="auto"
          enterKeyHint="search"
          placeholder="Try “pizza in Lahore” or “kapray 50%”"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted sm:text-lg [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="icon-btn shrink-0"
          >
            <Icon name="close" className="size-5" />
          </button>
        )}
        <button type="submit" aria-label="Search deals" className="search-btn">
          <Icon name="search" className="size-6" />
        </button>
      </div>
    </form>
  );
}
