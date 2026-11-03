/**
 * What the site says about itself to search engines, link previews and AI assistants, in one place.
 * The address is never hard-coded: NEXT_PUBLIC_SITE_URL if set (your own domain), else the production address
 * Vercel gives the project, else localhost while developing.
 */
export const SITE_NAME = "DiscDeal";

export const SITE_TAGLINE = "Find the deal, skip the full price";

export const SITE_DESCRIPTION =
  "DiscDeal finds discounts and bank-card deals across Pakistan in one search: restaurants, clothing brands, " +
  "groceries, travel and more, in Lahore, Karachi, Islamabad and other cities. Search in English, Roman Urdu or Urdu.";

/** Words people type when looking for what this site has (English and Roman Urdu). */
export const SITE_KEYWORDS = [
  "discounts in Pakistan",
  "deals in Pakistan",
  "bank card discounts",
  "credit card discounts Pakistan",
  "debit card deals",
  "HBL discounts",
  "restaurant deals Lahore",
  "restaurant deals Karachi",
  "clothing sale Pakistan",
  "lawn sale",
  "khana discount",
  "kapray sale",
];

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** A link into the search screen, e.g. searchUrl("pizza in Lahore") → https://…/?q=pizza+in+Lahore */
export function searchUrl(query: string): string {
  return `${siteUrl()}/?${new URLSearchParams({ q: query })}`;
}

/** JSON for a <script type="application/ld+json">, made safe to put inside HTML. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
