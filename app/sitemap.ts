import type { MetadataRoute } from "next";
import { allTopics } from "@/lib/deal-pages";
import { getPagesData } from "@/lib/server/pages-data";
import { siteUrl } from "@/lib/site";

/** sitemap.xml: the search screen, the readable pages, and every city / category / bank / brand page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getPagesData();
  const url = siteUrl();
  const latest = (dates: string[]) => new Date(dates.reduce((a, b) => (a > b ? a : b), "2026-01-01"));
  const updated = latest(data.deals.map((d) => d.checkedAt));
  return [
    { url, lastModified: updated, changeFrequency: "daily", priority: 1 },
    { url: `${url}/deals`, lastModified: updated, changeFrequency: "daily", priority: 0.9 },
    { url: `${url}/about`, lastModified: updated, changeFrequency: "monthly", priority: 0.5 },
    ...allTopics(data).map((t) => ({
      url: `${url}${t.path}`,
      lastModified: latest(t.deals.map((d) => d.checkedAt)),
      changeFrequency: "daily" as const,
      priority: t.kind === "brand" ? 0.6 : 0.8,
    })),
  ];
}
