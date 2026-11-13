"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAccount } from "@/hooks/useAccount";
import type { CityId } from "@/lib/types";

/*
 * The log-in window (and the form checks it brings, zod) is downloaded only when someone first needs it: most
 * visitors never log in, so they never pay for it. Pointing at "Log in" starts the download early
 * (preloadAuthDialog), so by the time the tap lands it is usually there already.
 */
const load = () => import("@/components/auth/AuthDialog").then((mod) => mod.AuthDialog);
const AuthDialog = dynamic(load, { ssr: false });

export function preloadAuthDialog() {
  void load();
}

export function LazyAuthDialog({ city }: { city: CityId | null }) {
  const { prompt } = useAccount();
  // Mounted on the first request to log in, then kept, so closing and reopening stays instant (and animates out).
  const [needed, setNeeded] = useState(false);
  if (prompt && !needed) setNeeded(true);
  return needed ? <AuthDialog city={city} /> : null;
}
