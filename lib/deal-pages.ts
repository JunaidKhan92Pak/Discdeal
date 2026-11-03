/**
 * The browsable deal pages (/deals/city/lahore, /deals/brand/khaadi …) that search engines and AI assistants read.
 * Pure functions over the live catalogue: which pages exist, which deals each shows, and the questions and answers
 * each page states (written from the data, so every number is current). Used by the pages, sitemap and llms.txt.
 */
import { formatDate, formatOffer } from "@/lib/format";
import { CATEGORIES, CITIES } from "@/lib/taxonomy";
import type { Bank, Card, CityId, Deal } from "@/lib/types";

export type PagesData = { deals: Deal[]; banks: Bank[]; cards: Card[]; asOf: string };

export const TOPIC_KINDS = ["city", "category", "brand", "bank"] as const;
export type TopicKind = (typeof TOPIC_KINDS)[number];

export type Topic = {
  kind: TopicKind;
  id: string;
  /** "Lahore", "Food & Restaurants", "Khaadi", "HBL" */
  name: string;
  /** H1 and <title>: "Discounts and deals in Lahore" */
  heading: string;
  path: string;
  deals: Deal[];
  /** City pages: deals that are only nationwide (shown after the city's own). */
  nationwide?: number;
};

export const topicPath = (kind: TopicKind, id: string) => `/deals/${kind}/${id}`;

const cityName = (id: string) => CITIES.find((c) => c.id === id)?.label ?? id;
const byDiscount = (a: Deal, b: Deal) => b.discountPct - a.discountPct || a.brand.localeCompare(b.brand);

/** Every page worth having (at least one deal), in a stable order. */
export function allTopics(data: PagesData): Topic[] {
  return [
    ...CITIES.map((c) => topic(data, "city", c.id)),
    ...CATEGORIES.map((c) => topic(data, "category", c.id)),
    ...data.banks.map((b) => topic(data, "bank", b.id)),
    ...brands(data).map((b) => topic(data, "brand", b.id)),
  ].filter((t): t is Topic => t !== null && t.deals.length > 0 && (t.kind !== "city" || t.deals.length > (t.nationwide ?? 0)));
}

export function brands(data: PagesData): { id: string; name: string; count: number }[] {
  const seen = new Map<string, { id: string; name: string; count: number }>();
  for (const d of data.deals) {
    const entry = seen.get(d.brandId) ?? { id: d.brandId, name: d.brand, count: 0 };
    entry.count++;
    seen.set(d.brandId, entry);
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function topic(data: PagesData, kind: string, id: string): Topic | null {
  const bankOfCard = new Map(data.cards.map((c) => [c.id, c.bank]));
  switch (kind) {
    case "city": {
      if (!CITIES.some((c) => c.id === id)) return null;
      const local = data.deals.filter((d) => d.cities.includes(id as CityId)).sort(byDiscount);
      const everywhere = data.deals.filter((d) => d.cities.length === 0).sort(byDiscount);
      const name = cityName(id);
      return { kind, id, name, heading: `Discounts and deals in ${name}`, path: topicPath(kind, id), deals: [...local, ...everywhere], nationwide: everywhere.length };
    }
    case "category": {
      const category = CATEGORIES.find((c) => c.id === id);
      if (!category) return null;
      return { kind, id, name: category.label, heading: `${category.label} discounts in Pakistan`, path: topicPath(kind, id), deals: data.deals.filter((d) => d.category === id).sort(byDiscount) };
    }
    case "bank": {
      const bank = data.banks.find((b) => b.id === id);
      if (!bank) return null;
      const deals = data.deals.filter((d) => d.cards.some((c) => bankOfCard.get(c) === id)).sort(byDiscount);
      return { kind, id, name: bank.short, heading: `${bank.name} card discounts`, path: topicPath(kind, id), deals };
    }
    case "brand": {
      const deals = data.deals.filter((d) => d.brandId === id).sort(byDiscount);
      if (deals.length === 0) return null;
      return { kind, id, name: deals[0].brand, heading: `${deals[0].brand} discounts and deals`, path: topicPath(kind, id), deals };
    }
    default:
      return null;
  }
}

/* ---------------- plain-language summaries ---------------- */

/** The biggest saving a deal states: 70 for "Up to 70% OFF" (discount_pct holds the minimum), else discountPct. */
export function headlinePct(d: Deal): number {
  const upTo = /(\d{1,3})\s*%/.exec(d.offer ?? "");
  return Math.max(d.discountPct, upTo ? Number(upTo[1]) : 0);
}

/** "12 current deals, up to 70% off" */
export function topicSummary(t: Topic): string {
  const top = Math.max(0, ...t.deals.map(headlinePct));
  return `${t.deals.length} current ${t.deals.length === 1 ? "deal" : "deals"}${top ? `, up to ${top}% off` : ""}`;
}

const offerOf = (d: Deal) => formatOffer(d).replace(/ OFF$/i, " off");
const where = (d: Deal) => (d.cities.length === 0 ? "nationwide" : d.cities.length <= 3 ? `in ${d.cities.map(cityName).join(", ")}` : `in ${d.cities.length} cities`);
const forCards = (d: Deal, cards: Card[]) =>
  d.cards.length === 0 ? "no bank card needed" : `with ${d.cards.map((id) => cards.find((c) => c.id === id)?.short ?? id).join(" or ")}`;

/** One deal as a sentence: "Khaadi: up to 50% off pret & unstitched sale, nationwide, no bank card needed." */
export function dealSentence(d: Deal, cards: Card[]): string {
  return `${d.brand}: ${offerOf(d)} ${d.title.charAt(0).toLowerCase()}${d.title.slice(1)}, ${where(d)}, ${forCards(d, cards)}${d.endsAt ? `, until ${formatDate(d.endsAt)}` : ""}.`;
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function countBy(values: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

/** Questions people (and AI assistants) ask about this page's subject, answered from the current data. */
export function topicFaq(t: Topic, data: PagesData): { question: string; answer: string }[] {
  const asOf = formatDate(data.asOf);
  const top = t.deals.slice(0, 5);
  const topText = list(top.map((d) => `${d.brand} (${offerOf(d)})`));
  const bankOfCard = new Map(data.cards.map((c) => [c.id, c.bank]));
  const bankNames = (deals: Deal[]) =>
    countBy(deals.flatMap((d) => [...new Set(d.cards.map((c) => bankOfCard.get(c) ?? ""))].filter(Boolean))).map(([id, n]) => `${data.banks.find((b) => b.id === id)?.short ?? id} (${n})`);
  const noCard = t.deals.filter((d) => d.cards.length === 0).length;
  const faq: { question: string; answer: string }[] = [];

  if (t.kind === "city") {
    const local = t.deals.length - (t.nationwide ?? 0);
    faq.push({
      question: `What are the best discounts in ${t.name} right now?`,
      answer: `As of ${asOf}, DiscDeal lists ${local} deals at shops in ${t.name}, plus ${t.nationwide ?? 0} that work nationwide. The biggest are ${topText}.`,
    });
    const categories = countBy(t.deals.slice(0, local).map((d) => CATEGORIES.find((c) => c.id === d.category)?.label ?? d.category)).slice(0, 4);
    if (categories.length) faq.push({ question: `What kind of deals are there in ${t.name}?`, answer: `Mostly ${list(categories.map(([name, n]) => `${name.toLowerCase()} (${n})`))}.` });
  }
  if (t.kind === "category") {
    faq.push({ question: `Which ${t.name.toLowerCase()} brands have the biggest discounts in Pakistan?`, answer: `As of ${asOf}: ${topText}. DiscDeal lists ${t.deals.length} ${t.name.toLowerCase()} deals in total.` });
    const cities = countBy(t.deals.flatMap((d) => d.cities)).slice(0, 5);
    if (cities.length) faq.push({ question: `Which cities have the most ${t.name.toLowerCase()} deals?`, answer: `${list(cities.map(([id, n]) => `${cityName(id)} (${n})`))}${noCard ? `, and ${noCard} deals work nationwide or online` : ""}.` });
  }
  if (t.kind === "brand") {
    faq.push({ question: `Does ${t.name} have a discount right now?`, answer: `Yes. As of ${asOf}: ${t.deals.map((d) => dealSentence(d, data.cards).replace(`${d.brand}: `, "")).join(" ")}` });
  }
  if (t.kind === "bank") {
    const cards = data.cards.filter((c) => c.bank === t.id).map((c) => c.name);
    faq.push({ question: `What discounts do ${t.name} cards give?`, answer: `As of ${asOf}, ${t.deals.length} discounts with ${list(cards)}. The biggest are ${topText}.` });
    const cities = countBy(t.deals.flatMap((d) => d.cities)).slice(0, 5);
    if (cities.length) faq.push({ question: `In which cities can I use ${t.name} card discounts?`, answer: `Most offers are in ${list(cities.map(([id, n]) => `${cityName(id)} (${n})`))}.` });
  }
  if (t.kind !== "bank") {
    const banks = bankNames(t.deals);
    faq.push({
      question: t.kind === "brand" ? `Do I need a bank card for the ${t.name} discount?` : `Do I need a bank card for these deals?`,
      answer:
        noCard === t.deals.length
          ? "No. These are open to everyone."
          : `${noCard ? `${noCard} of them need no card. ` : ""}The others are for cardholders of ${list(banks)}${banks.length ? "" : "certain banks"}. Each deal on this page names the card.`,
    });
  }
  faq.push({
    question: "How current is this information?",
    answer: `Every deal links to the bank's or brand's own page and shows when it was last checked. Ended deals are removed automatically. This page was updated on ${asOf}; offers can change, so please confirm with the shop.`,
  });
  return faq;
}
