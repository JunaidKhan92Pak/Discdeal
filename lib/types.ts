import type { IconName } from "@/components/ui/Icon";

export type CategoryId =
  | "food"
  | "electronics"
  | "fashion"
  | "education"
  | "health-beauty"
  | "travel"
  | "home"
  | "entertainment";

export type Subcategory = {
  /** Globally unique, e.g. "food-pizza". */
  id: string;
  label: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  icon: IconName;
  subcategories: Subcategory[];
};

export type Deal = {
  id: number;
  brand: string;
  title: string;
  description: string;
  category: CategoryId;
  subcategory: string;
  price: number;
  originalPrice: number;
  discountPct: number;
  code?: string;
  endsInDays: number;
  /** Shown as the offer picture when no `image` URL is provided. */
  icon: IconName;
  /** Optional real product/offer image URL. */
  image?: string;
  url: string;
};

export type DealQuery = {
  q: string;
  /** Selected subcategory ids. Empty = no category filter (all deals). */
  subs: string[];
  brand: string | "all";
  /** Only deals with these ids (the user's liked deals). null = no restriction. */
  ids: number[] | null;
};

export type DealsResponse = {
  results: Deal[];
  /** Number of matching deals per subcategory id (ignores the category selection). */
  counts: Record<string, number>;
  /** Brands available inside the current selection. */
  brands: string[];
};
