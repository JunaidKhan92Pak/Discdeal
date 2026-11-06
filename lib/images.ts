/**
 * Which deal pictures go through Next's image optimiser (resized per screen, AVIF/WebP, cached). Shared by
 * next.config.ts (the allow-list) and DealImage (the choice per picture), so the two can never disagree.
 *
 * NEXT_PUBLIC_IMAGE_HOSTS: comma-separated https hostnames, e.g. "abcd.supabase.co,cdn.brand.pk" or "**.supabase.co".
 * Never "**" on its own: that would let anyone use this site to resize any picture on the internet, at our cost.
 */
export const IMAGE_HOSTS: string[] = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter((host) => host && host !== "**" && host !== "*");

/** Pictures uploaded with the site: public/deals/… */
export const LOCAL_IMAGE_PREFIX = "/deals/";

function hostAllowed(hostname: string): boolean {
  return IMAGE_HOSTS.some((pattern) => (pattern.startsWith("**.") ? hostname.endsWith(pattern.slice(2)) : hostname === pattern));
}

/** True when the optimiser may serve this picture (the same rules as `images` in next.config.ts). */
export function canOptimize(src: string): boolean {
  if (src.startsWith(LOCAL_IMAGE_PREFIX)) return !src.includes("?");
  try {
    const url = new URL(src);
    return url.protocol === "https:" && !url.port && !url.search && hostAllowed(url.hostname);
  } catch {
    return false;
  }
}
