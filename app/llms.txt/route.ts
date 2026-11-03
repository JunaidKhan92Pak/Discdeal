import { aboutFaq } from "@/lib/about";
import { allTopics } from "@/lib/deal-pages";
import { formatDate } from "@/lib/format";
import { getPagesData } from "@/lib/server/pages-data";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

/**
 * /llms.txt (llmstxt.org): a short Markdown guide for AI assistants: what the site is, how to link to a search,
 * and where the deal lists are. /llms-full.txt has every live deal as plain text.
 */
export async function GET() {
  const data = await getPagesData();
  const url = siteUrl();
  const topics = allTopics(data);
  const section = (kind: string, title: string) =>
    [`## ${title}`, "", ...topics.filter((t) => t.kind === kind).map((t) => `- [${t.heading}](${url}${t.path}): ${t.deals.length} deals`), ""].join("\n");

  const text = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Updated ${formatDate(data.asOf)}. ${data.deals.length} live offers. Every deal links to the bank's or brand's own page and shows when it was checked; ended deals are removed automatically.`,
    "",
    `To send someone to a search, link to ${url}/?q=<words>, for example ${url}/?q=pizza+in+Lahore or ${url}/?q=kapray+50%25. Search understands English, Roman Urdu and Urdu, cities, categories, "50%", "under 2000" and typos.`,
    "",
    "## Key pages",
    "",
    `- [All deals](${url}/deals): every city, category, bank and brand, and the biggest discounts right now`,
    `- [About and FAQ](${url}/about): how it works and where the data comes from`,
    `- [Every live deal as text](${url}/llms-full.txt)`,
    "",
    section("city", "Deals by city"),
    section("category", "Deals by category"),
    section("bank", "Deals by bank card"),
    "## FAQ",
    "",
    ...aboutFaq(data).flatMap((f) => [`### ${f.question}`, "", f.answer, ""]),
  ].join("\n");

  return new Response(text, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
