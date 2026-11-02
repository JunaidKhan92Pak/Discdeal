"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { account, useAccount } from "@/hooks/useAccount";

/**
 * Liked deals belong to the account, so they are on every device the person logs in on. Logged out, the heart asks
 * the person to log in or register first, then saves the like. Likes saved on this phone by the older version
 * (before accounts) are moved into the account the first time the person logs in.
 */
const OLD_STORAGE_KEY = "discdeal-liked";
const EMPTY: number[] = [];

let liked: number[] = EMPTY;
/** The username the list belongs to, and the request loading it. */
let owner: string | null = null;
let loading: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

function set(next: number[]) {
  liked = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function call(method: "GET" | "POST" | "DELETE", url: string, body?: unknown): Promise<number[]> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`${method} ${url} → ${response.status}`);
  return ((await response.json()) as { ids: number[] }).ids;
}

function takeOldLikes(): number[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isSafeInteger(n) && n > 0) : [];
  } catch {
    return [];
  }
}

/** Loads the list for this user once (null = logged out → empty list). */
function ensureLoaded(username: string | null): Promise<void> {
  if (username === owner) return loading;
  owner = username;
  if (!username) {
    set(EMPTY);
    loading = Promise.resolve();
    return loading;
  }
  const old = takeOldLikes();
  loading = (old.length > 0 ? call("POST", "/api/likes", { ids: old }) : call("GET", "/api/likes"))
    .then((ids) => {
      if (old.length > 0) {
        try {
          localStorage.removeItem(OLD_STORAGE_KEY);
        } catch {}
      }
      if (owner === username) set(ids);
    })
    .catch(() => {});
  return loading;
}

export function useLikedDeals() {
  const { user } = useAccount();
  const username = user?.username ?? null;
  useEffect(() => {
    void ensureLoaded(username);
  }, [username]);
  const ids = useSyncExternalStore(subscribe, () => liked, () => EMPTY);

  const toggle = useCallback(async function toggleLike(id: number) {
    const me = account.user;
    if (!me) {
      account.ask({ mode: "login", reason: "Log in or create a free account to save the deals you like.", then: () => void toggleLike(id) });
      return;
    }
    await ensureLoaded(me.username);
    const before = liked;
    const removing = before.includes(id);
    set(removing ? before.filter((x) => x !== id) : [id, ...before]); // show it at once
    try {
      const saved = removing ? await call("DELETE", `/api/likes?id=${id}`) : await call("POST", "/api/likes", { ids: [id] });
      if (owner === me.username) set(saved);
    } catch {
      if (owner === me.username) set(before); // could not save: undo
    }
  }, []);

  return { liked: ids, toggle };
}
