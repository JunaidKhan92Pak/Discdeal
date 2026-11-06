/**
 * What the visitor's device and connection can afford, so the app spends less of their data and battery when it
 * should. Browser-only answers; on the server (and in browsers without these APIs) everything is "normal".
 */

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

function connection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

/** The person turned on Data Saver / Lite mode, or the connection is 2G: load less, skip pictures in lists. */
export function dataSaver(): boolean {
  const c = connection();
  return Boolean(c?.saveData) || c?.effectiveType === "2g" || c?.effectiveType === "slow-2g";
}

/**
 * Smooth (Lenis) scrolling only helps a mouse wheel or trackpad. On touch screens the phone's own scrolling is
 * already smooth, so there Lenis would only cost battery; it is also off for reduced motion and Data Saver.
 */
export function smoothScrollAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches && !dataSaver();
}
