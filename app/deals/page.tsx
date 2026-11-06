import type { Metadata } from "next";
import Link from "next/link";
import { DealRow } from "@/components/site/DealRow";
import { PageIntro, SectionTitle, SiteShell } from "@/components/site/SiteShell";
import { allTopics, headlinePct, topicPath, type Topic, type TopicKind } from "@/lib/deal-pages";
import { formatDate } from "@/lib/format";
import { getPagesData } from "@/lib/server/pages-data";
import { jsonLd, siteUrl } from "@/lib/site";
import { breadcrumbList, graph, offerList } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPagesData();
  const title = `All discounts and deals in Pakistan (${data.deals.length} live offers)`;
  const description = `Every live discount on DiscDeal, updated ${formatDate(data.asOf)}: by city, category, bank card and brand. Restaurants, clothing sales, groceries, travel and more across Pakistan.`;
  return { title, description, alternates: { canonical: "/deals" }, openGraph: { title, description, url: "/deals" } };
}

const SECTIONS: { kind: TopicKind; title: string }[] = [
  { kind: "city", title: "Deals by city" },
  { kind: "category", title: "Deals by category" },
  { kind: "bank", title: "Deals by bank card" },
  { kind: "brand", title: "Deals by brand" },
];

export default async function DealsIndex() {
  const data = await getPagesData();
  const topics = allTopics(data);
  const top = [...data.deals].sort((a, b) => headlinePct(b) - headlinePct(a)).slice(0, 10);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "All deals", path: "/deals" },
  ];
  const pages = {
    "@type": "CollectionPage",
    name: "All discounts and deals in Pakistan",
    url: `${siteUrl()}/deals`,
    hasPart: topics.map((t) => ({ "@type": "WebPage", name: t.heading, url: `${siteUrl()}${t.path}` })),
  };

  return (
    <SiteShell breadcrumbs={crumbs}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph(breadcrumbList(crumbs), pages, offerList("Biggest discounts right now", top, data.cards))) }} />
      <PageIntro title="All discounts and deals in Pakistan">
        {data.deals.length} live offers from {new Set(data.deals.map((d) => d.brandId)).size} brands, updated {formatDate(data.asOf)}: bank-card
        discounts and brand sales, each with its source. Pick a city, category, bank or brand, or{" "}
        <Link href="/" className="link">
          search in English, Roman Urdu or Urdu
        </Link>
        .
      </PageIntro>

      {SECTIONS.map(({ kind, title }) => (
        <TopicLinks key={kind} title={title} topics={topics.filter((t) => t.kind === kind)} />
      ))}

      <SectionTitle>Biggest discounts right now</SectionTitle>
      <ul className="grid gap-2.5">
        {top.map((d) => (
          <DealRow key={d.id} deal={d} cards={data.cards} />
        ))}
      </ul>
    </SiteShell>
  );
}

function TopicLinks({ title, topics }: { title: string; topics: Topic[] }) {
  if (topics.length === 0) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <ul className="flex flex-wrap gap-2" data-reveal>
        {topics.map((t) => (
          <li key={t.path}>
            <Link href={topicPath(t.kind, t.id)} className="pill">
              {t.name} <span className="count">{t.deals.length}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
