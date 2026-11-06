"use client";

import { useLayoutEffect, useRef } from "react";
import { Label } from "radix-ui";
import { Icon } from "@/components/ui/Icon";
import { EASE, gsap, reducedMotion, sleepWhenIdle } from "@/lib/motion";

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
  const formRef = useRef<HTMLFormElement>(null);

  // Rises in just after the headline (see Hero). Mounted once: it stays put while the screen switches to results.
  useLayoutEffect(() => {
    if (reducedMotion() || !formRef.current) return;
    const tween = gsap.to(formRef.current, { opacity: 1, y: 0, duration: 0.9, delay: 0.3, ease: EASE, clearProps: "transform", onComplete: sleepWhenIdle });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <form
      ref={formRef}
      data-hero="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
        onSubmit();
      }}
      className={`mx-auto w-full max-w-search ${compact ? "lg:mx-0" : ""}`}
    >
      <Label.Root htmlFor="search" className="sr-only">
        Search deals
      </Label.Root>
      {/* One search symbol only, on the button. The pill shape and the example text already say "type here". */}
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
            className="icon-btn size-9 shrink-0 animate-fade bg-fill"
          >
            <Icon name="close" className="size-4" />
          </button>
        )}
        {/* The magnifier everyone knows, plus the word on larger screens (clearest for every age); icon only when compact. */}
        <button type="submit" aria-label="Search deals" className={`search-btn ${compact ? "" : "sm:px-5"}`}>
          <Icon name="search" className="size-5" strokeWidth={2.25} />
          {!compact && <span className="hidden text-body font-semibold sm:inline">Search</span>}
        </button>
      </div>
    </form>
  );
}
