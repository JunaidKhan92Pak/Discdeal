"use client";

import { type RefObject, useLayoutEffect } from "react";

const TYPE_MS = 70; // per letter, give or take a little so it reads as a person typing, not a machine
const ERASE_MS = 28;
const HOLD_MS = 2400; // a finished example stays long enough to read
const GAP_MS = 400;

/**
 * Types example searches into `ref` one letter at a time, holds each one, erases it and moves to the next, forever,
 * while `running`. The first example starts fully written, so there is never an empty box. Writes the element's text
 * directly (no React render per letter) and stops the moment `running` turns false (focus, typing, results).
 * Letters are split by code point, so Urdu text is typed the same way as English.
 */
export function useTypewriter(ref: RefObject<HTMLElement | null>, words: string[], running: boolean) {
  const key = words.join("\u0000");

  // Layout effect: the first example is written before the box is painted, so it never shows an empty "Try “”".
  useLayoutEffect(() => {
    const el = ref.current;
    const list = key ? key.split("\u0000") : [];
    if (!el || !running || list.length === 0) return;

    let index = 0;
    let letters = Array.from(list[0]);
    let count = letters.length;
    let erasing = true;
    let timer = 0;
    el.textContent = list[0];

    const tick = () => {
      if (erasing) {
        count -= 1;
        el.textContent = letters.slice(0, count).join("");
        if (count > 0) {
          timer = window.setTimeout(tick, ERASE_MS);
          return;
        }
        erasing = false;
        index = (index + 1) % list.length;
        letters = Array.from(list[index]);
        timer = window.setTimeout(tick, GAP_MS);
        return;
      }
      count += 1;
      el.textContent = letters.slice(0, count).join("");
      if (count < letters.length) {
        timer = window.setTimeout(tick, TYPE_MS * (0.6 + Math.random() * 0.8));
        return;
      }
      erasing = true;
      timer = window.setTimeout(tick, HOLD_MS);
    };

    timer = window.setTimeout(tick, HOLD_MS + 800); // the first one also waits for the page's entrance to finish
    return () => window.clearTimeout(timer);
  }, [ref, key, running]);
}
