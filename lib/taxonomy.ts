/**
 * The fixed vocabulary of the app: cities, categories and redemption channels. These stay in code because the
 * search dictionary (lib/lexicon.ts: English, Roman Urdu and Urdu words) and the icons are tied to them.
 * Everything that grows is data, not code: deals (data/deals.csv) and banks/cards (data/cards.csv), or the
 * matching database tables.
 */
import type { IconName } from "@/components/ui/Icon";
import type { Category, Channel, City } from "@/lib/types";

export const CITIES: City[] = [
  { id: "lahore", label: "Lahore" },
  { id: "karachi", label: "Karachi" },
  { id: "islamabad", label: "Islamabad" },
  { id: "rawalpindi", label: "Rawalpindi" },
  { id: "faisalabad", label: "Faisalabad" },
  { id: "multan", label: "Multan" },
  { id: "hyderabad", label: "Hyderabad" },
  { id: "sialkot", label: "Sialkot" },
  { id: "gujranwala", label: "Gujranwala" },
  { id: "peshawar", label: "Peshawar" },
  { id: "quetta", label: "Quetta" },
  { id: "sahiwal", label: "Sahiwal" },
  { id: "bahawalpur", label: "Bahawalpur" },
  { id: "sargodha", label: "Sargodha" },
];

export const CHANNELS: { id: Channel; label: string }[] = [
  { id: "in-store", label: "In-store" },
  { id: "delivery", label: "Delivery" },
  { id: "online", label: "Online" },
];

export const CATEGORIES: Category[] = [
  {
    id: "food", label: "Food & Restaurants", short: "Food", icon: "utensils",
    subcategories: [
      { id: "food-restaurants", label: "Restaurants & dining" },
      { id: "food-fastfood", label: "Pizza, burgers & fast food" },
      { id: "food-cafes", label: "Cafes, bakeries & desserts" },
    ],
  },
  {
    id: "fashion", label: "Fashion & Clothing", short: "Fashion", icon: "shirt",
    subcategories: [
      { id: "fashion-clothing", label: "Clothing & lawn" },
      { id: "fashion-shoes", label: "Shoes & bags" },
      { id: "fashion-accessories", label: "Watches & accessories" },
    ],
  },
  {
    id: "electronics", label: "Electronics", short: "Electronics", icon: "phone",
    subcategories: [
      { id: "electronics-mobiles", label: "Mobiles & tablets" },
      { id: "electronics-appliances", label: "ACs, TVs & appliances" },
      { id: "electronics-laptops", label: "Laptops & accessories" },
    ],
  },
  {
    id: "health-beauty", label: "Health & Beauty", short: "Beauty", icon: "sparkles",
    subcategories: [
      { id: "health-salon", label: "Salon & spa" },
      { id: "health-skincare", label: "Skincare & makeup" },
      { id: "health-pharmacy", label: "Pharmacy & wellness" },
    ],
  },
  {
    id: "grocery", label: "Grocery", short: "Grocery", icon: "cart",
    subcategories: [
      { id: "grocery-supermarkets", label: "Supermarkets" },
      { id: "grocery-online", label: "Online grocery" },
    ],
  },
  {
    id: "travel", label: "Travel & Hotels", short: "Travel", icon: "plane",
    subcategories: [
      { id: "travel-hotels", label: "Hotels & stays" },
      { id: "travel-flights", label: "Flights & tours" },
      { id: "travel-lounges", label: "Airport lounges" },
      { id: "travel-rides", label: "Rides & car rental" },
    ],
  },
  {
    id: "home", label: "Home & Living", short: "Home", icon: "home",
    subcategories: [
      { id: "home-furniture", label: "Furniture" },
      { id: "home-decor", label: "Decor & bedding" },
    ],
  },
  {
    id: "entertainment", label: "Entertainment", short: "Fun", icon: "film",
    subcategories: [
      { id: "entertainment-cinema", label: "Cinema" },
      { id: "entertainment-play", label: "Play, games & sports" },
      { id: "entertainment-books", label: "Books" },
      { id: "entertainment-streaming", label: "Streaming & music" },
    ],
  },
];

/** The picture shown for a deal without its own image. */
export const SUB_ICONS: Record<string, IconName> = {
  "food-restaurants": "utensils",
  "food-fastfood": "pizza",
  "food-cafes": "coffee",
  "fashion-clothing": "shirt",
  "fashion-shoes": "shoe",
  "fashion-accessories": "watch",
  "electronics-mobiles": "phone",
  "electronics-appliances": "tv",
  "electronics-laptops": "laptop",
  "health-salon": "scissors",
  "health-skincare": "sparkles",
  "health-pharmacy": "pill",
  "grocery-supermarkets": "cart",
  "grocery-online": "cart",
  "travel-hotels": "bed",
  "travel-flights": "plane",
  "travel-lounges": "plane",
  "travel-rides": "car",
  "home-furniture": "sofa",
  "home-decor": "home",
  "entertainment-cinema": "film",
  "entertainment-play": "star",
  "entertainment-books": "book",
  "entertainment-streaming": "music",
};
