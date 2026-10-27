/** Static catalogue: categories and the deals themselves. Replace DEALS with a real data source later. */
import type { Category, Deal } from "@/lib/types";

export const CATEGORIES: Category[] = [
  {
    id: "food", label: "Food & Restaurants", icon: "utensils",
    subcategories: [
      { id: "food-delivery", label: "Food delivery" },
      { id: "food-pizza", label: "Pizza & fast food" },
      { id: "food-coffee", label: "Coffee & cafes" },
    ],
  },
  {
    id: "electronics", label: "Electronics", icon: "phone",
    subcategories: [
      { id: "electronics-audio", label: "Audio & headphones" },
      { id: "electronics-screens", label: "TVs & tablets" },
      { id: "electronics-accessories", label: "Keyboards & accessories" },
    ],
  },
  {
    id: "fashion", label: "Fashion & Clothing", icon: "shirt",
    subcategories: [
      { id: "fashion-shoes", label: "Shoes" },
      { id: "fashion-sportswear", label: "Sportswear" },
      { id: "fashion-clothing", label: "Jackets & clothing" },
    ],
  },
  {
    id: "education", label: "Education", icon: "cap",
    subcategories: [
      { id: "education-courses", label: "Online courses" },
      { id: "education-languages", label: "Language learning" },
      { id: "education-creative", label: "Creative skills" },
    ],
  },
  {
    id: "health-beauty", label: "Health & Beauty", icon: "heart",
    subcategories: [
      { id: "health-skincare", label: "Skincare" },
      { id: "health-wellness", label: "Vitamins & wellness" },
      { id: "health-fitness", label: "Fitness & mindfulness" },
    ],
  },
  {
    id: "travel", label: "Travel & Hotels", icon: "plane",
    subcategories: [
      { id: "travel-stays", label: "Hotels & stays" },
      { id: "travel-flights", label: "Flights & packages" },
      { id: "travel-cars", label: "Car rental" },
    ],
  },
  {
    id: "home", label: "Home & Lifestyle", icon: "home",
    subcategories: [
      { id: "home-furniture", label: "Furniture" },
      { id: "home-appliances", label: "Appliances" },
    ],
  },
  {
    id: "entertainment", label: "Entertainment & Other", icon: "film",
    subcategories: [
      { id: "entertainment-music", label: "Music" },
      { id: "entertainment-video", label: "Movies & TV" },
    ],
  },
];

type DealInput = Omit<Deal, "id" | "discountPct">;

const RAW: DealInput[] = [
  // Food & Restaurants
  { brand: "Uber Eats", title: "$10 off your first 3 orders", description: "Hot meals from local favourites, delivered fast to your door.", category: "food", subcategory: "food-delivery", price: 20, originalPrice: 30, code: "EATS10", endsInDays: 6, icon: "utensils", url: "https://www.ubereats.com" },
  { brand: "DoorDash", title: "Pizza night bundle", description: "Two large pizzas, wings and a 2L drink for the whole family.", category: "food", subcategory: "food-pizza", price: 18, originalPrice: 28, endsInDays: 0, icon: "pizza", url: "https://www.doordash.com" },
  { brand: "Starbucks", title: "Buy one, get one free lattes", description: "Grab a friend and double up on your favourite handcrafted drinks.", category: "food", subcategory: "food-coffee", price: 4.5, originalPrice: 9, endsInDays: 2, icon: "coffee", url: "https://www.starbucks.com" },
  { brand: "Subway", title: "Footlong meal deal", description: "Any footlong sub with a drink and a cookie at a lower price.", category: "food", subcategory: "food-pizza", price: 8.99, originalPrice: 13.5, code: "SUBFEAST", endsInDays: 9, icon: "utensils", url: "https://www.subway.com" },

  // Electronics
  { brand: "Amazon", title: "Wireless noise-cancelling headphones", description: "Up to 30 hours of battery with deep bass and all-day comfort.", category: "electronics", subcategory: "electronics-audio", price: 149, originalPrice: 270, endsInDays: 1, icon: "headphones", url: "https://www.amazon.com" },
  { brand: "Best Buy", title: "55\" 4K smart TV", description: "Crisp 4K picture with built-in streaming apps and voice control.", category: "electronics", subcategory: "electronics-screens", price: 399, originalPrice: 599, endsInDays: 7, icon: "tv", url: "https://www.bestbuy.com" },
  { brand: "Apple", title: "iPad (10th gen) student deal", description: "Show a valid student ID and save on the iPad that does it all.", category: "electronics", subcategory: "electronics-screens", price: 289, originalPrice: 349, code: "STUDENT15", endsInDays: 25, icon: "phone", url: "https://www.apple.com" },
  { brand: "Samsung", title: "Galaxy Buds true wireless", description: "Pocket-sized earbuds with active noise cancelling and a wireless case.", category: "electronics", subcategory: "electronics-audio", price: 79, originalPrice: 149, endsInDays: 5, icon: "headphones", url: "https://www.samsung.com" },
  { brand: "Logitech", title: "MX Keys wireless keyboard", description: "Comfortable, backlit typing that connects to up to three devices.", category: "electronics", subcategory: "electronics-accessories", price: 69, originalPrice: 119, code: "TYPE40", endsInDays: 12, icon: "keyboard", url: "https://www.logitech.com" },

  // Fashion & Clothing
  { brand: "Nike", title: "Air Max running shoes", description: "Lightweight cushioning built for daily runs and everyday style.", category: "fashion", subcategory: "fashion-shoes", price: 72, originalPrice: 120, endsInDays: 0, icon: "shoe", url: "https://www.nike.com" },
  { brand: "Adidas", title: "Ultraboost sneakers", description: "Responsive energy return with a sock-like fit for long distances.", category: "fashion", subcategory: "fashion-shoes", price: 126, originalPrice: 180, code: "STRIDE30", endsInDays: 3, icon: "shoe", url: "https://www.adidas.com" },
  { brand: "Gymshark", title: "Training gear sale", description: "Seamless tees, shorts and leggings built to move with you.", category: "fashion", subcategory: "fashion-sportswear", price: 14, originalPrice: 35, endsInDays: 1, icon: "shirt", url: "https://www.gymshark.com" },
  { brand: "Zara", title: "Winter puffer jacket", description: "A warm, water-repellent jacket that goes with everything.", category: "fashion", subcategory: "fashion-clothing", price: 59, originalPrice: 99, endsInDays: 6, icon: "shirt", url: "https://www.zara.com" },

  // Education
  { brand: "Coursera", title: "Coursera Plus annual plan", description: "Unlimited access to thousands of courses and professional certificates.", category: "education", subcategory: "education-courses", price: 199, originalPrice: 399, code: "LEARN50", endsInDays: 10, icon: "cap", url: "https://www.coursera.org" },
  { brand: "Udemy", title: "Top courses from $12.99", description: "Pick up web development, design or business skills at your own pace.", category: "education", subcategory: "education-courses", price: 12.99, originalPrice: 84.99, endsInDays: 2, icon: "laptop", url: "https://www.udemy.com" },
  { brand: "Duolingo", title: "Super Duolingo yearly", description: "Learn a new language with unlimited hearts and no ads.", category: "education", subcategory: "education-languages", price: 59, originalPrice: 84, endsInDays: 14, icon: "book", url: "https://www.duolingo.com" },
  { brand: "Skillshare", title: "Skillshare annual membership", description: "Creative classes in illustration, photography, video and more.", category: "education", subcategory: "education-creative", price: 99, originalPrice: 168, endsInDays: 9, icon: "book", url: "https://www.skillshare.com" },

  // Health & Beauty
  { brand: "Sephora", title: "Skincare bestsellers set", description: "Cleanser, serum and moisturiser picked by beauty experts.", category: "health-beauty", subcategory: "health-skincare", price: 45, originalPrice: 60, code: "GLOW25", endsInDays: 2, icon: "sparkles", url: "https://www.sephora.com" },
  { brand: "iHerb", title: "Daily vitamins bundle", description: "Multivitamin, vitamin D and omega-3 in one value pack.", category: "health-beauty", subcategory: "health-wellness", price: 24, originalPrice: 40, endsInDays: 4, icon: "pill", url: "https://www.iherb.com" },
  { brand: "Fitbit", title: "Fitbit Charge fitness tracker", description: "Track steps, heart rate and sleep with a week-long battery.", category: "health-beauty", subcategory: "health-fitness", price: 99, originalPrice: 149, endsInDays: 8, icon: "watch", url: "https://www.fitbit.com" },
  { brand: "Headspace", title: "Headspace annual plan", description: "Guided meditation and sleep sounds for a calmer day.", category: "health-beauty", subcategory: "health-fitness", price: 49, originalPrice: 70, code: "CALM30", endsInDays: 12, icon: "heart", url: "https://www.headspace.com" },

  // Travel & Hotels
  { brand: "Booking.com", title: "Weekend city hotel stays", description: "Free cancellation on thousands of hotels in top city destinations.", category: "travel", subcategory: "travel-stays", price: 59, originalPrice: 118, endsInDays: 5, icon: "bed", url: "https://www.booking.com" },
  { brand: "Expedia", title: "Flight + hotel package", description: "Bundle your flight and stay together and save on the whole trip.", category: "travel", subcategory: "travel-flights", price: 349, originalPrice: 499, endsInDays: 20, icon: "plane", url: "https://www.expedia.com" },
  { brand: "Airbnb", title: "Weekend getaway homes", description: "Cosy cabins and city apartments for a short break away.", category: "travel", subcategory: "travel-stays", price: 120, originalPrice: 160, code: "STAYNOW", endsInDays: 9, icon: "home", url: "https://www.airbnb.com" },
  { brand: "Hertz", title: "Car rental per day", description: "Pick up a compact car at the airport with unlimited mileage.", category: "travel", subcategory: "travel-cars", price: 29, originalPrice: 55, endsInDays: 6, icon: "car", url: "https://www.hertz.com" },

  // Home & Lifestyle
  { brand: "IKEA", title: "Home office desk & chair", description: "A tidy workspace set with adjustable chair and cable management.", category: "home", subcategory: "home-furniture", price: 160, originalPrice: 200, endsInDays: 7, icon: "chair", url: "https://www.ikea.com" },
  { brand: "Dyson", title: "Cordless stick vacuum", description: "Powerful suction for floors and furniture, with up to 60 minutes of run time.", category: "home", subcategory: "home-appliances", price: 299, originalPrice: 449, endsInDays: 4, icon: "sparkles", url: "https://www.dyson.com" },
  { brand: "Wayfair", title: "3-seater fabric sofa", description: "Soft, stain-resistant sofa that fits living rooms of any size.", category: "home", subcategory: "home-furniture", price: 449, originalPrice: 799, code: "COUCH20", endsInDays: 11, icon: "sofa", url: "https://www.wayfair.com" },

  // Entertainment & Other
  { brand: "Spotify", title: "Premium for 3 months free", description: "Ad-free music, offline listening and unlimited skips.", category: "entertainment", subcategory: "entertainment-music", price: 0, originalPrice: 35.97, endsInDays: 3, icon: "music", url: "https://www.spotify.com" },
  { brand: "Netflix", title: "Standard plan annual", description: "Two screens in Full HD with thousands of shows and films.", category: "entertainment", subcategory: "entertainment-video", price: 152, originalPrice: 190, endsInDays: 15, icon: "film", url: "https://www.netflix.com" },
  { brand: "Disney+", title: "Disney+ yearly bundle", description: "Stories from Disney, Pixar, Marvel and Star Wars all year.", category: "entertainment", subcategory: "entertainment-video", price: 79.99, originalPrice: 109.99, code: "MAGIC27", endsInDays: 18, icon: "star", url: "https://www.disneyplus.com" },
];

export const DEALS: Deal[] = RAW.map((deal, index) => ({
  ...deal,
  id: index + 1,
  discountPct: Math.round((1 - deal.price / deal.originalPrice) * 100),
}));
