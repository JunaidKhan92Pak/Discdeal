import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealRow } from "@/components/site/DealRow";
import { FaqList, PageIntro, SectionTitle, SiteShell } from "@/components/site/SiteShell";
import { allTopics, topic, topicFaq, topicPath, topicSummary as summary } from "@/lib/deal-pages";
import { formatDate, formatOffer } from "@/lib/format";
import { getPagesData } from "@/lib/server/pages-data";
import { jsonLd } from "@/lib/site";
import { breadcrumbList, faqPage, graph, offerList } from "@/lib/structured-data";

type Props = { params: Promise<{ kind: string; id: string }> };

/** Every city, category, bank and brand page is built ahead of time. Anything else is a 404 (notFound below). */
export async function generateStaticParams() {
  const data = await getPagesData();
  return allTopics(data).map((t) => ({ kind: t.kind, id: t.id }));
}

async function load(params: Props["params"]) {
  const { kind, id } = await params;
  const data = await getPagesData();
  const t = topic(data, kind, id);
  return t && t.deals.length > 0 ? { data, t } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return {};
  const { t, data } = found;
  const title = `${t.heading}: ${summary(t)}`;
  const description = `${t.heading}, updated ${formatDate(data.asOf)}: ${t.deals
    .slice(0, 4)
    .map((d) => `${d.brand} ${formatOffer(d)}`)
    .join(", ")}${t.deals.length > 4 ? " and more" : ""}. Bank-card and brand offers with sources.`;
  return { title, description, alternates: { canonical: t.path }, openGraph: { title, description, url: t.path, type: "website" } };
}

const KIND_LABEL = { city: "Cities", category: "Categories", brand: "Brands", bank: "Banks" } as const;

export default async function TopicPage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { t, data } = found;
  const faq = topicFaq(t, data);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "All deals", path: "/deals" },
    { name: `${KIND_LABEL[t.kind]}: ${t.name}`, path: t.path },
  ];
  const local = t.kind === "city" ? t.deals.slice(0, t.deals.length - (t.nationwide ?? 0)) : t.deals;
  const everywhere = t.kind === "city" ? t.deals.slice(local.length) : [];
  const related = allTopics(data).filter((o) => o.kind === t.kind && o.id !== t.id).slice(0, 12);

  return (
    <SiteShell breadcrumbs={crumbs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(graph(breadcrumbList(crumbs), offerList(t.heading, t.deals, data.cards), faqPage(faq))) }}
      />
      <PageIntro title={t.heading}>
        {summary(t).charAt(0).toUpperCase() + summary(t).slice(1)}, updated {formatDate(data.asOf)}. Each deal shows how much you save, which
        bank card it needs (if any), where it works and until when, with a link to the bank&apos;s or brand&apos;s own page.{" "}
        <Link href={`/?q=${encodeURIComponent(t.name)}`} className="link">
          Search {t.name} deals
        </Link>{" "}
        to filter by your city or card.
      </PageIntro>

      <SectionTitle>{t.kind === "city" ? `Deals at shops in ${t.name}` : "Current deals"}</SectionTitle>
      <ul className="grid gap-2.5">
        {local.map((d) => (
          <DealRow key={d.id} deal={d} cards={data.cards} linkBrand={t.kind !== "brand"} />
        ))}
      </ul>

      {everywhere.length > 0 && (
        <>
          <SectionTitle>Also valid in {t.name}: nationwide and online deals</SectionTitle>
          <ul className="grid gap-2.5">
            {everywhere.map((d) => (
              <DealRow key={d.id} deal={d} cards={data.cards} />
            ))}
          </ul>
        </>
      )}

      <SectionTitle id="faq">Questions and answers</SectionTitle>
      <FaqList items={faq} />

      {related.length > 0 && (
        <>
          <SectionTitle>More {KIND_LABEL[t.kind].toLowerCase()}</SectionTitle>
          <ul className="flex flex-wrap gap-2" data-reveal>
            {related.map((o) => (
              <li key={o.path}>
                <Link href={topicPath(o.kind, o.id)} className="pill">
                  {o.name} <span className="count">{o.deals.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </SiteShell>
  );
}
