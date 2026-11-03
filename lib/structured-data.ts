/**
 * schema.org data for the readable pages. Search engines use it for rich results; AI assistants read it to quote
 * deals and answers accurately. Everything here repeats what the page shows, nothing more.
 */
import { formatOffer } from "@/lib/format";
import { CITIES } from "@/lib/taxonomy";
import type { Card, Deal } from "@/lib/types";
import { siteUrl } from "@/lib/site";

export function breadcrumbList(crumbs: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${siteUrl()}${c.path}` })),
  };
}

export function faqPage(faq: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

/** The deals on a page as offers: who sells, what, how much off, where, with which card, until when, source. */
export function offerList(name: string, deals: Deal[], cards: Card[]) {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: deals.length,
    itemListElement: deals.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Offer",
        name: `${d.brand}: ${formatOffer(d)} ${d.title}`,
        description: [d.description, d.cards.length ? `Pay with ${d.cards.map((id) => cards.find((c) => c.id === id)?.name ?? id).join(" or ")}.` : "No bank card needed."]
          .filter(Boolean)
          .join(" "),
        url: d.sourceUrl,
        category: d.category,
        seller: { "@type": "Organization", name: d.brand },
        eligibleRegion: d.cities.length
          ? d.cities.map((id) => ({ "@type": "City", name: CITIES.find((c) => c.id === id)?.label ?? id, containedInPlace: { "@type": "Country", name: "Pakistan" } }))
          : { "@type": "Country", name: "Pakistan" },
        ...(d.price !== undefined ? { price: d.price, priceCurrency: "PKR" } : {}),
        ...(d.endsAt ? { validThrough: d.endsAt } : {}),
      },
    })),
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
