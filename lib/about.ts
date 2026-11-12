/**
 * What DiscDeal is, in questions and answers. Shown on /about, given to search engines as FAQ data and to AI
 * assistants in /llms.txt, so all three say the same thing. Numbers come from the live data.
 */
import { formatDate } from "@/lib/format";
import { CATEGORIES } from "@/lib/taxonomy";
import type { PagesData } from "@/lib/deal-pages";
import { SITE_NAME } from "@/lib/site";

export function aboutFaq(data: PagesData): { question: string; answer: string }[] {
  const brands = new Set(data.deals.map((d) => d.brandId)).size;
  const cities = new Set(data.deals.flatMap((d) => d.cities)).size;
  const cards = data.cards.map((c) => c.name).join(", ");
  const categories = CATEGORIES.filter((c) => data.deals.some((d) => d.category === c.id)).map((c) => c.label.toLowerCase());
  const noCard = data.deals.filter((d) => d.cards.length === 0).length;

  return [
    {
      question: `What is ${SITE_NAME}?`,
      answer: `${SITE_NAME} is a free website that puts every discount in Pakistan in one place: the sales brands run themselves, and the discounts banks give on their debit and credit cards. As of ${formatDate(data.asOf)} it lists ${data.deals.length} live offers from ${brands} brands in ${cities} cities, on ${categories.join(", ")}.`,
    },
    {
      question: `Why use ${SITE_NAME} instead of checking stores and banks myself?`,
      answer:
        "Because the offers are spread everywhere: each brand announces its sale on its own website, and each bank keeps its card discounts on its own offers page. Finding the best price meant visiting them one by one. " +
        `${SITE_NAME} collects them for you, so one search shows every brand's sale and every card's discount for what you want, with where it works and until when.`,
    },
    {
      question: "What is the difference between a store sale and a bank card offer?",
      answer:
        "A store sale is the brand's own discount: the price is already reduced, and anyone gets it however they pay. A bank card offer is given by a bank: you get it only when you pay with that bank's card. " +
        `On ${SITE_NAME} every deal says which one it is ("By Breakout" or "By HBL") and, for card offers, exactly which card to pay with. When a brand has both, the deal shows the other one too. Whether they combine on one bill is up to the store, so please ask.`,
    },
    {
      question: "How do I see what my own bank card gets me?",
      answer:
        `Tap "My cards" above the results and tick the cards you have. ${SITE_NAME} then shows only the deals your cards get, marked "Your card", so you can see all the benefits of the card in your wallet at once. Only the card's name is saved, on your own phone.`,
    },
    {
      question: `Can I download ${SITE_NAME} as an app?`,
      answer:
        `Yes, free and without an app store. On the start screen tap "Download the app": on Android and in Chrome it installs in one tap; on iPhone, tap Share in Safari, then "Add to Home Screen". It then opens from your home screen like any other app.`,
    },
    {
      question: `How do I search on ${SITE_NAME}?`,
      answer:
        "Type what you want the way you would say it, in English, Roman Urdu or Urdu: \"pizza in Lahore\", \"kapray 50%\", \"burger under 2000\" or \"کراچی میں کھانا\". Search understands cities, categories, discounts, prices, typos and spelling variants, and shows matching deals as you type. You can also tick the bank cards you have to see only the deals they get.",
    },
    {
      question: "Which bank cards are covered?",
      answer: `Currently: ${cards}. Another ${noCard} deals are brands' own sales, open to everyone whatever card or cash you pay with. More banks are being added.`,
    },
    {
      question: "Where do the deals come from, and are they accurate?",
      answer:
        "Only from the banks' and brands' own websites, never from guesses. Every deal links to its source and shows the date it was last checked. When a bank lists two numbers for one shop, the lower one is shown. Deals past their end date are hidden automatically. Offers can still change, so please confirm with the shop before paying.",
    },
    {
      question: `Is ${SITE_NAME} free? Do I need an account?`,
      answer: "Yes, it is free, and searching needs no account. A free account is only needed to save (like) deals so you can find them again on any device.",
    },
    {
      question: `Does ${SITE_NAME} ask for my card number?`,
      answer: "No, never. \"My cards\" only stores the names of the cards you choose, on your own phone. Accounts store your name, city, email and mobile number; passwords are stored only as a secure hash.",
    },
    {
      question: "Can I link to a search?",
      answer: `Yes: add ?q= to the address, for example /?q=pizza+in+Lahore opens that search directly. Browsable lists by city, category, bank and brand are under /deals.`,
    },
  ];
}
