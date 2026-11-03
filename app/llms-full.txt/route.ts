import { dealSentence } from "@/lib/deal-pages";
import { formatDate } from "@/lib/format";
import { getPagesData } from "@/lib/server/pages-data";
import { SITE_NAME, siteUrl } from "@/lib/site";
import { CATEGORIES } from "@/lib/taxonomy";

/** /llms-full.txt: every live deal as one plain sentence with its source, grouped by category, for AI assistants. */
export async function GET() {
  const data = await getPagesData();
  const lines = [
    `# ${SITE_NAME}: every live deal in Pakistan`,
    "",
    `Updated ${formatDate(data.asOf)}. ${data.deals.length} deals. Search them at ${siteUrl()}/?q=<words>. Offers can change; each line ends with its source.`,
    "",
  ];
  for (const category of CATEGORIES) {
    const deals = data.deals.filter((d) => d.category === category.id).sort((a, b) => a.brand.localeCompare(b.brand));
    if (deals.length === 0) continue;
    lines.push(`## ${category.label} (${deals.length})`, "");
    for (const d of deals) lines.push(`- ${dealSentence(d, data.cards)} Source: ${d.sourceUrl} (checked ${d.checkedAt})`);
    lines.push("");
  }
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
