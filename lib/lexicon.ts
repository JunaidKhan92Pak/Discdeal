/**
 * The smart-search dictionary: words people type, in English, Roman Urdu and Urdu script, mapped to what they mean.
 * Add synonyms here, "|"-separated; a two-word phrase is written with a space ("fast food").
 * Common misspellings can be added too, though the typo matcher already handles most of them.
 */
import { fold } from "@/lib/text";
import type { Bank, BankId, CategoryId, Channel, CityId } from "@/lib/types";

export type Concept =
  | { kind: "city"; id: CityId }
  | { kind: "category"; id: CategoryId }
  | { kind: "sub"; id: string }
  | { kind: "channel"; id: Channel }
  /** A bank: only deals for that bank's cards. Its words come from the data (Bank.aliases), see bankLexicon(). */
  | { kind: "bank"; id: BankId }
  | { kind: "ending" }
  | { kind: "half" }
  /** "under", "below", "<" … followed by a price */
  | { kind: "price-before" }
  /** "tak", "se kam" … after a price */
  | { kind: "price-after" }
  /** "%", "percent", "fisad" after a number */
  | { kind: "percent" }
  /** Filler words: "in", "mein", "discount", "deals", "میں" … */
  | { kind: "stop" };

const ENTRIES: [Concept, string][] = [
  // Cities
  [{ kind: "city", id: "lahore" }, "lahore|lhr|lahor|lahour|لاہور|لاهور"],
  [{ kind: "city", id: "karachi" }, "karachi|khi|karchi|krachi|کراچی"],
  [{ kind: "city", id: "islamabad" }, "islamabad|isb|islambad|isloo|اسلام آباد"],
  [{ kind: "city", id: "rawalpindi" }, "rawalpindi|pindi|rwp|rawal pindi|راولپنڈی|پنڈی"],
  [{ kind: "city", id: "faisalabad" }, "faisalabad|fsd|faislabad|lyallpur|فیصل آباد"],
  [{ kind: "city", id: "multan" }, "multan|ملتان"],
  [{ kind: "city", id: "hyderabad" }, "hyderabad|hyd|hydrabad|حیدرآباد|حیدر آباد"],
  [{ kind: "city", id: "sialkot" }, "sialkot|skt|سیالکوٹ"],
  [{ kind: "city", id: "gujranwala" }, "gujranwala|grw|گوجرانوالہ"],
  [{ kind: "city", id: "peshawar" }, "peshawar|pesh|pishawar|پشاور"],
  [{ kind: "city", id: "quetta" }, "quetta|کوئٹہ"],
  [{ kind: "city", id: "sahiwal" }, "sahiwal|ساہیوال"],
  [{ kind: "city", id: "bahawalpur" }, "bahawalpur|bwp|بہاولپور"],
  [{ kind: "city", id: "sargodha" }, "sargodha|سرگودھا"],


  // Food
  [{ kind: "category", id: "food" }, "food|khana|khane|khanay|eat|eating|dinner|lunch|breakfast|nashta|meal|کھانا|کھانے|کھانا پینا"],
  [{ kind: "sub", id: "food-restaurants" }, "restaurant|dine|dining|dine in|desi|karahi|biryani|bbq|tikka|kabab|kebab|pulao|nihari|haleem|handi|buffet|ریسٹورنٹ|بریانی|کڑاہی"],
  [{ kind: "sub", id: "food-fastfood" }, "pizza|burger|fries|wings|fast food|fastfood|shawarma|zinger|sandwich|broast|پیزا|برگر"],
  [{ kind: "sub", id: "food-cafes" }, "coffee|cafe|chai|tea|cake|bakery|bakers|dessert|ice cream|icecream|mithai|sweets|چائے|کافی|کیک|مٹھائی"],

  // Fashion
  [{ kind: "category", id: "fashion" }, "fashion|cloth|clothes|clothing|kapra|kapre|kapray|kapde|kapry|libas|dress|wear|outfit|garments|apparel|کپڑے|کپڑا|لباس|فیشن"],
  [{ kind: "sub", id: "fashion-clothing" }, "lawn|suit|shalwar|kameez|kurta|kurti|unstitched|stitched|shirt|tshirt|jeans|denim|shawl|abaya|dupatta|لان|سوٹ|کرتا|قمیض"],
  [{ kind: "sub", id: "fashion-shoes" }, "shoe|joota|joote|jootay|juta|jutay|jute|sneakers|chappal|sandal|heels|bag|handbag|جوتے|جوتا"],
  [{ kind: "sub", id: "fashion-accessories" }, "watch|ghari|gharri|wallet|belt|jewellery|jewelry|jewelers|jewellers|gold|zewar|sunglasses|accessories|گھڑی|زیور"],

  // Electronics
  [{ kind: "category", id: "electronics" }, "electronics|electronic|gadget|الیکٹرانکس"],
  [{ kind: "sub", id: "electronics-mobiles" }, "mobile|phone|smartphone|iphone|android|tablet|fon|موبائل|فون"],
  [{ kind: "sub", id: "electronics-appliances" }, "ac|acs|air conditioner|fridge|refrigerator|washing machine|tv|led|lcd|microwave|oven|appliance|inverter|freezer|اے سی|فریج"],
  [{ kind: "sub", id: "electronics-laptops" }, "laptop|computer|pc|keyboard|mouse|headphones|earbuds|لیپ ٹاپ"],

  // Health & beauty
  [{ kind: "category", id: "health-beauty" }, "beauty|health|wellness|sehat|خوبصورتی|صحت"],
  [{ kind: "sub", id: "health-salon" }, "salon|saloon|parlour|parlor|spa|haircut|hair|facial|bridal|massage|waxing|manicure|پارلر|سیلون"],
  [{ kind: "sub", id: "health-skincare" }, "skincare|skin|cosmetics|makeup|make up|lipstick|serum|cream|perfume|fragrance|خوشبو|میک اپ"],
  [{ kind: "sub", id: "health-pharmacy" }, "pharmacy|medicine|medicines|dawai|dawa|meds|vitamins|chemist|دوائی|دوا|فارمیسی"],

  // Grocery
  [{ kind: "category", id: "grocery" }, "grocery|groceries|ration|sauda|kiryana|kirana|mart|سودا|راشن|گروسری"],
  [{ kind: "sub", id: "grocery-supermarkets" }, "supermarket|superstore|fruit|fruits|vegetables|sabzi|phal|atta|سبزی|پھل"],
  [{ kind: "sub", id: "grocery-online" }, "pandamart|online grocery"],

  // Travel
  [{ kind: "category", id: "travel" }, "travel|trip|tour|safar|vacation|holiday|سفر"],
  [{ kind: "sub", id: "travel-hotels" }, "hotel|stay|room|resort|guest house|ہوٹل"],
  [{ kind: "sub", id: "travel-flights" }, "flight|airline|plane|fly|jahaz|umrah|hunza|skardu|naran|northern areas|فلائٹ"],
  [{ kind: "sub", id: "travel-lounges" }, "lounge|lounges|airport|airport lounge|ایئرپورٹ"],
  [{ kind: "sub", id: "travel-rides" }, "ride|cab|taxi|car rental|rent a car|rickshaw"],

  // Home
  [{ kind: "category", id: "home" }, "home|ghar|house|living|گھر"],
  [{ kind: "sub", id: "home-furniture" }, "furniture|sofa|bed|chair|table|almari|wardrobe|فرنیچر|صوفہ"],
  [{ kind: "sub", id: "home-decor" }, "decor|bedding|bedsheet|curtains|parde|parday|cushions|چادر|پردے"],

  // Entertainment
  [{ kind: "category", id: "entertainment" }, "entertainment|fun|masti|tafreeh|تفریح"],
  [{ kind: "sub", id: "entertainment-cinema" }, "cinema|movie|film|filmein|سینما|فلم"],
  [{ kind: "sub", id: "entertainment-play" }, "play|games|gaming|bowling|theme park|kids|sports|arena|khel|کھیل"],
  [{ kind: "sub", id: "entertainment-books" }, "book|books|bookshop|bookstore|kitab|kitaben|کتاب|کتابیں"],
  [{ kind: "sub", id: "entertainment-streaming" }, "streaming|drama|music|songs|gaane|gane|ڈرامہ|گانے"],

  // How the deal is used
  [{ kind: "channel", id: "delivery" }, "delivery|deliver|home delivery|ghar pe|ghar par|ghar tak|ڈیلیوری"],
  [{ kind: "channel", id: "online" }, "online|website|app|ecommerce|e commerce|آن لائن|آنلائن"],
  [{ kind: "channel", id: "in-store" }, "in store|instore|store|shop|outlet|branch|dukaan|dukan|دکان"],

  // Time, discount and price words
  [{ kind: "ending" }, "today|tonight|aaj|abhi|ending|expiring|last day|akhri|آج"],
  [{ kind: "half" }, "half|aadha|adha|آدھا|آدھی"],
  [{ kind: "price-before" }, "under|below|less than|upto|up to|max|within|<|budget"],
  [{ kind: "price-after" }, "tak|se kam|ke andar|or less|se neeche|تک|سے کم"],
  [{ kind: "percent" }, "%|percent|pct|fisad|فیصد"],

  // Filler words that carry no meaning for the search
  [
    { kind: "stop" },
    "in|at|on|for|the|a|an|of|near|me|my|best|top|all|show|find|get|any|with|and|or|to|from|is|are|i|some|good|nearby|around|latest|new|please|want|need|cheap|price|prices|rs|pkr|rupees|pakistan|pk" +
      "|deal|deals|discount|discounts|offer|offers|sale|sales|off|promo|promotion|coupon|code|voucher|savings" +
      "|bank|card|cards|credit|debit|visa|mastercard|paypak|platinum|signature|کارڈ|بینک" +
      "|mein|main|mai|ka|ki|ke|ko|se|par|per|pe|wala|wali|wale|chahiye|chaiye|sasta|sasti|saste|acha|achi|ache|koi|kuch|aur|ya|hai|hain|mujhe|dikhao|dikha|batao|kahan|kya|liye|bhi|rayat|riayat|raiyat" +
      "|میں|پر|کا|کی|کے|کو|سے|اور|والا|والی|والے|ڈسکاؤنٹ|رعایت|آفر|سستا|سستی|سستے|مجھے|دکھائیں|دکھاؤ|چاہیے|سیل|ڈیل",
  ],
];

/** Folded word or two-word phrase → its meaning. The first entry wins when a word appears twice. */
export const LEXICON = new Map<string, Concept>();
for (const [concept, words] of ENTRIES) {
  for (const phrase of words.split("|")) {
    const key = phrase.split(/\s+/).map(fold).join(" ");
    if (!LEXICON.has(key)) LEXICON.set(key, concept);
  }
}

/**
 * The dictionary plus the banks' own words from the data (e.g. "hbl", "al habib", "konnect"), built once per list of
 * banks. Built-in words win if a bank alias repeats one.
 */
const withBanks = new WeakMap<Bank[], Map<string, Concept>>();
export function bankLexicon(banks: Bank[]): Map<string, Concept> {
  const cached = withBanks.get(banks);
  if (cached) return cached;
  const lexicon = new Map(LEXICON);
  for (const bank of banks) {
    for (const alias of [bank.id, bank.short, bank.name, ...bank.aliases]) {
      const key = alias.trim().split(/\s+/).filter(Boolean).map(fold).join(" ");
      // Only one- and two-word phrases are looked up; "Bank AL Habib" is covered by its "al habib" alias.
      if (key && key.split(" ").length <= 2 && !lexicon.has(key)) lexicon.set(key, { kind: "bank", id: bank.id });
    }
  }
  withBanks.set(banks, lexicon);
  return lexicon;
}
