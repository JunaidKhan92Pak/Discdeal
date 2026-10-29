/**
 * SAMPLE DATA for development: realistic-looking deals under real brand names, but not real offers.
 * Used by the in-memory data source until the Postgres source is connected.
 */
import "server-only";
import { CITIES } from "@/lib/taxonomy";
import { slugify } from "@/lib/text";
import type { CityId, Deal } from "@/lib/types";

const BIG3: CityId[] = ["lahore", "karachi", "islamabad"];
const ALL: CityId[] = CITIES.map((c) => c.id);
const NATIONWIDE: CityId[] = [];

type DealInput = Omit<Deal, "id" | "brandId" | "discountPct" | "url">;

const RAW: DealInput[] = [
  // Food & Restaurants
  { brand: "Butt Karahi", title: "Chicken karahi", description: "The famous Lakshmi Chowk karahi, cooked fresh in desi ghee.", category: "food", subcategory: "food-restaurants", price: 1875, originalPrice: 2500, endsInDays: 5, cities: ["lahore"], channels: ["in-store"], tags: ["karahi", "desi", "chicken", "dinner"], icon: "utensils" },
  { brand: "Kababjees", title: "BBQ platter for four", description: "Seekh kababs, tikka, malai boti and naans for the whole family.", category: "food", subcategory: "food-restaurants", price: 3600, originalPrice: 4800, endsInDays: 8, cities: ["karachi"], channels: ["in-store", "delivery"], tags: ["bbq", "kabab", "tikka", "family"], icon: "utensils" },
  { brand: "Savour Foods", title: "Pulao kabab family deal", description: "Four plates of the classic pulao kabab with shami and raita.", category: "food", subcategory: "food-restaurants", price: 1350, originalPrice: 1800, endsInDays: 3, cities: ["islamabad", "rawalpindi"], channels: ["in-store"], tags: ["pulao", "kabab", "rice", "lunch"], icon: "utensils" },
  { brand: "foodpanda", title: "Your first 3 orders", offer: "Rs 300 OFF", description: "Biryani, burgers or desserts from thousands of restaurants near you.", category: "food", subcategory: "food-restaurants", price: 700, originalPrice: 1000, code: "PANDA300", endsInDays: 10, cities: NATIONWIDE, channels: ["delivery"], tags: ["biryani", "delivery", "voucher"], icon: "utensils" },
  { brand: "Cheezious", title: "2 large pizzas + 1.5L drink", description: "Crown crust or cheese lover, with a chilled drink for the table.", category: "food", subcategory: "food-fastfood", price: 3299, originalPrice: 4800, code: "CHEEZY30", endsInDays: 2, cities: ["lahore", "islamabad", "rawalpindi", "faisalabad"], channels: ["in-store", "delivery"], tags: ["pizza", "family"], icon: "pizza" },
  { brand: "Broadway Pizza", title: "Any large pizza, every Tuesday", offer: "Buy 1 Get 1", description: "Every Tuesday: any large pizza, the second one is on the house.", category: "food", subcategory: "food-fastfood", price: 2199, originalPrice: 4398, endsInDays: 0, cities: ["karachi", "lahore", "multan"], channels: ["delivery"], tags: ["pizza", "bogo"], icon: "pizza" },
  { brand: "Johnny & Jugnu", title: "Burger, fries & drink combo", description: "The signature smash burger with loaded fries and a soft drink.", category: "food", subcategory: "food-fastfood", price: 990, originalPrice: 1450, endsInDays: 4, cities: ["lahore", "islamabad"], channels: ["in-store", "delivery"], tags: ["burger", "fries", "wings"], icon: "utensils" },
  { brand: "Gloria Jean's", title: "Lattes & cappuccinos", offer: "Buy 1 Get 1", description: "Lattes, cappuccinos and iced coffees, bring a friend along.", category: "food", subcategory: "food-cafes", price: 750, originalPrice: 1500, endsInDays: 1, cities: BIG3, channels: ["in-store"], tags: ["coffee", "latte", "cafe"], icon: "coffee" },
  { brand: "Tehzeeb Bakers", title: "Celebration cakes", description: "Birthday and anniversary cakes, plus fresh mithai by the kilo.", category: "food", subcategory: "food-cafes", price: 2000, originalPrice: 2500, endsInDays: 7, cities: ["islamabad", "rawalpindi"], channels: ["in-store", "delivery"], tags: ["cake", "bakery", "mithai", "birthday"], icon: "cake" },

  // Fashion & Clothing
  { brand: "Khaadi", title: "Unstitched lawn, 3-piece", description: "Printed 3-piece lawn with chiffon dupatta, fresh summer colours.", category: "fashion", subcategory: "fashion-clothing", price: 3150, originalPrice: 4500, endsInDays: 6, cities: BIG3, channels: ["in-store", "online"], tags: ["lawn", "unstitched", "women", "suit"], icon: "shirt" },
  { brand: "Sapphire", title: "Embroidered lawn suits", description: "Embroidered lawn shirt, dyed trousers and a printed dupatta.", category: "fashion", subcategory: "fashion-clothing", price: 5590, originalPrice: 7990, endsInDays: 9, cities: ["lahore", "karachi"], channels: ["in-store", "online"], tags: ["lawn", "suit", "women", "embroidered"], icon: "shirt" },
  { brand: "Gul Ahmed", title: "Winter shawls", description: "Warm wool and pashmina-blend shawls, delivered across Pakistan.", category: "fashion", subcategory: "fashion-clothing", price: 2700, originalPrice: 4500, endsInDays: 12, cities: NATIONWIDE, channels: ["online"], tags: ["shawl", "winter", "women"], icon: "shirt" },
  { brand: "J. (Junaid Jamshed)", title: "Men's kurta shalwar", description: "Wash-and-wear kurta shalwar in classic colours, ready for Eid.", category: "fashion", subcategory: "fashion-clothing", price: 4120, originalPrice: 5490, endsInDays: 5, cities: ["lahore", "karachi", "islamabad", "faisalabad"], channels: ["in-store"], tags: ["kurta", "shalwar", "men", "eid"], icon: "shirt" },
  { brand: "Outfitters", title: "Jeans, tees & hoodies", offer: "Up to 50% OFF", description: "Denim, graphic tees and hoodies for men and women.", category: "fashion", subcategory: "fashion-clothing", price: 2499, originalPrice: 4999, endsInDays: 1, cities: ["lahore", "karachi", "islamabad", "multan"], channels: ["in-store", "online"], tags: ["jeans", "tshirt", "denim", "hoodie"], icon: "shirt" },
  { brand: "Bata", title: "School & office shoes", description: "Leather office shoes and durable school shoes in every size.", category: "fashion", subcategory: "fashion-shoes", price: 3199, originalPrice: 3999, endsInDays: 14, cities: ALL, channels: ["in-store"], tags: ["shoes", "school", "office"], icon: "shoe" },
  { brand: "Servis", title: "Sneakers & joggers", description: "Light running shoes and joggers for everyday comfort.", category: "fashion", subcategory: "fashion-shoes", price: 2600, originalPrice: 3999, endsInDays: 3, cities: ["lahore", "faisalabad", "multan"], channels: ["in-store", "online"], tags: ["sneakers", "joggers", "shoes"], icon: "shoe" },
  { brand: "Daraz", title: "Watches, wallets & belts", offer: "Up to 60% OFF", description: "Analog watches, leather wallets and belts, free delivery.", category: "fashion", subcategory: "fashion-accessories", price: 1999, originalPrice: 4999, endsInDays: 2, cities: NATIONWIDE, channels: ["online"], tags: ["watch", "wallet", "belt", "men"], icon: "watch" },

  // Electronics
  { brand: "Daraz", title: "Infinix Hot smartphone", description: "8GB RAM, 128GB storage and a 5000mAh battery, with warranty.", category: "electronics", subcategory: "electronics-mobiles", price: 32999, originalPrice: 38999, code: "DARAZ11", endsInDays: 4, cities: NATIONWIDE, channels: ["online"], tags: ["mobile", "phone", "android", "infinix"], icon: "phone" },
  { brand: "Samsung", title: "Galaxy A-series phones", description: "Bright AMOLED screen and a great camera, official PTA approved.", category: "electronics", subcategory: "electronics-mobiles", price: 59999, originalPrice: 69999, endsInDays: 10, cities: BIG3, channels: ["in-store", "online"], tags: ["mobile", "phone", "galaxy", "android"], icon: "phone" },
  { brand: "Dawlance", title: "1.5 ton inverter AC", description: "Saves up to 60% electricity, with free installation.", category: "electronics", subcategory: "electronics-appliances", price: 139000, originalPrice: 165000, endsInDays: 15, cities: ALL, channels: ["in-store", "online"], tags: ["ac", "inverter", "summer"], icon: "snowflake" },
  { brand: "Haier", title: "43\" smart LED TV", description: "Full HD Android TV with YouTube and Netflix built in.", category: "electronics", subcategory: "electronics-appliances", price: 74999, originalPrice: 92999, endsInDays: 7, cities: ["karachi", "lahore"], channels: ["in-store"], tags: ["tv", "led", "smart"], icon: "tv" },
  { brand: "HP", title: "Student laptop, Core i5", description: "Core i5, 8GB RAM, 512GB SSD with a free laptop bag.", category: "electronics", subcategory: "electronics-laptops", price: 154999, originalPrice: 179999, endsInDays: 20, cities: BIG3, channels: ["in-store"], tags: ["laptop", "student", "computer"], icon: "laptop" },

  // Health & Beauty
  { brand: "Toni&Guy", title: "Haircut + styling", description: "Cut, wash and blow-dry by senior stylists.", category: "health-beauty", subcategory: "health-salon", price: 2800, originalPrice: 4000, endsInDays: 5, cities: BIG3, channels: ["in-store"], tags: ["haircut", "hair", "salon"], icon: "scissors" },
  { brand: "Depilex", title: "Bridal makeup", description: "Bridal and party makeup packages with a free trial session.", category: "health-beauty", subcategory: "health-salon", price: 40000, originalPrice: 50000, endsInDays: 30, cities: ["lahore", "islamabad"], channels: ["in-store"], tags: ["bridal", "makeup", "facial", "parlour"], icon: "sparkles" },
  { brand: "Conatural", title: "Organic skincare bundle", description: "Face wash, vitamin C serum and moisturiser for glowing skin.", category: "health-beauty", subcategory: "health-skincare", price: 2400, originalPrice: 3500, endsInDays: 6, cities: NATIONWIDE, channels: ["online"], tags: ["skincare", "serum", "face"], icon: "sparkles" },
  { brand: "Rivaj", title: "Makeup & lipsticks", description: "Long-lasting lipsticks, foundation and kajal at sale prices.", category: "health-beauty", subcategory: "health-skincare", price: 899, originalPrice: 1499, endsInDays: 3, cities: NATIONWIDE, channels: ["online"], tags: ["makeup", "lipstick", "cosmetics"], icon: "sparkles" },
  { brand: "DVAGO", title: "Medicines & vitamins", description: "Prescription medicines and vitamins, delivered to your door.", category: "health-beauty", subcategory: "health-pharmacy", price: 900, originalPrice: 1000, endsInDays: 30, cities: ALL, channels: ["in-store", "delivery"], tags: ["medicine", "pharmacy", "vitamins"], icon: "pill" },

  // Grocery
  { brand: "Imtiaz", title: "Monthly ration bundle", description: "Atta, cooking oil, rice, daal and sugar in one value pack.", category: "grocery", subcategory: "grocery-supermarkets", price: 14500, originalPrice: 16500, endsInDays: 5, cities: ["karachi", "lahore", "faisalabad"], channels: ["in-store", "delivery"], tags: ["ration", "atta", "oil", "rice"], icon: "cart" },
  { brand: "Al-Fatah", title: "Weekend grocery", description: "Save on your whole basket every Saturday and Sunday.", category: "grocery", subcategory: "grocery-supermarkets", price: 4400, originalPrice: 5000, endsInDays: 2, cities: ["lahore", "islamabad"], channels: ["in-store"], tags: ["grocery", "weekend"], icon: "cart" },
  { brand: "Carrefour", title: "Fresh fruits & vegetables", description: "Seasonal fruit and fresh sabzi, picked every morning.", category: "grocery", subcategory: "grocery-supermarkets", price: 1600, originalPrice: 2000, endsInDays: 1, cities: ["karachi", "lahore", "islamabad", "multan"], channels: ["in-store"], tags: ["fruits", "vegetables", "sabzi"], icon: "cart" },
  { brand: "pandamart", title: "Groceries + free delivery", description: "Groceries at your door in about 30 minutes.", category: "grocery", subcategory: "grocery-online", price: 1700, originalPrice: 2000, code: "MART15", endsInDays: 4, cities: ["karachi", "lahore", "islamabad", "rawalpindi"], channels: ["delivery"], tags: ["grocery", "delivery"], icon: "cart" },

  // Travel & Hotels
  { brand: "Pearl-Continental", title: "Weekend stay for two", description: "Deluxe room with breakfast buffet and late checkout.", category: "travel", subcategory: "travel-hotels", price: 32000, originalPrice: 42000, endsInDays: 20, cities: ["lahore", "karachi", "islamabad", "rawalpindi"], channels: ["in-store", "online"], tags: ["hotel", "room", "stay", "buffet"], icon: "bed" },
  { brand: "PIA", title: "Lahore ⇄ Karachi return fare", description: "Economy return ticket with 20kg checked baggage.", category: "travel", subcategory: "travel-flights", price: 29999, originalPrice: 36000, endsInDays: 9, cities: NATIONWIDE, channels: ["online"], tags: ["flight", "airline", "ticket"], icon: "plane" },
  { brand: "Sastaticket", title: "Hunza & Skardu tour, 5 days", description: "5 days in Hunza and Skardu with transport and hotels.", category: "travel", subcategory: "travel-flights", price: 45000, originalPrice: 60000, endsInDays: 15, cities: NATIONWIDE, channels: ["online"], tags: ["tour", "hunza", "skardu", "trip"], icon: "plane" },
  { brand: "Careem", title: "Your next 5 rides", description: "Go, Go+ and Bike rides across the city.", category: "travel", subcategory: "travel-rides", price: 750, originalPrice: 1000, code: "RIDE25", endsInDays: 3, cities: ALL, channels: ["online"], tags: ["ride", "cab", "taxi"], icon: "car" },
  { brand: "Bykea", title: "Bike rides", description: "Beat the traffic with quick bike rides and parcel delivery.", category: "travel", subcategory: "travel-rides", price: 140, originalPrice: 200, code: "BYKEA30", endsInDays: 6, cities: ["karachi", "lahore", "rawalpindi"], channels: ["online"], tags: ["bike", "ride"], icon: "car" },

  // Home & Living
  { brand: "Interwood", title: "5-seater sofa sets", description: "5-seater sofa sets in velvet and leather finishes.", category: "home", subcategory: "home-furniture", price: 179000, originalPrice: 224000, endsInDays: 12, cities: BIG3, channels: ["in-store"], tags: ["sofa", "living room"], icon: "sofa" },
  { brand: "Habitt", title: "Ergonomic office chair", description: "Mesh back, adjustable arms and lumbar support.", category: "home", subcategory: "home-furniture", price: 24999, originalPrice: 34999, endsInDays: 5, cities: BIG3, channels: ["in-store", "online"], tags: ["chair", "office", "work"], icon: "chair" },
  { brand: "Chenone", title: "Bedsheets & curtains", description: "Cotton bedsheet sets, cushions and blackout curtains.", category: "home", subcategory: "home-decor", price: 6500, originalPrice: 9800, endsInDays: 8, cities: ["lahore", "faisalabad", "islamabad"], channels: ["in-store", "online"], tags: ["bedsheet", "bedding", "curtains"], icon: "bed" },

  // Entertainment
  { brand: "Cinepax", title: "2 movie tickets + popcorn", description: "Any 2D show with a large popcorn and two drinks.", category: "entertainment", subcategory: "entertainment-cinema", price: 2400, originalPrice: 3400, endsInDays: 2, cities: ALL, channels: ["in-store", "online"], tags: ["movie", "cinema", "popcorn"], icon: "film" },
  { brand: "Nueplex", title: "Movie tickets, every Tuesday", offer: "Half price", description: "Every Tuesday, all shows at half the usual price.", category: "entertainment", subcategory: "entertainment-cinema", price: 900, originalPrice: 1800, endsInDays: 0, cities: ["karachi", "lahore"], channels: ["in-store"], tags: ["movie", "cinema", "tuesday"], icon: "film" },
  { brand: "Tamasha", title: "Annual plan", description: "Pakistani dramas, live cricket and movies all year.", category: "entertainment", subcategory: "entertainment-streaming", price: 1199, originalPrice: 1999, endsInDays: 25, cities: NATIONWIDE, channels: ["online"], tags: ["drama", "cricket", "streaming"], icon: "film" },
  { brand: "Spotify", title: "Spotify Premium, 3 months", offer: "Free", description: "Ad-free music, offline listening and unlimited skips.", category: "entertainment", subcategory: "entertainment-streaming", price: 0, originalPrice: 1197, endsInDays: 7, cities: NATIONWIDE, channels: ["online"], tags: ["music", "songs", "streaming"], icon: "music" },
];

export const SAMPLE_DEALS: Deal[] = RAW.map((deal, index) => ({
  ...deal,
  id: index + 1,
  brandId: slugify(deal.brand),
  discountPct: Math.round((1 - deal.price / deal.originalPrice) * 100),
  url: `https://www.google.com/search?q=${encodeURIComponent(`${deal.brand} Pakistan`)}`,
}));
