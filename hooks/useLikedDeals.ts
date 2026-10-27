"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "discdeal-liked";
const EMPTY: number[] = [];

/* A tiny external store: liked ids live in localStorage and every component using the hook stays in sync
   (also across browser tabs). useSyncExternalStore keeps server and first client render identical. */
let snapshot: number[] | null = null;
const listeners = new Set<() => void>();

function read(): number[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): number[] {
  if (snapshot === null) snapshot = read();
  return snapshot;
}

function write(next: number[]) {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLikedDeals() {
  const liked = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const toggle = useCallback((id: number) => {
    const current = getSnapshot();
    write(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);

  return { liked, toggle };
}
