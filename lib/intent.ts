/**
 * Smart search, step 1: turn free text ("kapry lhaore 30% off", "کراچی میں پیزا", "pizza under 2k")
 * into structured filters plus leftover words. Pure function, no I/O.
 */
import type { IconName } from "@/components/ui/Icon";
import { CATEGORIES, CHANNELS, CITIES } from "@/lib/taxonomy";
import { LEXICON, type Concept } from "@/lib/lexicon";
import { closest, fold, tokenize } from "@/lib/text";
import type { CategoryId, Channel, CityId, IntentPart } from "@/lib/types";

export type SearchIntent = {
  cities: CityId[];
  categories: CategoryId[];
  subs: string[];
  channels: Channel[];
  minDiscount: number | null;
  maxPrice: number | null;
  endingSoon: boolean;
  /** Leftover words (folded, typo-corrected) that must appear in the deal text: brands, dishes, products. */
  terms: string[];
  /** Folded category words ("pizza", "lawn"): not required, but deals that mention them rank first. */
  boost: string[];
  parts: IntentPart[];
};

const priceFormat = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

function readNumber(token: string): number | null {
  const match = /^(\d+)(k)?$/.exec(token);
  if (!match) return null;
  return Number(match[1]) * (match[2] ? 1000 : 1);
}

/**
 * @param vocab every folded word that appears in the deals → how to display it. Used to correct typos in
 *              brand and product names ("khadi" → Khaadi, "burgr" → burger).
 */
export function parseIntent(query: string, vocab: Map<string, string>): SearchIntent {
  const raw = tokenize(query);
  const folded = raw.map(fold);
  const intent: SearchIntent = {
    cities: [], categories: [], subs: [], channels: [],
    minDiscount: null, maxPrice: null, endingSoon: false, terms: [], boost: [], parts: [],
  };
  const parts = new Map<string, IntentPart>();

  function addPart(part: Omit<IntentPart, "words">, words: string[]) {
    const existing = parts.get(part.key);
    if (existing) existing.words.push(...words);
    else parts.set(part.key, { ...part, words: [...words] });
  }

  function setDiscount(value: number, words: string[]) {
    intent.minDiscount = Math.min(value, 95);
    parts.delete("discount");
    addPart({ key: "discount", kind: "discount", label: `${intent.minDiscount}%+ off`, icon: "sparkles" }, words);
  }

  function setPrice(value: number, words: string[]) {
    intent.maxPrice = value;
    parts.delete("price");
    addPart({ key: "price", kind: "price", label: `Under Rs ${priceFormat.format(value)}`, icon: "tag" }, words);
  }

  function apply(concept: Concept, words: string[], word: string, typed?: string) {
    switch (concept.kind) {
      case "city": {
        if (!intent.cities.includes(concept.id)) intent.cities.push(concept.id);
        const label = CITIES.find((c) => c.id === concept.id)?.label ?? concept.id;
        addPart({ key: `city:${concept.id}`, kind: "city", label, icon: "pin", typed }, words);
        break;
      }
      case "category": {
        if (!intent.categories.includes(concept.id)) intent.categories.push(concept.id);
        const category = CATEGORIES.find((c) => c.id === concept.id);
        addPart({ key: `cat:${concept.id}`, kind: "category", label: category?.label ?? concept.id, icon: category?.icon ?? "tag", typed }, words);
        break;
      }
      case "sub": {
        if (!intent.subs.includes(concept.id)) intent.subs.push(concept.id);
        intent.boost.push(word);
        const category = CATEGORIES.find((c) => c.subcategories.some((s) => s.id === concept.id));
        // Show the user's own word ("Pizza", "پیزا"); a corrected typo shows the subcategory name instead.
        const spoken = words.join(" ");
        const label = typed
          ? (category?.subcategories.find((s) => s.id === concept.id)?.label ?? concept.id)
          : spoken.charAt(0).toUpperCase() + spoken.slice(1);
        addPart({ key: `sub:${concept.id}`, kind: "category", label, icon: category?.icon ?? "tag", typed }, words);
        break;
      }
      case "channel": {
        if (!intent.channels.includes(concept.id)) intent.channels.push(concept.id);
        const label = CHANNELS.find((c) => c.id === concept.id)?.label ?? concept.id;
        const icon: IconName = concept.id === "delivery" ? "car" : concept.id === "online" ? "laptop" : "tag";
        addPart({ key: `channel:${concept.id}`, kind: "channel", label, icon, typed }, words);
        break;
      }
      case "ending":
        intent.endingSoon = true;
        addPart({ key: "ending", kind: "ending", label: "Ending soon", icon: "watch", typed }, words);
        break;
      case "half":
        setDiscount(50, words);
        break;
      // "%", "tak" … on their own, and filler words, mean nothing.
      default:
        break;
    }
  }

  let pricePrefix: string[] | null = null;

  for (let i = 0; i < raw.length; i++) {
    const isLast = i === raw.length - 1;

    // Numbers: "30%", "30 percent", "under 2000", "2k tak", "2000 se kam"; a bare number guesses by size.
    const value = readNumber(raw[i]);
    if (value !== null) {
      const next = folded[i + 1];
      const nextPhrase = i + 2 < raw.length ? `${next} ${folded[i + 2]}` : "";
      if (next !== undefined && (LEXICON.get(next)?.kind === "percent" || next === "off")) {
        setDiscount(value, [raw[i], raw[i + 1]]);
        i++;
      } else if (pricePrefix) {
        setPrice(value, [...pricePrefix, raw[i]]);
      } else if (nextPhrase && LEXICON.get(nextPhrase)?.kind === "price-after") {
        setPrice(value, [raw[i], raw[i + 1], raw[i + 2]]);
        i += 2;
      } else if (next !== undefined && LEXICON.get(next)?.kind === "price-after") {
        setPrice(value, [raw[i], raw[i + 1]]);
        i++;
      } else if (value >= 100) {
        setPrice(value, [raw[i]]);
      } else if (value > 0 && value <= 95) {
        setDiscount(value, [raw[i]]);
      }
      pricePrefix = null;
      continue;
    }

    // Two-word phrases first ("fast food", "home delivery", "اسلام آباد"), then single words.
    if (i + 1 < raw.length) {
      const phrase = LEXICON.get(`${folded[i]} ${folded[i + 1]}`);
      if (phrase) {
        pricePrefix = phrase.kind === "price-before" ? [raw[i], raw[i + 1]] : null;
        apply(phrase, [raw[i], raw[i + 1]], `${folded[i]} ${folded[i + 1]}`);
        i++;
        continue;
      }
    }

    let word = folded[i];
    let concept = LEXICON.get(word);
    let typed: string | undefined;

    // A known brand/product word is never "corrected" into a category.
    if (!concept && !vocab.has(word)) {
      const near = closest(word, LEXICON.keys(), isLast);
      if (near) {
        concept = LEXICON.get(near);
        typed = raw[i];
        word = near;
      }
    }

    if (concept) {
      pricePrefix = concept.kind === "price-before" ? [raw[i]] : null;
      apply(concept, [raw[i]], word, typed);
      continue;
    }
    pricePrefix = null;

    // Leftover word: a brand, dish or product. Correct it against the words that exist in the deals.
    const corrected = vocab.has(word) ? word : closest(word, vocab.keys(), isLast);
    const term = corrected ?? word;
    if (!intent.terms.includes(term)) intent.terms.push(term);
    const display = corrected ? (vocab.get(corrected) ?? corrected) : raw[i];
    addPart(
      { key: `term:${term}`, kind: "term", label: `“${display}”`, icon: "search", typed: corrected && corrected !== word ? raw[i] : undefined },
      [raw[i]],
    );
  }

  intent.parts = [...parts.values()];
  return intent;
}

/** Removes the words behind one chip from the query text, e.g. dropping "lahore" from "kapray lahore 30%". */
export function removeWords(query: string, words: string[]): string {
  const left = [...words];
  return query
    .split(/\s+/)
    .filter((chunk) => {
      const tokens = tokenize(chunk);
      if (tokens.length === 0 || !tokens.every((t) => left.includes(t))) return true;
      for (const t of tokens) left.splice(left.indexOf(t), 1);
      return false;
    })
    .join(" ");
}
