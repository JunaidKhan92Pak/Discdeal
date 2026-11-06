import { CHANNELS, CITIES } from "@/lib/taxonomy";
import type { Card, Channel, CityId, Deal } from "@/lib/types";

const pkr = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  if (value === 0) return "Free";
  return `Rs ${pkr.format(value)}`;
}

function cityLabel(id: CityId): string {
  return CITIES.find((c) => c.id === id)?.label ?? id;
}

/** Short form for cards: "Lahore", "Lahore +2", "Nationwide". `preferred` (the city searched for) is named first. */
export function formatCities(cities: CityId[], preferred: CityId[] = []): string {
  if (cities.length === 0) return "Nationwide";
  const first = cities.find((c) => preferred.includes(c)) ?? cities[0];
  return cities.length === 1 ? cityLabel(first) : `${cityLabel(first)} +${cities.length - 1}`;
}

export function formatCityList(cities: CityId[]): string {
  return cities.length === 0 ? "Nationwide" : cities.map(cityLabel).join(", ");
}

export function formatChannels(channels: Channel[]): string {
  return channels.map((id) => CHANNELS.find((c) => c.id === id)?.label ?? id).join(" · ");
}

/** The deal's headline: its own wording ("Buy 1 Get 1") or the percentage ("30% OFF"). */
export function formatOffer(deal: Pick<Deal, "offer" | "discountPct">): string {
  return deal.offer ?? `${deal.discountPct}% OFF`;
}

/**
 * The headline cut into three for the card's big tag: "Up to 50% OFF" → before "Up to", main "50%", after "OFF".
 * Wording without a percentage ("Free", "Buy 1 Get 1") is all `main`.
 */
export function splitOffer(text: string): { before: string; main: string; after: string } {
  const match = /^(.*?)\s*(\d+(?:\.\d+)?%)\s*(.*)$/.exec(text);
  return match ? { before: match[1], main: match[2], after: match[3] } : { before: "", main: text, after: "" };
}

/** Ends today or tomorrow: worth a warning colour. */
export function isEndingSoon(days: number | null): boolean {
  return days !== null && days <= 1;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-12-31" → "31 Dec 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

/** Short deadline for cards: "Ends tonight", "5 days left", "Until 31 Mar 2027", or "Ongoing" when the source gives no date. */
export function formatEnds(days: number | null, endsAt: string | null = null): string {
  if (days === null) return "Ongoing";
  if (days <= 0) return "Ends tonight";
  if (days === 1) return "Ends tomorrow";
  if (days <= 30 || !endsAt) return `${days} days left`;
  return `Until ${formatDate(endsAt)}`;
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * The deadline as a date, short enough for a card: "Till 9 May", "Ends tonight" / "Ends tomorrow" when it is that
 * close, or "Ongoing" when the source gives no end date. The year is left out within the next 11 months (expired
 * deals are never shown, so "9 May" can only mean the next one); further out it is added: "Till 9 May 2028".
 */
export function formatUntil(days: number | null, endsAt: string | null): string {
  if (days === null) return "Ongoing";
  if (days <= 0) return "Ends tonight";
  if (days === 1) return "Ends tomorrow";
  if (!endsAt) return `${days} days left`;
  return `Till ${days < 330 ? dayMonth.format(new Date(`${endsAt}T00:00:00Z`)) : formatDate(endsAt)}`;
}

/** Which cards a deal needs, short: "HBL Konnect Debit", "AL Habib Signature +1". Mine (`preferred`) first. */
export function formatCards(cardIds: string[], cards: Card[], preferred: string[] = []): string {
  if (cardIds.length === 0) return "";
  const first = cardIds.find((id) => preferred.includes(id)) ?? cardIds[0];
  const name = cards.find((c) => c.id === first)?.short ?? "Bank card";
  return cardIds.length === 1 ? name : `${name} +${cardIds.length - 1}`;
}

export function cardName(id: string, cards: Card[]): string {
  return cards.find((c) => c.id === id)?.name ?? "Bank card";
}
