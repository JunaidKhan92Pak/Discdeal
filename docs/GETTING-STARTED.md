# Getting started: from this computer to a live website

Written for a beginner. Do the steps in order; each one says how to check it worked.

**Right now the website already works without any accounts.** It reads the deals from the spreadsheet
`data/deals.csv` (146 real bank-card offers collected on 1 Nov 2026). The steps below move the deals into a real
database and put the site online.

---

## Part 1: Run it on your computer

1. Open a terminal in the project folder and run:
   ```
   npm install
   npm run dev
   ```
2. Open http://localhost:3000. You should see the search page; try "pizza in lahore" or "HBL".
3. If port 3000 is busy, Next.js picks another one and prints it (for example 3001).

---

## Part 2: Keep the deals up to date (the spreadsheet)

All deals live in **`data/deals.csv`**. Open it in Excel or Google Sheets (File → Import), edit, and save it back as
CSV (UTF-8). One row = one deal. Columns:

| Column | What to write | Example |
|---|---|---|
| `brand` | The shop's name | `Pizza Max` |
| `offer` | Only if the headline is not a plain % | `Buy 1 Get 1`, `Free`, `Up to 50% OFF` |
| `discount_pct` | The discount as a number (0 if it is not a %) | `20` |
| `title` | What you get, **without** the discount | `Fast food bill` |
| `description` | Conditions: cap, days, dine-in only… | `Maximum discount PKR 2,000. Monday to Thursday.` |
| `category` / `subcategory` | Ids from the table below | `food` / `food-fastfood` |
| `cities` | City ids separated by `;` (empty = nationwide) | `lahore;karachi` |
| `channels` | `in-store`, `delivery`, `online` (separated by `;`) | `in-store` |
| `card_ids` | Card ids separated by `;` (empty = no card needed) | `hbl-konnect-debit` |
| `price` / `original_price` | Only for fixed-price deals, plain numbers | `1500` / `2500` |
| `code` | Coupon code, if any | `SAVE20` |
| `valid_until` | Last day, `YYYY-MM-DD` (empty = no end date given) | `2026-12-31` |
| `source_url` | The bank's or brand's own page where you saw it | `https://www.hbl.com/…` |
| `checked_on` | The day you checked it, `YYYY-MM-DD` | `2026-11-01` |
| `tags` | Extra search words, separated by spaces | `pizza` |
| `image_url` | Optional picture link (only use pictures you have permission for) | |

**Ids you can use** (cities and categories are in `lib/taxonomy.ts`, cards in `data/cards.csv`):
- Cities: `lahore karachi islamabad rawalpindi faisalabad multan hyderabad sialkot gujranwala peshawar quetta sahiwal bahawalpur sargodha`
- Cards: the `card_id` column of `data/cards.csv` (today `hbl-konnect-debit bahl-platinum-debit bahl-signature`)
- Categories → subcategories:
  - `food` → `food-restaurants food-fastfood food-cafes`
  - `fashion` → `fashion-clothing fashion-shoes fashion-accessories`
  - `electronics` → `electronics-mobiles electronics-appliances electronics-laptops`
  - `health-beauty` → `health-salon health-skincare health-pharmacy`
  - `grocery` → `grocery-supermarkets grocery-online`
  - `travel` → `travel-hotels travel-flights travel-lounges travel-rides`
  - `home` → `home-furniture home-decor`
  - `entertainment` → `entertainment-cinema entertainment-play entertainment-books entertainment-streaming`

**After every edit, check the file:**
```
npm run data:check
```
It prints how many deals are live, which have ended, and **exactly which rows have a problem and why**. Rows with
problems are skipped on the website until you fix them. Ended deals hide themselves; you do not need to delete them.

`data/deals-template.csv` is an empty copy with two example rows. To turn a bank's offer page or PDF into rows
quickly, see **docs/ADD-DEALS-WITH-CLAUDE.md**.

**Adding a new bank or card** (e.g. Meezan): add a row to `data/cards.csv`, no code needed:

| Column | What to write | Example |
|---|---|---|
| `bank_id` | Short lowercase id for the bank | `meezan` |
| `bank_name` | Full name | `Meezan Bank` |
| `bank_short` | Short name shown on chips | `Meezan` |
| `bank_aliases` | Words people search by, separated by `\|` (English, Roman Urdu, Urdu) | `meezan\|mbl\|میزان` |
| `card_id` | Lowercase id for the card, used in `card_ids` of deals | `meezan-titanium-debit` |
| `card_name` | Full card name | `Meezan Visa Titanium Debit Card` |
| `card_short` | Short card name shown on deals | `Meezan Titanium` |

One row per card; repeat the bank columns for a bank's second card. Then use the new `card_id` in `card_ids`, run
`npm run data:check`, and (with a database) `npm run db:import`. Search understands the bank's words at once.

---

## Part 3: Put the deals in a database (Supabase, free)

1. Go to https://supabase.com, sign up, and **create a new project**. Choose the region closest to Pakistan
   (e.g. Mumbai or Singapore). Write the database password down somewhere safe.
2. (Optional) `npm run db:import` in step 5 creates the tables for you. To create them by hand instead, open
   **SQL Editor → New query**, paste everything from `db/schema.sql`, and press **Run**.
3. Click **Connect** (top of the project page) → **Transaction pooler** → copy the **URI**.
4. In the project folder, copy `.env.example` to a new file called **`.env.local`**, and paste the URI after
   `DATABASE_URL=`. Replace `[YOUR-PASSWORD]` with your database password. **Do not share this file or paste it in
   chat**; it is your private key.
5. Load the spreadsheet into the database:
   ```
   npm run db:import
   ```
   ✔ It should say `Imported 3 cards and 147 deals …`. Refresh the Table Editor in Supabase to see the `cards`,
   `deals`, `users`, `sessions` and `likes` tables. (Accounts, for saving liked deals, switch on once these exist.)
   If any row has a problem, nothing is imported and it lists what to fix.
6. Restart `npm run dev`. The website now reads from the database. (Without `DATABASE_URL` it reads the
   spreadsheet again, so you can always switch back.)

**From now on:** edit `data/cards.csv` / `data/deals.csv` → `npm run data:check` → `npm run db:import`. The
website shows the change within about a minute (within seconds with Redis, Part 3b). You can also edit rows
directly in Supabase's Table Editor.

**If `npm run db:import` says `CONNECT_TIMEOUT`**, your network (often office or university Wi-Fi) blocks database
ports 5432/6543. Ordinary websites still open, so it is easy to miss. Either connect to mobile data and run it again,
or let GitHub do the import (below), which never touches your network.

**Let GitHub import for you (recommended).** `.github/workflows/import-deals.yml` imports the spreadsheets every time
`data/` changes on GitHub. One-time setup:
1. GitHub → your repository → **Settings → Secrets and variables → Actions → New repository secret**.
2. Name `DATABASE_URL`, value: the same line as in `.env.local` (only the part after `DATABASE_URL=`, without
   quotes). Optionally add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` the same way.
3. **Actions → Import deals → Run workflow** to import now. ✔ A green tick means it worked; click it to see
   `Imported … deals`.

From then on: edit the spreadsheet → commit and push → GitHub imports it within a minute or two.

---

## Part 3b (optional): Add Redis for a faster, shared cache (Upstash, free)

Without Redis each server keeps its own cache, which is fine to start. With Redis, all servers share cached
answers and the per-visitor limit, and `npm run db:import` refreshes the site within seconds.

1. Go to https://upstash.com, sign up, and **create a Redis database** (region closest to your Vercel region).
2. On the database page, under **REST API**, copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into
   `.env.local` (the lines are already in `.env.example`). **Keep the token private.**
3. Restart `npm run dev`. Search twice for the same thing: the second answer's `X-Cache` header says `memory` or
   `redis` (browser DevTools → Network → the `deals?…` request → Headers).

On Vercel you can instead add Upstash from **Storage / Marketplace**; it sets `KV_REST_API_URL` and
`KV_REST_API_TOKEN`, which work too.

---

## Part 4: Put the website online (Vercel, free)

1. Put the project on GitHub (a private repository is fine).
2. Go to https://vercel.com, sign up with GitHub, click **Add New → Project**, and pick the repository.
3. Before deploying, open **Environment Variables** and add `DATABASE_URL` with the same value as in `.env.local`
   (skip it to run the live site from the spreadsheets instead), plus the two Upstash values if you use Redis.
4. Press **Deploy**. In a minute or two you get a link like `discdeal.vercel.app`. Open it on your phone and test.
5. **Your own domain** (e.g. `discdeal.pk`): buy it from a registrar (PKNIC for `.pk`, or Namecheap/GoDaddy for
   `.com`), then in Vercel → your project → **Settings → Domains → Add**, and follow the instructions it shows.

Every time you push changes to GitHub, Vercel updates the live site automatically.

---

## Checklist before showing it to people

- [ ] `npm run data:check` shows **no problems**
- [ ] Spot-check 10 random deals: open each one's **View offer** link and confirm the % and cities still match
- [ ] Try on a phone: search, open a deal, "My cards", dark mode
- [ ] Remove any deal you could not confirm (accuracy is your advantage over other apps)

## Good practice

- **Accuracy:** always fill `source_url` and `checked_on`, and re-check deals every week or two. Banks change offers.
- **Legal:** show only facts (discount, cities, dates), link to the source, and do not copy banks' or brands'
  logos or photos without permission.
- **Privacy:** "My cards" stores only card *names* on the user's own phone. Never ask users for card numbers.
- **Accounts:** people's names, emails and phone numbers are in the `users` table. Never share or export it, and
  never put the database password anywhere public. You can see accounts in Supabase → Table Editor → users
  (passwords there are scrambled hashes, which is correct; nobody can read them, not even you).
