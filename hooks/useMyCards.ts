"use client";

import { useSyncExternalStore } from "react";

/**
 * The user's cards, remembered on this device (localStorage), plus whether to show only deals for them.
 * Only card NAMES are stored (e.g. "hbl-konnect-debit"), never card numbers or anything private.
 */
export type MyCards = { cards: string[]; only: boolean };

const STORAGE_KEY = "discdeal-cards";
const EMPTY: MyCards = { cards: [], only: false };
const listeners = new Set<() => void>();

let lastRaw: string | null = null;
let lastValue: MyCards = EMPTY;

function read(): MyCards {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === lastRaw) return lastValue; // same snapshot object while nothing changed
  lastRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "null") as Partial<MyCards> | null;
    const cards = Array.isArray(parsed?.cards) ? parsed.cards.filter((id): id is string => typeof id === "string" && /^[a-z0-9-]{1,60}$/.test(id)).slice(0, 20) : [];
    lastValue = { cards, only: cards.length > 0 && parsed?.only === true };
  } catch {
    lastValue = EMPTY;
  }
  return lastValue;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMyCards() {
  const myCards = useSyncExternalStore(subscribe, read, () => EMPTY);

  function save(next: MyCards) {
    const value: MyCards = { cards: next.cards, only: next.cards.length > 0 && next.only };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {}
    listeners.forEach((listener) => listener());
  }

  return { myCards, save };
}
