"use client";

import { useEffect, useState } from "react";
import type { CatalogMeta } from "@/lib/types";

/* Fetched once per visit and shared by every component that asks (one request, not one per component). */
let request: Promise<CatalogMeta | null> | null = null;
let result: CatalogMeta | null = null;

function loadMeta(): Promise<CatalogMeta | null> {
  request ??= fetch("/api/meta")
    .then((response) => (response.ok ? (response.json() as Promise<CatalogMeta>) : null))
    .then((meta) => {
      result = meta;
      if (!meta) request = null; // failed: allow a retry next time
      return meta;
    })
    .catch(() => {
      request = null;
      return null;
    });
  return request;
}

/** Banks and cards, live numbers and example searches, worked out from the data on the server. null while loading. */
export function useMeta(): CatalogMeta | null {
  const [meta, setMeta] = useState<CatalogMeta | null>(result);
  useEffect(() => {
    if (result) return;
    let active = true;
    loadMeta().then((loaded) => {
      if (active && loaded) setMeta(loaded);
    });
    return () => {
      active = false;
    };
  }, []);
  return meta;
}
