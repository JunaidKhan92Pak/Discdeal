"use client";

import { useSyncExternalStore } from "react";

/**
 * INSTALLING DISCDEAL AS AN APP ("Download the app").
 *
 *   "prompt"    Chrome, Edge, Samsung Internet, Android: the browser's own install prompt can be shown on a tap.
 *   "ios"       iPhone / iPad: Apple offers no prompt; the person adds it from the Share menu (we show how).
 *   "manual"    Any other browser: it can usually be installed from the browser menu (we show how).
 *   "installed" Already opened as the installed app, or just installed: nothing to offer.
 *   "unknown"   On the server and before the page has started: show nothing yet, so nothing flashes.
 *
 * The prompt event is caught by a tiny script in the page head (app/layout.tsx, INSTALL_INIT), because Chrome often
 * sends it before React starts; later ones are caught here.
 */
export type InstallState = "prompt" | "ios" | "manual" | "installed" | "unknown";

/** Chrome's install prompt event (not in TypeScript's DOM types). */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

declare global {
  interface Window {
    __installPrompt?: InstallPromptEvent;
  }
}

const listeners = new Set<() => void>();
let started = false;
let justInstalled = false;

const notify = () => listeners.forEach((listener) => listener());

function start() {
  if (started) return;
  started = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__installPrompt = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    justInstalled = true;
    window.__installPrompt = undefined;
    notify();
  });
}

function isInstalled(): boolean {
  return justInstalled || matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** iPhone, iPod, and iPads (which call themselves a Mac but have a touch screen). */
function isApple(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function snapshot(): InstallState {
  if (isInstalled()) return "installed";
  if (window.__installPrompt) return "prompt";
  return isApple() ? "ios" : "manual";
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, snapshot, () => "unknown");
}

/**
 * Shows the browser's install prompt. Returns "shown" when it did (whatever the person chose), or "unavailable"
 * when this browser has none to show, so the caller explains how to add it by hand instead.
 */
export async function promptInstall(): Promise<"shown" | "unavailable"> {
  const event = window.__installPrompt;
  if (!event) return "unavailable";
  // A prompt can only be shown once; the browser sends a new event if it can be offered again.
  window.__installPrompt = undefined;
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") justInstalled = true;
  notify();
  return "shown";
}
