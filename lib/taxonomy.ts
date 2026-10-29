/**
 * The fixed vocabulary of the app: cities, categories and redemption channels.
 * Small and shared by browser and server. The deals themselves live in the data source (lib/server).
 */
import type { Category, Channel, City } from "@/lib/types";

export const CITIES: City[] = [
  { id: "lahore", label: "Lahore" },
  { id: "karachi", label: "Karachi" },
  { id: "islamabad", label: "Islamabad" },
  { id: "rawalpindi", label: "Rawalpindi" },
  { id: "faisalabad", label: "Faisalabad" },
  { id: "multan", label: "Multan" },
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
      { id: "food-restaurants", label: "Restaurants & desi food" },
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
      { id: "entertainment-streaming", label: "Streaming & music" },
    ],
  },
];
