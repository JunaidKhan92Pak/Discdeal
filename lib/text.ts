/** Text helpers for smart search: splitting, spelling-variant folding and typo distance. Works for English, Roman Urdu and Urdu script. */

/** URL-safe key for a name: "J. (Junaid Jamshed)" → "j-junaid-jamshed", "Toni&Guy" → "toni-guy". */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lower-cased words, numbers and the symbols % and <. Urdu/Arabic digits become 0-9, "2,000" becomes "2000". */
export function tokenize(text: string): string[] {
  return (
    text
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/(\d),(?=\d{3}\b)/g, "$1")
      .toLowerCase()
      .match(/[\p{L}\p{M}\p{N}]+|[%<]/gu) ?? []
  );
}

/**
 * Collapses spelling variants to one form so they compare equal:
 * café → cafe, khaana → khana, kapray/kaprey → kapre, shoes → shoe, ي → ی.
 * Used on both the query and the dictionary, so it only has to be consistent, not pretty.
 */
export function fold(word: string): string {
  let w = word
    .normalize("NFKD")
    .replace(/[̀-ͯؐ-ًؚ-ٰٟ]/g, "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ةۃ]/g, "ہ");

  if (/^[a-z]+$/.test(w)) {
    if (w.length > 3 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
    w = w.replace(/(.)\1+/g, "$1");
    w = w.replace(/(ay|ey|ae|ai)$/, "e");
  } else {
    w = w.replace(/(.)\1+/gu, "$1");
  }
  return w;
}

/** How many typos a word of this length may contain and still match. Short words must be exact. */
export function maxTypos(word: string): number {
  if (word.length <= 4) return 0;
  if (word.length <= 7) return 1;
  return 2;
}

/** Edit distance counting swaps of neighbours as one typo ("lhaore" → "lahore" = 1). Stops early past `limit`. */
export function distance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let before: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      let value = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, before[j - 2] + 1);
      cur[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > limit) return limit + 1;
    before = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** Closest candidate within the typo budget; the word being typed (last one) may also be a prefix ("laho" → "lahore"). */
export function closest(word: string, candidates: Iterable<string>, allowPrefix: boolean): string | null {
  const limit = maxTypos(word);
  let best: string | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    if (candidate.includes(" ")) continue;
    let score = Infinity;
    if (allowPrefix && word.length >= 3 && candidate.length > word.length && candidate.startsWith(word)) {
      score = 0.5 + candidate.length / 100;
    } else if (limit > 0) {
      const d = distance(word, candidate, limit);
      if (d <= limit) score = d;
    }
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}
