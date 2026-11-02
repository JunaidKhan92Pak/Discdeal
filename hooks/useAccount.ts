"use client";

import { useSyncExternalStore } from "react";
import type { FieldErrors, PublicUser } from "@/lib/account";

/**
 * Who is logged in, shared by every component (a tiny external store, like useLikedDeals). Asked from the server once
 * per visit. Also holds the "please log in" request: any component can ask (e.g. the heart on a deal), the one
 * AuthDialog on the page shows it, and once the person is in, the action they wanted runs.
 */
export type LoginPrompt = { reason?: string; mode: "login" | "register"; then?: () => void };

type State = {
  /** false until the server answered. */
  ready: boolean;
  /** false when no database is connected: accounts cannot work, so the page hides them. */
  accounts: boolean;
  user: PublicUser | null;
  prompt: LoginPrompt | null;
};

const INITIAL: State = { ready: false, accounts: true, user: null, prompt: null };
let state = INITIAL;
let requested = false;
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!requested) {
    requested = true;
    fetch("/api/auth/me")
      .then((r) => r.json() as Promise<{ user: PublicUser | null; accounts?: boolean }>)
      .then((body) => set({ ready: true, user: body.user ?? null, accounts: body.accounts !== false }))
      .catch(() => set({ ready: true }));
  }
  return () => listeners.delete(listener);
}

export type SubmitResult = { ok: true } | { ok: false; error?: string; errors?: FieldErrors };

async function send(url: string, body: unknown): Promise<SubmitResult & { user?: PublicUser }> {
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => ({}))) as { user?: PublicUser; error?: string; errors?: FieldErrors };
    if (response.ok) return { ok: true, user: data.user };
    return { ok: false, error: data.error ?? (data.errors ? undefined : "Something went wrong. Please try again."), errors: data.errors };
  } catch {
    return { ok: false, error: "No internet connection? Please check and try again." };
  }
}

async function signIn(url: string, body: unknown): Promise<SubmitResult> {
  const result = await send(url, body);
  if (!result.ok || !result.user) return result.ok ? { ok: false, error: "Something went wrong. Please try again." } : result;
  const then = state.prompt?.then;
  set({ user: result.user, prompt: null });
  then?.();
  return { ok: true };
}

export const account = {
  login: (login: string, password: string) => signIn("/api/auth/login", { login, password }),
  register: (form: Record<string, string>) => signIn("/api/auth/register", form),
  async logout() {
    await send("/api/auth/logout", {});
    set({ user: null });
  },
  /** Opens the log-in window. `then` runs once the person has logged in or registered. */
  ask(prompt: LoginPrompt) {
    set({ prompt });
  },
  close() {
    set({ prompt: null });
  },
  get user() {
    return state.user;
  },
};

export function useAccount(): State {
  return useSyncExternalStore(subscribe, () => state, () => INITIAL);
}
