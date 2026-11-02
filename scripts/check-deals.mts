/**
 * Checks the spreadsheets without touching any database. Run it after editing them:
 *   npm run data:check                                  (data/cards.csv + data/deals.csv)
 *   npm run data:check -- my-deals.csv                  (another deals file)
 * It lists every row with a problem and what to fix, and counts live and ended deals.
 */
import { readFile } from "node:fs/promises";
import { csvToCards } from "@/lib/cards-csv";
import { csvToDeals, todayInPakistan } from "@/lib/deals-csv";

const dealsFile = process.argv[2] ?? "data/deals.csv";
const cardsFile = "data/cards.csv";
const today = todayInPakistan();

const cards = csvToCards(await readFile(cardsFile, "utf8"));
const deals = csvToDeals(await readFile(dealsFile, "utf8"), today, new Set(cards.cards.map((c) => c.id)));
const problems = [...cards.problems.map((p) => `${cardsFile}, ${p}`), ...deals.problems.map((p) => `${dealsFile}, ${p}`)];

console.log(`\nToday in Pakistan: ${today}`);
console.log(`  banks / cards: ${cards.banks.length} / ${cards.cards.length}  (${cardsFile})`);
console.log(`  live deals:    ${deals.deals.length}  (${dealsFile})`);
console.log(`  ended deals:   ${deals.expired}  (hidden on the website automatically)`);
if (problems.length > 0) {
  console.log(`  problems:      ${problems.length}  (these rows are skipped until fixed)\n`);
  for (const problem of problems) console.log(`  • ${problem}`);
  process.exitCode = 1;
} else {
  console.log("  problems:      none 👍");
}
const soon = deals.deals.filter((d) => d.endsInDays !== null && d.endsInDays <= 7);
if (soon.length > 0) console.log(`\n  Ending within 7 days: ${soon.map((d) => `${d.brand} (${d.endsAt})`).join(", ")}`);
console.log("");
