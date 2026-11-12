/**
 * WHAT THE DISCOUNT IS ON, IN PLAIN WORDS ("Pizza", "Jeans · T-shirts", "Women's heels"), for deal cards.
 *
 * Built from a deal's `tags`, which are search words ("jeans tshirt western", "women heels"), not display text:
 * pairs are joined back into one item ("fish chips" → "Fish & chips"), who it is for becomes a prefix
 * ("women heels" → "Women's heels"), words the title already says are left out ("Café & bakery bill" + "bakery"),
 * and filler is dropped. A word missing from LABELS still shows, capitalised, so new data is never hidden;
 * add a nicer label here when one reads oddly.
 */

/** Two tag words that name one thing. Checked before single words. */
const PAIRS: Record<string, string> = {
  "street food": "Street food",
  "theme park": "Theme park",
  "fish chips": "Fish & chips",
  "shalwar kameez": "Shalwar kameez",
  "paratha roll": "Paratha rolls",
  "chicken peri": "Peri peri chicken",
  "winter khaddar": "Winter khaddar",
  "revolving buffet": "Revolving buffet",
  "lounge airport": "Airport lounge",
  "hair nails": "Hair & nails",
  "fabric unstitched": "Unstitched fabric",
  "shinwari karahi": "Shinwari karahi",
};

/** Nicer wording for single tag words (plurals, acronyms, "Desi food"). */
const LABELS: Record<string, string> = {
  bbq: "BBQ",
  desi: "Desi food",
  chinese: "Chinese",
  burger: "Burgers",
  steak: "Steaks",
  cake: "Cakes",
  dessert: "Desserts",
  donuts: "Donuts",
  kurta: "Kurtas",
  kurti: "Kurtis",
  western: "Western wear",
  fusion: "Fusion wear",
  tshirt: "T-shirts",
  haircut: "Haircuts",
  kabab: "Kababs",
  sofa: "Sofas",
  juice: "Juices",
  dentist: "Dental care",
  hospital: "Hospital care",
  medicine: "Medicines",
};

/** Who it is for: shown as a prefix on the first item ("Women's heels"), or alone ("For kids"). */
const AUDIENCE: Record<string, { prefix: string; alone: string }> = {
  women: { prefix: "Women's", alone: "For women" },
  men: { prefix: "Men's", alone: "For men" },
  kids: { prefix: "Kids'", alone: "For kids" },
};

/** Search-only words: a brand's own name or vague extras that say nothing on a card. */
const SKIP = new Set(["ideas", "limelite", "luxury", "sale", "deal", "deals", "discount", "offer", "online"]);

const MAX_ITEMS = 3;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Women's" + "Heels" → "Women's heels"; keeps acronyms like "BBQ" as they are. */
const withPrefix = (prefix: string, item: string) => `${prefix} ${item === item.toUpperCase() ? item : item.charAt(0).toLowerCase() + item.slice(1)}`;

/** True when the title already says this item ("Shoes" + "shoes", "Café & bakery bill" + "bakery"). */
function inTitle(tag: string, titleWords: Set<string>): boolean {
  return tag.split(" ").every((w) => titleWords.has(w) || titleWords.has(`${w}s`) || titleWords.has(w.replace(/s$/, "")));
}

/** The deal's items for display, at most three, in the order the data gives them. */
export function displayItems(tags: string[], title: string): string[] {
  const words = tags.map((t) => t.toLowerCase());
  const titleWords = new Set(title.toLowerCase().split(/[^a-z]+/).filter(Boolean));
  const items: string[] = [];
  let audience: (typeof AUDIENCE)[string] | undefined;

  for (let i = 0; i < words.length; i++) {
    const pair = `${words[i]} ${words[i + 1] ?? ""}`;
    if (PAIRS[pair]) {
      if (!inTitle(pair, titleWords) && !inTitle(PAIRS[pair].toLowerCase(), titleWords)) items.push(PAIRS[pair]);
      i++;
      continue;
    }
    const word = words[i];
    if (AUDIENCE[word]) {
      audience ??= AUDIENCE[word];
      continue;
    }
    if (SKIP.has(word) || inTitle(word, titleWords)) continue;
    items.push(LABELS[word] ?? cap(word));
  }

  const unique = [...new Set(items)].slice(0, MAX_ITEMS);
  if (!audience) return unique;
  if (unique.length === 0) return [audience.alone];
  return [withPrefix(audience.prefix, unique[0]), ...unique.slice(1)];
}
