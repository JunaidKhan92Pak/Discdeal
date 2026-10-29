import { CHANNELS, CITIES } from "@/lib/taxonomy";
import type { Channel, CityId, Deal } from "@/lib/types";

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

/** Ends today or tomorrow: worth a warning colour. */
export function isEndingSoon(days: number): boolean {
  return days <= 1;
}

export function formatEnds(days: number): string {
  if (days <= 0) return "Ends tonight";
  if (days === 1) return "Ends tomorrow";
  return `${days} days left`;
}
