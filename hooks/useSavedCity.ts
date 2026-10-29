"use client";

import { useSyncExternalStore } from "react";
import { CITIES } from "@/lib/taxonomy";
import type { CityId } from "@/lib/types";

const STORAGE_KEY = "discdeal-city";
const listeners = new Set<() => void>();

function read(): CityId | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return CITIES.some((c) => c.id === value) ? (value as CityId) : null;
  } catch {
    return null;
  }
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

/** The user's city, remembered in localStorage (null = all of Pakistan). No forced "pick your city" popup. */
export function useSavedCity() {
  const city = useSyncExternalStore(subscribe, read, () => null);

  function setCity(next: CityId | null) {
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
    listeners.forEach((listener) => listener());
  }

  return { city, setCity };
}
