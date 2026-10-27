"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
};

export function SearchBar({ value, onChange, onFocus, onBlur, onSubmit }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form role="search" onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
        onSubmit();
      }} className="mx-auto w-full max-w-search">
      <label htmlFor="search" className="sr-only">Search deals</label>
      <div className="field">
        <input
          id="search"
          ref={inputRef}
          type="search"
          autoComplete="off"
          placeholder="Search deals or stores…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted/70 sm:text-lg [&::-webkit-search-cancel-button]:hidden"
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
            className="icon-btn size-8 shrink-0"
          >
            <Icon name="close" className="size-4" />
          </button>
        )}
        <button type="submit" aria-label="Search deals" className="search-btn">
          <Icon name="search" className="size-5" />
        </button>
      </div>
    </form>
  );
}
