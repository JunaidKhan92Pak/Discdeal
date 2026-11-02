# Add deals quickly with Claude

Banks publish their card discounts as web pages or PDFs. Instead of typing rows by hand, copy the offer text (or
attach the PDF) into a chat with Claude together with the prompt below. Claude returns rows you can paste into
`data/deals.csv`. **Then always run `npm run data:check` and spot-check a few rows against the source.**

---

## The prompt (copy everything in the box)

```
Turn the bank or brand offers below into CSV rows for my deals spreadsheet.

Output ONLY CSV rows (no header, no explanations), one row per offer, with exactly these 18 columns in this order:
brand,offer,discount_pct,title,description,category,subcategory,cities,channels,card_ids,price,original_price,code,valid_until,source_url,checked_on,tags,image_url

Rules:
- brand: the shop's name as written by the source.
- discount_pct: the discount as a whole number. If the source gives two numbers (e.g. "10% dining, 15% bakery"),
  use the LOWER one and put "Up to 15% OFF" in offer and the details in description. If it is not a percentage
  (e.g. free lounge access, buy 1 get 1), use 0 and write the headline in offer ("Free", "Buy 1 Get 1").
- offer: empty unless the rule above needs it.
- title: what you get, WITHOUT the discount: "Dining bill", "Fast food bill", "Café & bakery bill", "Clothing",
  "Shoes", "Jewellery & accessories", "Salon & grooming", "Medical & pharmacy", "Meat & groceries",
  "Hotel stay & dining", "Airport lounge access", "Furniture", "Home & décor", "Play & games", "Books".
- description: caps and conditions in plain English, e.g. "Maximum discount PKR 2,000 per card per day. Monday to
  Thursday only." Empty if the source says nothing.
- category and subcategory: choose from
  food: food-restaurants, food-fastfood, food-cafes
  fashion: fashion-clothing, fashion-shoes, fashion-accessories
  electronics: electronics-mobiles, electronics-appliances, electronics-laptops
  health-beauty: health-salon, health-skincare, health-pharmacy
  grocery: grocery-supermarkets, grocery-online
  travel: travel-hotels, travel-flights, travel-lounges, travel-rides
  home: home-furniture, home-decor
  entertainment: entertainment-cinema, entertainment-play, entertainment-books, entertainment-streaming
- cities: lowercase ids separated by ";" from: lahore karachi islamabad rawalpindi faisalabad multan hyderabad
  sialkot gujranwala peshawar quetta sahiwal bahawalpur sargodha. Leave EMPTY for "Nationwide". Leave out cities
  not in this list and mention them in description ("Also at Sukkur.").
- channels: "in-store" unless the source says delivery or online.
- card_ids: [PUT YOUR CARD ID HERE, from the card_id column of data/cards.csv, e.g. hbl-konnect-debit]
- price, original_price, code, image_url: empty unless the source gives them.
- valid_until: the last valid day as YYYY-MM-DD, or empty if the source gives no end date.
- source_url: [PASTE THE PAGE LINK HERE]
- checked_on: [TODAY'S DATE, e.g. 2026-11-15]
- tags: 1–3 search words in English (e.g. "pizza", "coffee", "jewellery gold").
- Put any field that contains a comma inside double quotes.
- If you are not sure about a value (e.g. which shop type it is), SKIP that offer and list it after the CSV
  under the heading "Skipped:" with the reason. Never guess a discount.

Offers:
[PASTE THE OFFER TEXT HERE, OR ATTACH THE PDF]
```

---

## After Claude answers

1. Paste the rows at the end of `data/deals.csv` (in a text editor, or in Excel/Google Sheets).
2. Run `npm run data:check` and fix anything it lists.
3. Open 3–5 of the new rows' `source_url` links and confirm the numbers match.
4. If the offers are for a bank or card that is not in `data/cards.csv` yet, add it there first (see
   docs/GETTING-STARTED.md, "Adding a new bank or card").
5. If you use the database: `npm run db:import`.
