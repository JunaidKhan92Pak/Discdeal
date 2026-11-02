import type { IconName } from "@/components/ui/Icon";

export type CategoryId =
  | "food"
  | "fashion"
  | "electronics"
  | "health-beauty"
  | "grocery"
  | "travel"
  | "home"
  | "entertainment";

export type CityId =
  | "lahore"
  | "karachi"
  | "islamabad"
  | "rawalpindi"
  | "faisalabad"
  | "multan"
  | "hyderabad"
  | "sialkot"
  | "gujranwala"
  | "peshawar"
  | "quetta"
  | "sahiwal"
  | "bahawalpur"
  | "sargodha";

/** Banks and cards are data (data/cards.csv or the `cards` table), not code: ids like "hbl", "hbl-konnect-debit". */
export type BankId = string;

export type Bank = {
  id: BankId;
  name: string;
  short: string;
  /** Words people type for this bank ("hbl", "habib bank", "konnect", Urdu…): smart search learns them. */
  aliases: string[];
};

/** One card product a deal can need, e.g. "HBL Konnect Debit Card". */
export type Card = { id: string; bank: BankId; name: string; /** For deal cards: "HBL Konnect Debit" */ short: string };

/** Live numbers about the data, for honest copy ("146 discounts …"). */
export type CatalogStats = { deals: number; brands: number; cities: number; banks: number; cards: number };

/** Everything the browser needs besides deals: banks and cards, live stats, and example searches that match the data. */
export type CatalogMeta = { banks: Bank[]; cards: Card[]; stats: CatalogStats; suggestions: string[] };

/** How the deal is redeemed. */
export type Channel = "in-store" | "delivery" | "online";

export type City = { id: CityId; label: string };

export type Subcategory = {
  /** Globally unique, e.g. "food-fastfood". */
  id: string;
  label: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  /** One word for chips: "Food", "Fashion" … */
  short: string;
  icon: IconName;
  subcategories: Subcategory[];
};

export type Deal = {
  id: number;
  brand: string;
  /** URL-safe brand key, e.g. "khaadi", "j-junaid-jamshed". One brand can have deals in many categories. */
  brandId: string;
  /** What you get, without the discount: "Unstitched lawn, 3-piece" (the discount is shown on its own). */
  title: string;
  /** Headline when the deal is not a plain percentage: "Buy 1 Get 1", "Free", "Up to 50% OFF". Otherwise "{discountPct}% OFF". */
  offer?: string;
  description: string;
  category: CategoryId;
  subcategory: string;
  /** Prices in PKR, when the offer has fixed prices (bank card discounts usually do not). */
  price?: number;
  originalPrice?: number;
  /** 0 when the offer is not a percentage (then `offer` says what it is, e.g. "Free"). */
  discountPct: number;
  code?: string;
  /** Last day of the offer (YYYY-MM-DD, Pakistan time), or null when the source gives no end date. */
  endsAt: string | null;
  /** Days left, worked out on the server when the data is loaded; null = ongoing. Expired deals are never sent. */
  endsInDays: number | null;
  /** Cards that get this deal (Card ids). Empty = no card needed. */
  cards: string[];
  /** Cities with a branch that honours the deal. Empty = nationwide. */
  cities: CityId[];
  channels: Channel[];
  /** Extra search words (dishes, products …) that are not in the title. */
  tags: string[];
  /** Shown as the offer picture when no `image` URL is provided. */
  icon: IconName;
  /** Optional real product/offer image URL. */
  image?: string;
  /** Where the offer was found (the bank's or brand's own page). Shown as the source, and the "view offer" link. */
  sourceUrl: string;
  /** When someone last checked the source (YYYY-MM-DD). */
  checkedAt: string;
};

export type SortKey = "relevance" | "discount" | "ending" | "price";

/** Everything the deals API accepts. Built by the browser (lib/query.ts), validated again on the server. */
export type DealQuery = {
  q: string;
  /** The user's saved city. A city named in `q` takes priority. null = all of Pakistan. */
  city: CityId | null;
  category: CategoryId | null;
  /** A subcategory of `category`. */
  sub: string | null;
  sort: SortKey;
  /** Only this brand (a Deal.brandId). null = every brand. */
  brand: string | null;
  /** Only deals these cards get (Card ids; the user's "My cards"). null = no restriction. */
  cards: string[] | null;
  /** Only deals with these ids (the user's liked deals). null = no restriction. */
  ids: number[] | null;
  offset: number;
  limit: number;
};

/** A brand that has deals in the current results, with how many. */
export type BrandFacet = { id: string; name: string; count: number };

/** One thing smart search understood from the query, shown as a removable chip. */
export type IntentPart = {
  key: string;
  kind: "city" | "category" | "channel" | "bank" | "discount" | "price" | "ending" | "term";
  label: string;
  icon: IconName;
  /** The query words this part came from (removing the chip removes them). */
  words: string[];
  /** What the user actually typed, when it was a typo we corrected. */
  typed?: string;
};

/** One page of results plus what is needed to draw the filters around it. */
export type DealsPage = {
  results: Deal[];
  /** Matches for the whole query (all pages), after the category and liked filters. */
  total: number;
  /** Pass as `offset` to get the next page; null when this is the last page. */
  nextOffset: number | null;
  /**
   * Faceted counts: each filter is counted with every OTHER filter applied, so the two directions work:
   * pick a brand → categories show only that brand's; pick a category → brands show only that category's.
   */
  /** Matches per category id and subcategory id: all filters except the category itself (brand included). */
  categoryCounts: Record<string, number>;
  subCounts: Record<string, number>;
  /** The number on the "All" chip: all filters except the category. */
  allCount: number;
  /** Brands with matches, A–Z: all filters except the brand itself (category included). */
  brands: BrandFacet[];
  intent: {
    parts: IntentPart[];
    /** Set when filters had to be relaxed to find anything, e.g. "No deals in Multan yet …". */
    notice: string | null;
  };
};
