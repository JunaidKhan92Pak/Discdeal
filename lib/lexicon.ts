/**
 * The smart-search dictionary: words people type, in English, Roman Urdu and Urdu script, mapped to what they mean.
 * Add synonyms here, "|"-separated; a two-word phrase is written with a space ("fast food").
 * Common misspellings can be added too, though the typo matcher already handles most of them.
 */
import { fold } from "@/lib/text";
import type { CategoryId, Channel, CityId } from "@/lib/types";

export type Concept =
  | { kind: "city"; id: CityId }
  | { kind: "category"; id: CategoryId }
  | { kind: "sub"; id: string }
  | { kind: "channel"; id: Channel }
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

  // Food
  [{ kind: "category", id: "food" }, "food|khana|khane|khanay|eat|eating|dinner|lunch|breakfast|nashta|meal|کھانا|کھانے|کھانا پینا"],
  [{ kind: "sub", id: "food-restaurants" }, "restaurant|dine|dining|dine in|desi|karahi|biryani|bbq|tikka|kabab|kebab|pulao|nihari|haleem|handi|buffet|ریسٹورنٹ|بریانی|کڑاہی"],
  [{ kind: "sub", id: "food-fastfood" }, "pizza|burger|fries|wings|fast food|fastfood|shawarma|zinger|sandwich|broast|پیزا|برگر"],
  [{ kind: "sub", id: "food-cafes" }, "coffee|cafe|chai|tea|cake|bakery|bakers|dessert|ice cream|icecream|mithai|sweets|چائے|کافی|کیک|مٹھائی"],

  // Fashion
  [{ kind: "category", id: "fashion" }, "fashion|cloth|clothes|clothing|kapra|kapre|kapray|kapde|kapry|libas|dress|wear|outfit|garments|apparel|کپڑے|کپڑا|لباس|فیشن"],
  [{ kind: "sub", id: "fashion-clothing" }, "lawn|suit|shalwar|kameez|kurta|kurti|unstitched|stitched|shirt|tshirt|jeans|denim|shawl|abaya|dupatta|لان|سوٹ|کرتا|قمیض"],
  [{ kind: "sub", id: "fashion-shoes" }, "shoe|joota|joote|jootay|juta|jutay|jute|sneakers|chappal|sandal|heels|bag|handbag|جوتے|جوتا"],
  [{ kind: "sub", id: "fashion-accessories" }, "watch|ghari|gharri|wallet|belt|jewellery|jewelry|sunglasses|accessories|گھڑی"],

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
  [{ kind: "sub", id: "travel-rides" }, "ride|cab|taxi|car rental|rent a car|rickshaw"],

  // Home
  [{ kind: "category", id: "home" }, "home|ghar|house|living|گھر"],
  [{ kind: "sub", id: "home-furniture" }, "furniture|sofa|bed|chair|table|almari|wardrobe|فرنیچر|صوفہ"],
  [{ kind: "sub", id: "home-decor" }, "decor|bedding|bedsheet|curtains|parde|parday|cushions|چادر|پردے"],

  // Entertainment
  [{ kind: "category", id: "entertainment" }, "entertainment|fun|masti|tafreeh|تفریح"],
  [{ kind: "sub", id: "entertainment-cinema" }, "cinema|movie|film|filmein|سینما|فلم"],
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
