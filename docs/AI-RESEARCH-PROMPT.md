# Collect bank-card discounts with any AI

Use this when you have **no offer text yet** and want an AI to find the offers itself. Give the prompt below to an
AI that can **browse the web** (ChatGPT with search, Claude with web search, Gemini, Perplexity). If you already
have the offer text or a PDF, use [ADD-DEALS-WITH-CLAUDE.md](ADD-DEALS-WITH-CLAUDE.md) instead.

**How to use it**

1. Copy everything in the box. Change the two lines marked `[CHANGE]`: the bank, and today's date.
2. Do **one bank per chat**. A big bank has 100+ offers; one bank at a time keeps the AI careful.
3. Save its two answers as files: `cards-new.csv` and `deals-new.csv` (in Notepad: paste, then *Save as*,
   *Encoding: UTF-8*).
4. Give both files to Claude in this project and ask: *"Check these and add them."* Claude checks every row
   (`npm run data:check`), removes duplicates of deals you already have, opens a sample of the source links to
   confirm the numbers, and imports them (`npm run db:import`).

---

## The prompt (copy everything in the box)

```
You are collecting real bank-card discount offers in Pakistan for my deals website. Accuracy matters more than
quantity: a wrong discount is worse than a missing one.

BANK: [CHANGE: e.g. Meezan Bank]
TODAY: [CHANGE: e.g. 2026-11-15]

STEP 1: FIND THE OFFERS
- Use ONLY the bank's own official website pages (and PDFs linked from them). Do NOT use other deal apps or
  websites (golootlo, Peekaboo, Facebook posts, blogs, news). If the bank's site is not reachable, say so and stop.
- Find the bank's current card discount / "deals" / "offers" / "privileges" pages for its debit and credit cards.
- Skip offers that have already ended (end date before TODAY).
- Skip offers that are not a shop/restaurant/service discount (e.g. cashback on bill payments, insurance, loans,
  instalment plans, reward points).

STEP 2: OUTPUT FILE 1, cards-new.csv
One row per card that the offers below mention. Exactly these 7 columns, with this header line first:
bank_id,bank_name,bank_short,bank_aliases,card_id,card_name,card_short

- bank_id: short lowercase id, letters/numbers/dashes only (e.g. meezan, ubl, mcb, alfalah, scb, faysal, js).
- bank_name: full name (e.g. Meezan Bank). bank_short: short name people use (e.g. Meezan).
- bank_aliases: words people would type to search for this bank, separated by | : the short name, the full name,
  common abbreviations, and the name in Urdu script. Example: meezan|meezan bank|mbl|میزان بینک|میزان
- card_id: lowercase, letters/numbers/dashes, starting with the bank_id (e.g. meezan-titanium-debit).
- card_name: the card's full official name (e.g. Meezan Visa Titanium Debit Card).
- card_short: a short name (e.g. Meezan Titanium Debit).
- If an offer says "all credit cards" or "all debit cards" without naming them, make ONE card row for that group,
  e.g. card_id ubl-credit-cards, card_name "UBL Credit Cards (all)", card_short "UBL Credit Cards".
- Repeat the bank columns on every row of the same bank.
- Do NOT include these cards (I already have them): hbl-konnect-debit, bahl-platinum-debit, bahl-signature.

STEP 3: OUTPUT FILE 2, deals-new.csv
One row per offer (per shop). Exactly these 18 columns, with this header line first:
brand,offer,discount_pct,title,description,category,subcategory,cities,channels,card_ids,price,original_price,code,valid_until,source_url,checked_on,tags,image_url

- brand: the shop's name as the bank writes it.
- discount_pct: the discount as a whole number (20, not "20%"). If the bank gives two numbers for one shop (e.g.
  "10% dining, 15% bakery"), use the LOWER one, put "Up to 15% OFF" in offer, and explain in description.
  If it is not a percentage (free item, buy 1 get 1, free lounge access), use 0 and write the headline in offer
  ("Free", "Buy 1 Get 1"). NEVER guess a percentage. If the page does not state it, skip the offer.
- offer: empty unless the rule above needs it.
- title: what you get, WITHOUT the discount, from this list where possible: Dining bill, Fast food bill,
  Café & bakery bill, Clothing, Shoes, Jewellery & accessories, Salon & grooming, Medical & pharmacy,
  Meat & groceries, Groceries, Hotel stay & dining, Airport lounge access, Furniture, Home & décor,
  Play & games, Books, Electronics, Mobile phones, Car rental, Cinema tickets.
- description: limits and conditions in plain short English, e.g. "Maximum discount PKR 2,000 per card per day.
  Monday to Thursday only." Empty if the bank says nothing.
- category and subcategory: choose EXACTLY one pair from this list (nothing else is accepted):
  food: food-restaurants, food-fastfood, food-cafes
  fashion: fashion-clothing, fashion-shoes, fashion-accessories
  electronics: electronics-mobiles, electronics-appliances, electronics-laptops
  health-beauty: health-salon, health-skincare, health-pharmacy
  grocery: grocery-supermarkets, grocery-online
  travel: travel-hotels, travel-flights, travel-lounges, travel-rides
  home: home-furniture, home-decor
  entertainment: entertainment-cinema, entertainment-play, entertainment-books, entertainment-streaming
  If an offer fits none of these, skip it and list it under "Skipped".
- cities: lowercase ids separated by ; from ONLY this list:
  lahore karachi islamabad rawalpindi faisalabad multan hyderabad sialkot gujranwala peshawar quetta sahiwal
  bahawalpur sargodha
  Leave EMPTY if the offer is nationwide / all branches. Leave out cities that are not in the list and mention
  them in description ("Also at Sukkur.").
- channels: in-store, delivery or online (several separated by ;). Use in-store unless the bank says delivery
  or online.
- card_ids: the card_id(s) from cards-new.csv that get this offer, separated by ;
- price, original_price, code, image_url: leave empty unless the bank gives them.
- valid_until: the last valid day as YYYY-MM-DD. Empty if the bank gives no end date.
- source_url: the exact page (or PDF) link where THIS offer is shown. Every row must have one.
- checked_on: TODAY.
- tags: 1 to 3 English search words separated by spaces (e.g. "pizza", "coffee bakery", "lawn kurta").

CSV RULES (so the file opens correctly)
- Plain CSV, comma-separated, UTF-8. Header line first, then one row per line, no blank lines.
- Put a field in double quotes if it contains a comma; write a quote inside a field as two quotes ("").
- No totals, no notes, no markdown tables inside the CSV.

STEP 4: HOW TO ANSWER
1. A code block with the full cards-new.csv.
2. A code block with the full deals-new.csv.
3. "Checked pages:" every bank page/PDF you used, with its link.
4. "Skipped:" each offer you left out and why (no percentage given, unclear shop type, ended, not a shop, …).
5. "Not sure:" any row you included but are less than certain about, and what to double-check.
If there are too many offers for one answer, give the first part and wait for me to say "continue"; continue
the SAME deals file without repeating the header.
```

---

## What Claude checks when you bring the files back

- Every row against the website's rules (`npm run data:check`): right columns, real categories and cities, dates,
  links, and that every `card_ids` value exists in the cards file.
- New banks and cards are added to `data/cards.csv`, so search understands the bank's name (also in Urdu).
- Deals you already have (same brand, card and offer) are not added twice.
- A sample of rows is opened at `source_url` to confirm the percentage and cities still match the bank's page.
- Then the rows are added to `data/deals.csv` and imported (`npm run db:import`); the website shows them within
  seconds.
