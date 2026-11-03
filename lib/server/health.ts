/**
 * Remembers when an outside service (Redis, the database) just failed, so the site stops waiting on it for a while
 * and works without it: memory cache instead of Redis, the spreadsheets instead of the database. After the pause
 * the next request tries the service again. (A "circuit breaker".) Without this, every search would wait for the
 * same timeout again whenever a network blocks or a service is down.
 */
import "server-only";

export type Service = "redis" | "database";

const PAUSE_MS = 60_000;
// On globalThis: Next.js may load a separate copy of this file for each API route, and all of them should know.
const shared = globalThis as typeof globalThis & { __discdealDownUntil?: Map<Service, number> };
const downUntil = (shared.__discdealDownUntil ??= new Map<Service, number>());

/** False while the service is paused after a failure. */
export function isUp(service: Service): boolean {
  return (downUntil.get(service) ?? 0) <= Date.now();
}

/** Pauses the service for a minute. Logs once per outage, not once per request. */
export function markDown(service: Service, error: unknown): void {
  if (isUp(service)) console.warn(`[${service}] unreachable, working without it for 60 s:`, (error as Error)?.message ?? error);
  downUntil.set(service, Date.now() + PAUSE_MS);
}

export { isConnectionError } from "@/lib/connection-errors";
