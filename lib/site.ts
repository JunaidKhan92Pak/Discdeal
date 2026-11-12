/**
 * What the site says about itself to search engines, link previews and AI assistants, in one place.
 * The address is never hard-coded: NEXT_PUBLIC_SITE_URL if set (your own domain), else the production address
 * Vercel gives the project, else localhost while developing.
 */
export const SITE_NAME = "DiscDeal";

/*
 * THE PROMISE, in the same words everywhere (landing page, link previews, search engines, the app, /about, llms.txt):
 *   1. Every discount in one place: brands' own sales AND the offers banks give on their cards.
 *   2. So you no longer check each store's website or each bank's offers page.
 *   3. Pick the cards you have and see what each one gets you.
 */
export const SITE_TAGLINE = "Every brand sale and bank card discount, in one place";

/** One line for tight spots: the app's install prompt, the share image. */
export const SITE_PROMISE = "Every brand sale and bank card discount in Pakistan, in one place.";

export const SITE_DESCRIPTION =
  "DiscDeal brings every discount in Pakistan into one place: brands' own sales and the offers banks give on their " +
  "debit and credit cards, at restaurants, clothing brands, groceries, travel and more. No need to check each store's " +
  "website or your bank's offers page: search once, pick the cards you have, and see what each card gets you. " +
  "In English, Roman Urdu or Urdu.";

/** Words people type when looking for what this site has (English and Roman Urdu). */
export const SITE_KEYWORDS = [
  "discounts in Pakistan",
  "all discounts in one place",
  "deals in Pakistan",
  "bank card discounts",
  "card offers Pakistan",
  "my card discounts",
  "brand sale Pakistan",
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
