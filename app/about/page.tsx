import type { Metadata } from "next";
import Link from "next/link";
import { FaqList, PageIntro, SectionTitle, SiteShell } from "@/components/site/SiteShell";
import { Icon } from "@/components/ui/Icon";
import { aboutFaq } from "@/lib/about";
import { formatDate } from "@/lib/format";
import { getPagesData } from "@/lib/server/pages-data";
import { SITE_NAME, jsonLd } from "@/lib/site";
import { breadcrumbList, faqPage, graph } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPagesData();
  const title = `About ${SITE_NAME}: how it works, sources and FAQ`;
  const description = `${SITE_NAME} lists ${data.deals.length} live discounts in Pakistan from banks' and brands' own websites, searchable in English, Roman Urdu and Urdu. How it works, where deals come from, and answers to common questions.`;
  return { title, description, alternates: { canonical: "/about" }, openGraph: { title, description, url: "/about" } };
}

export default async function About() {
  const data = await getPagesData();
  const faq = aboutFaq(data);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "About & FAQ", path: "/about" },
  ];

  return (
    <SiteShell breadcrumbs={crumbs}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph(breadcrumbList(crumbs), faqPage(faq))) }} />
      <PageIntro title={`About ${SITE_NAME}`}>{faq[0].answer}</PageIntro>

      <SectionTitle>Questions and answers</SectionTitle>
      <FaqList items={faq.slice(1)} className="max-w-3xl" />

      <div className="mt-12 flex flex-wrap items-center gap-3" data-reveal>
        <span className="text-body text-soft">Updated {formatDate(data.asOf)}.</span>
        <Link href="/" className="btn-primary">
          <Icon name="search" className="size-5" />
          Start searching
        </Link>
        <Link href="/deals" className="btn-secondary">
          Browse all deals
        </Link>
      </div>
    </SiteShell>
  );
}
