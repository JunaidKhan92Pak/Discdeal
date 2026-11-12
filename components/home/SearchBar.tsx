"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Label } from "radix-ui";
import { Icon } from "@/components/ui/Icon";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTypewriter } from "@/hooks/useTypewriter";
import { EASE, gsap, reducedMotion, sleepWhenIdle } from "@/lib/motion";

type SearchBarProps = {
  value: string;
  /** Slimmer bar once results show (it sits in the header row on desktop). */
  compact?: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
  /** Example searches to type into the empty box on the start screen (from the live data, so each one finds deals). */
  examples?: string[];
};

export function SearchBar({ value, compact = false, onChange, onFocus, onBlur, onSubmit, examples = [] }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const typedRef = useRef<HTMLElement>(null);
  const [focused, setFocused] = useState(false);
  // False on the server and for people who asked for less motion: they get the plain placeholder.
  const motionOk = useMediaQuery("(prefers-reduced-motion: no-preference)");
  const typing = motionOk && !compact && !focused && value === "" && examples.length > 0;
  useTypewriter(typedRef, examples, typing);

  // Rises in just after the headline (see Hero). Mounted once: it stays put while the screen switches to results.
  useLayoutEffect(() => {
    const form = formRef.current;
    if (reducedMotion() || !form) return;
    // Ends on an inline `transform: none`, not a cleared one: clearing it lets the CSS start state (`.motion-ok
    // [data-hero]`, 18px down) apply again, which left the bar sitting lower than the buttons beside it.
    const tween = gsap.to(form, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      delay: 0.3,
      ease: EASE,
      onComplete: () => {
        form.style.transform = "none";
        sleepWhenIdle();
      },
    });
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
        <div className="relative flex min-w-0 flex-1 items-center self-stretch">
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
            onFocus={() => {
              setFocused(true);
              onFocus();
            }}
            onBlur={() => {
              setFocused(false);
              onBlur();
            }}
            className={`size-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-muted sm:text-lg [&::-webkit-search-cancel-button]:hidden ${
              typing ? "placeholder:text-transparent" : ""
            }`}
          />
          {/* Example searches typing themselves while the box waits: a live hint of what you can ask. Visual only;
              screen readers get the steady placeholder above. Gone the moment you focus or type. */}
          {typing && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex animate-fade items-center overflow-hidden text-base whitespace-nowrap text-muted sm:text-lg">
              {/* The quotes belong to the example: between two examples the box reads "Try |", never an empty "Try “”". */}
              Try&nbsp;
              <bdi ref={typedRef} className="before:content-['“'] after:content-['”'] empty:before:content-none empty:after:content-none" />
              <span className="ml-0.5 h-[1.1em] w-0.5 shrink-0 animate-caret rounded-full bg-primary" />
            </span>
          )}
        </div>
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
        <button type="submit" aria-label="Search deals" className={`search-btn group ${compact ? "" : "sm:px-5"}`}>
          {/* The magnifier leans in, as if looking, when the pointer reaches the button */}
          <Icon name="search" className="size-5 transition-transform duration-300 ease-smooth group-hover:scale-110 group-hover:-rotate-12" strokeWidth={2.25} />
          {!compact && <span className="hidden text-body font-semibold sm:inline">Search</span>}
        </button>
      </div>
    </form>
  );
}
