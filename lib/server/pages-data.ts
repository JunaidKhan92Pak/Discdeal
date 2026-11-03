/**
 * The live catalogue for the server-rendered pages (deal pages, sitemap, llms.txt). Cached with "use cache" for an
 * hour, so search engines and AI crawlers reading hundreds of pages cost about one catalogue load an hour.
 */
import "server-only";
import { cacheLife } from "next/cache";
import { todayInPakistan } from "@/lib/deals-csv";
import type { PagesData } from "@/lib/deal-pages";
import { getCatalog } from "@/lib/server/catalog";

export async function getPagesData(): Promise<PagesData> {
  "use cache";
  cacheLife("hours");
  const { deals, banks, cards } = await getCatalog();
  return { deals, banks, cards, asOf: todayInPakistan() };
}
