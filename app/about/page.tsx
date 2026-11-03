import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle, SiteShell } from "@/components/site/SiteShell";
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
      <h1 className="text-headline text-ink">About {SITE_NAME}</h1>
      <p className="mt-2 max-w-3xl text-body text-soft">{faq[0].answer}</p>

      <SectionTitle>Questions and answers</SectionTitle>
      <dl className="max-w-3xl space-y-5">
        {faq.slice(1).map((f) => (
          <div key={f.question}>
            <dt className="text-body font-semibold text-ink">{f.question}</dt>
            <dd className="mt-1 text-body text-soft">{f.answer}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 text-body text-soft">
        Updated {formatDate(data.asOf)}.{" "}
        <Link href="/deals" className="font-semibold text-primary hover:underline">
          Browse all deals
        </Link>{" "}
        or{" "}
        <Link href="/" className="font-semibold text-primary hover:underline">
          start searching
        </Link>
        .
      </p>
    </SiteShell>
  );
}
