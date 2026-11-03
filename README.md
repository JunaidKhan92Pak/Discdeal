# DiscDeal

Smart search for discounts and deals across Pakistan, including bank-card offers ("what does my card get?").
Built with Next.js (App Router), React and Tailwind CSS v4.

**New here? Start with [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md)** (step by step: run it, edit deals,
connect a database, put it online).

```bash
npm run dev          # http://localhost:3000
npm run data:check   # check data/cards.csv + data/deals.csv after editing them
npm run db:import    # create the tables and copy both spreadsheets into Postgres (needs DATABASE_URL in .env.local;
                     # falls back to HTTPS with SUPABASE_ACCESS_TOKEN when the network blocks database ports)
npm run db:test      # test the database code against a built-in Postgres (no account needed)
npm run lint
npm run typecheck
```

## The data

The deals are **real offers** collected from the banks' own public pages on 1 Nov 2026: HBL Konnect Debit Card
(118 offers), Bank AL Habib Visa Platinum Debit (20) and Visa Signature (9). They live in the spreadsheet
**`data/deals.csv`**, one row per deal, with the source link and the date it was checked. Rules followed when
collecting: only the bank's own pages (not other deal apps), never guess a missing percentage (those offers were
left out), and when a bank lists two different numbers for one shop, use the lower one and explain it.

- **Nothing about the data is written in the code.** Banks and cards live in **`data/cards.csv`** (with the words
  people search them by, in English and Urdu); deals in `data/deals.csv`. Adding a bank, a card or a deal is a
  spreadsheet edit. The example searches and the "N deals" numbers on the first screen are worked out from the
  live data (`GET /api/meta`).
- Without a database, the website reads the two spreadsheets directly. With `DATABASE_URL` set, it reads the
  `cards` and `deals` tables in Postgres instead (`npm run db:import` creates them and copies the spreadsheets in).
  Same checks either way (`lib/cards-csv.ts`, `lib/deals-csv.ts`).
- Offers past their `valid_until` date are hidden automatically (Pakistan time). Offers without an end date show
  as "Ongoing".
- Every deal's details show where it came from, when it was checked, and link to the bank's own offer page.
- **My cards**: people tick the cards they have (names only, saved on their own phone) and see only the deals
  those cards get. Each deal shows which card pays; deals for your cards say "✓ Your card".
- To add deals fast, see [docs/ADD-DEALS-WITH-CLAUDE.md](docs/ADD-DEALS-WITH-CLAUDE.md) (you have the offer text), or
  [docs/AI-RESEARCH-PROMPT.md](docs/AI-RESEARCH-PROMPT.md) (a prompt that makes any web-browsing AI find a bank's
  offers and return `cards-new.csv` + `deals-new.csv`).

## How the screen works

One screen, no page scrolling. At first only the hero, the search bar and a few one-tap example searches are shown.
Typing (or pressing **Search**, or tapping an example) shows the results. On desktop the search bar moves up into the
header row (logo · search · city), so the results start high on the screen. Then, top to bottom:

1. **What search understood** (📍 Lahore, 👕 Fashion, Under Rs 2,000 …), each removable with one tap. On desktop it
   is part of the results line ("8 deals for Lahore × Fashion ×"); on phones it is its own row.
2. **Filters, by screen size**:
   - **Desktop (≥1024px): a sidebar** with every filter visible at once: categories, the chosen category's types
     indented underneath, then **Brands** (the 8 biggest + "Show all", with a search box). One choice per level.
   - **Phones and tablets: category pills** (one tap; the chosen category opens a second row with its types) and a
     **Brand** button that opens the same brand list as a bottom sheet.
   Empty categories hide. Both layouts share one set of filters, so a choice carries over when the window resizes.
3. **Toolbar**: number of deals · 💳 My cards · Brand (phones and tablets) · sort (best match / biggest discount /
   ending soon) · ♥ Liked.
4. **Deals**: a grid of picture-first cards that scrolls inside its own panel. 2 columns on phones; on larger
   screens as many as fit at 17rem or wider (3 on a laptop next to the sidebar), so cards never get cramped.
   24 load at a time; **Show more deals** loads the next 24.

The 📍 city pill in the navbar is remembered (`localStorage`). A city typed in the search wins over it. Tapping a card
opens the details: a bottom sheet on phones, a dialog on larger screens. The heart saves a deal to **Liked** (this needs
a free account; see "Accounts" below).

### Categories, types and brands (two directions)

Filters are **faceted**: each one's counts are worked out with every *other* filter applied. So people can start
from either side:

- **Category → type → brand**: Food → Fast food → the Brand list shows only Broadway Pizza, Cheezious, Johnny & Jugnu.
- **Brand → its categories**: pick Daraz → the categories (sidebar or pills) shrink to Fashion (1) and Electronics (1).
- From any deal's details, **"All deals from Khaadi"** jumps to that brand across all its categories.

Brands have a URL-safe id (`brandId`, e.g. `j-junaid-jamshed`), sent to the API as `?brand=`.

### Why it looks like this (UX research)

- **A grid, not a carousel.** A carousel hides everything but the first few cards behind swipes most people never make;
  a grid shows several deals at once and makes comparing easy.
- **Built for every age, students to grandparents.** Body text is 16px and nothing is smaller than 13px; every
  button, pill and menu row is at least 44px tall; text passes WCAG AA contrast (most of it AAA); colour never
  carries meaning alone (the deadline always has a clock icon, the saving always says "You save"); "50% OFF"
  instead of "-50%"; and animations switch off for people who turn on "reduce motion".
- **One fact per line on a card, in the order people decide**: picture → the discount, biggest and in green
  ("30% OFF", or the deal's own words: "Buy 1 Get 1", "Free", "Up to 50% OFF") → what you get → who gives it →
  price with the crossed-out original → when it ends and where. Nothing is said twice: titles never repeat the
  discount, and the saving in rupees ("You save Rs …"), the coupon code and how to use the deal are in the details.
  Cards are two to a row on phones, so twice as many deals fit on screen.
- **Honest urgency only.** "Ends tonight/tomorrow" turns amber; nothing else shouts.
- **Sidebar on desktop, pills on phones.** A sidebar shows every option at once, which Baymard found is what
  horizontal filter bars lack, and wide screens have the room. On phones a sidebar has to hide behind a button, and
  going back and forth to a separate filter screen is a common problem, so phones get one-tap pills instead.
  Types appear only after a category is picked; one choice per level (no checkboxes) keeps it simple for everyone.
- **Brands are a list, never tabs.** Tabs are for navigation, not filtering, and a row of tabs that overflows hides
  options. A searchable list with counts works for 40 brands or 400.
- **"Show more" instead of endless scrolling.** Usability testing (Baymard) found a load-more button works better
  than infinite scrolling for product lists, especially on mobile.
- **Feels instant.** Under ~0.1 s feels immediate; up to ~1 s keeps the flow (Nielsen). Results update as you type,
  old results stay visible (dimmed) while new ones load, and searches you already did come from a cache.
- **No forced "pick your city" popup.** City is a pill you can change any time.

## Project structure

```
proxy.ts                 runs in front of /api: GET only, not for other websites, no over-long URLs
next.config.ts           security headers, no X-Powered-By, ships data/ with the API
app/
  page.tsx               page shell: search text, saved city, "browsing" state (with a cross-fade)
  layout.tsx             fonts, theme-init script (runs before paint, no flash)
  globals.css            imports Tailwind + the two style files below
  api/deals/route.ts     GET /api/deals: rate limit → validated params → cached search → one page of results
  api/meta/route.ts      GET /api/meta: banks, cards, live counts and example searches (fetched once per visit)
  api/auth/*/route.ts    POST register · POST login · POST logout · GET me (who is logged in)
  api/likes/route.ts     the logged-in person's liked deals: GET · POST {ids} · DELETE ?id=
styles/
  theme.css              DESIGN TOKENS: colours (light/dark), fonts, type scale, radii, widths, shadows, motion
  components.css         shared classes built from the tokens: deal-card, pill, chip, field, badge, media …
components/
  ui/                    small reusable pieces: Icon, Select (Radix), MagicCard (Magic UI), LikeButton, CopyCodeButton,
                         ThemeToggle
  layout/                Header (logo, search, city, account, theme: one row on desktop once browsing)
  auth/                  AuthDialog (Log in / Create account window), AccountButton (header: Log in, or name + Log out)
  home/                  Hero, SearchBar, QuickSearches (the first screen)
  deals/                 DealsBrowser (composes the rest), IntentChips, FilterSidebar (desktop), CategoryBar (phones),
                         BrandList + BrandPicker, ResultsToolbar, ResultsGrid, DealCard, OfferText, DealModal
hooks/
  useDeals.ts            fetches /api/deals: debounced, shares identical requests, caches pages, load more, retry
  useMeta.ts             fetches /api/meta once per visit, shared by every component
  useBrowseFilters.ts    category / subcategory pill, sort, Liked view
  useSavedCity.ts        the 📍 city, remembered in localStorage
  useAccount.ts          who is logged in (asked once per visit), log in / register / log out, "please log in" requests
  useLikedDeals.ts       the account's liked deals (server), asks to log in first when logged out
  useMyCards.ts          the user's cards (names only) and "only my cards", in localStorage
lib/
  types.ts               shared types, including the API contract (DealQuery → DealsPage)
  account.ts             register / log in form rules and messages (used by browser and server)
  account-sql.ts         the SQL for users, sessions and likes
  taxonomy.ts            cities, categories, subcategories, channels (tied to the search dictionary and icons)
  cards-csv.ts           the banks & cards spreadsheet format
  deals-csv.ts           the deals spreadsheet format: read it, check every row, turn rows into deals
  db-sql.ts              the SQL for Postgres: read cards and live deals, import both spreadsheets
  query.ts               the API's URL format: build it (browser) and validate it (server)
  lexicon.ts             smart-search dictionary: English / Roman Urdu / Urdu words → meaning
  intent.ts              query text → filters + leftover words (typo-corrected)
  text.ts                tokenize, fold spelling variants, typo distance
  format.ts              price / city / date text
  server/config.ts       every server setting, from environment variables, with defaults
  server/cache.ts        memory + Redis cache, one load per key at a time, data version for instant refresh
  server/rate-limit.ts   requests per visitor per minute (Redis if set, else per server); stricter for log in
  server/db.ts           one Postgres connection pool, shared by the catalog and accounts
  server/session.ts      log-in sessions in a private cookie; shared start of every account route
  server/password.ts     password hashing (scrypt, built into Node)
  server/catalog.ts      loads cards + live deals: Postgres if DATABASE_URL is set, else the spreadsheets
  server/search.ts       smart search over the loaded deals: match + rank + relax + facets + pages
data/
  cards.csv              THE BANKS AND CARDS, with their search words
  deals.csv              THE DEALS (real, with sources). Edit in Excel / Google Sheets
  deals-template.csv     empty copy with two example rows
db/
  schema.sql             the Postgres `cards` and `deals` tables (db:import runs it for you)
scripts/
  check-deals.mts        npm run data:check
  import-deals.mts       npm run db:import
  test-db.mts            npm run db:test (runs everything against PGlite, a Postgres inside Node)
docs/
  GETTING-STARTED.md     beginner's guide: run, edit deals, Supabase, Vercel, domain
  ADD-DEALS-WITH-CLAUDE.md  a ready prompt to turn bank offer pages/PDFs into spreadsheet rows
  AI-RESEARCH-PROMPT.md  a prompt for any web-browsing AI to collect one bank's offers as two CSV files
```

Data flows one way: `page.tsx` → `DealsBrowser` → `useDeals` → `GET /api/deals` → `lib/server/cache.ts`
→ `lib/server/search.ts` → `lib/server/catalog.ts` (spreadsheets or Postgres).
The deal data never ships to the browser; only one page of results does.

## Ready for a database and real traffic

- **The API contract is fixed** (`DealQuery` → `DealsPage` in `lib/types.ts`): filters, sort, `offset`/`limit` paging,
  per-category counts, and what smart search understood. The UI only knows this contract.
- **Postgres is ready**: set `DATABASE_URL` and the site reads the `deals` table (tested end to end with
  `npm run db:test`). The live deals are loaded into memory once a minute and searched there, which is fast for
  thousands of deals. At tens of thousands, move the filtering into SQL (pg_trgm) or a search engine
  (Meilisearch/Typesense); the API and the UI do not change.
- **Few requests from the browser**: typing waits half a second (500 ms) after the last key, so a word is one
  request, not one per letter; Enter and removing a chip search at once. One-letter searches are not sent,
  two components asking for the same page share one request, and the last 60 pages are kept for the tab (back to
  an earlier search = instant). `/api/meta` is fetched once per visit.
- **Caching on the server, in layers**, so a burst of identical searches costs one database query at most:
  1. the CDN serves repeated searches without reaching the server (`s-maxage=60, stale-while-revalidate=300`);
  2. each server keeps the last 500 answers in memory;
  3. with Redis (Upstash) set, answers are shared by every server, so a new server starts warm;
  4. the deals themselves are loaded once a minute, and only once even if 100 searches arrive together.
  While developing, the response header `X-Cache` says which layer answered (`memory`, `redis` or `fresh`).
- **Instant refresh after an import**: `npm run db:import` bumps a data version in Redis; every cached answer is
  keyed by it, so the site shows new deals within seconds instead of waiting for caches to expire.
- **The server stays private**: the browser only calls this site's own `/api/deals` and `/api/meta`. The
  database and Redis addresses and keys are read on the server only (`lib/server/config.ts`, marked `server-only`,
  so a build fails if browser code imports it). `proxy.ts` runs in front of the API and turns away anything but
  GET, requests from scripts on other websites, and over-long URLs before they cost any work. No `X-Powered-By`
  header, no internal error details in responses, and security headers on every response (`next.config.ts`).
- **Rate limit**: one visitor may make 120 searches a minute (`RATE_LIMIT_PER_MINUTE`); more gets `429` with
  `Retry-After`. Shared across servers with Redis, per server without.
- **Every limit is a setting**: cache times and the rate limit are environment variables (see `.env.example`), all
  optional with sensible defaults. Without Redis everything still works, cached per server.
- **Untrusted input is bounded**: unknown ids are dropped, `limit` ≤ 48, `offset` ≤ 2000, text ≤ 120 characters,
  at most 200 liked ids. Errors return JSON with status 500 and the UI offers "Try again".
- **Long lists stay smooth**: cards off screen skip layout and paint (`content-visibility: auto`).

## Accounts

People need a free account to save ("like") deals, so their likes are on every phone and computer they log in on.
Tapping a heart while logged out opens the **Log in / Create account** window with the reason; once they are in,
the deal they tapped is saved without tapping again. "Liked" works the same way.

- **Register**: full name, username, city, email, mobile number, password and confirm password. **Log in**: username
  *or* email, and password. Each problem is shown under its field in plain words; the form checks in the browser
  first (no wait), and the server checks again (`lib/account.ts`, the same rules on both sides). Mobile numbers are
  understood in any common form (0300 1234567, +92 300 1234567 …) and stored as +923001234567.
- **Passwords** are never stored, only a scrypt hash with its own salt (`lib/server/password.ts`). A wrong username
  and a wrong password give the same message and take the same time, so nobody can find out who has an account.
- **Sessions**: a random token in a cookie page scripts cannot read (HttpOnly, Secure, SameSite=Lax), valid 30 days
  (`SESSION_DAYS`). The database keeps only the token's SHA-256. Log out deletes it.
- **Abuse**: 10 log-in / register tries per minute per visitor (`AUTH_ATTEMPTS_PER_MINUTE`); `proxy.ts` accepts
  account changes only as JSON from a page on this site; at most 500 likes per account.
- **Needs the database.** Without `DATABASE_URL` the Log in button is hidden and everything else works as before.
  `npm run db:import` creates the `users`, `sessions` and `likes` tables (see `db/schema.sql`).
- Not built yet: "forgot password" (needs an email service such as Resend) and verifying email or phone.

## Smart search

People type the way they talk: `discount on cloth in lahore`, `kapry lhaore`, `کراچی میں پیزا`, `pizza under 2k`.
`lib/intent.ts` turns that into filters before anything is matched:

1. **Split and fold** (`lib/text.ts`): Urdu digits become 0-9 and "2,000" becomes 2000. Spelling variants collapse to one form
   (khaana → khana, kapray/kaprey → kapre, shoes → shoe, café → cafe).
2. **Look up meanings** (`lib/lexicon.ts`): English, Roman Urdu and Urdu words map to a city, category or subcategory, a
   channel (delivery / online / in-store), "ending soon", or a filler word that is ignored ("deals", "mein", "میں" …).
   Two-word phrases ("fast food", "ghar pe", "اسلام آباد") are checked first.
3. **Numbers**: `30%`, `30 percent`, `half`/`aadha` set a minimum discount. `under 2000`, `2k tak`, `2000 se kam` set a
   maximum price. A bare number guesses: 100 or more is a price, 95 or less is a discount.
4. **Typos**: a word that is not known exactly is matched with an edit distance (a neighbour swap counts as 1). Words
   of 5–7 letters allow 1 typo and 8+ allow 2. The word being typed may also be a prefix ("laho" → Lahore).
5. **Everything else** (brands, dishes, products) is corrected against the words that exist in the deals
   ("khadi" → Khaadi) and must appear in the deal text.

`lib/server/search.ts` then filters and ranks. It never shows an empty screen when it can avoid it: it relaxes the
city first, then requires *any* word instead of all of them, then ignores unknown words, and tells the user what it did.

**To teach it a new word**, add it to the right line in `lib/lexicon.ts`. Bank names are not there: they come
from the `bank_aliases` column of `data/cards.csv` ("hbl|habib bank|ایچ بی ایل"). To add a city, add it to `CITIES` in
`lib/taxonomy.ts`, to `CityId` in `lib/types.ts`, and to `lib/lexicon.ts`.

## Rules that keep the UI consistent

- **Calm layout, not a dashboard** (from a design review that found the screen congested):
  - *Fewer, wider cards.* Cards are at least 17rem wide; five narrow cards per row looked like a spreadsheet.
  - *Fewer bands.* Every row above the deals has to earn its place: the search joins the header on desktop, what
    search understood joins the results line, and a filter row with nothing to choose (e.g. one category left) hides.
  - *Two alignment lines on desktop:* the sidebar's edge, and the results' edge (search, results line and cards all
    start there). The header is the same width as the results.
  - *One highlight per section.* Only a real choice is tinted blue; "All deals" / "All brands" just turn bold.
  - *No boxes inside boxes.* The sidebar sits on the page (no panel), counts are plain numbers (no bubbles), cards
    have a border but no resting shadow, and the picture placeholder blends into the page.

- **No raw values in components.** Colours, font sizes, radii, widths and shadows come from `styles/theme.css`
  (`text-ink`, `text-title`, `rounded-card`, `max-w-browse`, `shadow-card-hover` …). Change a token, the whole app follows.
- **"Clear" palette: only 4 colours, each with one meaning** (all in `styles/theme.css`). Warm white and near-black
  neutrals for almost everything; `primary` (blue) = actions, links and "selected"; `save` (green) = money saved:
  "You save Rs …" and the "% OFF" tag; `urgent` (amber) = "Ends tonight/tomorrow". Shadows are soft and quiet.
  Do not add colours or use a meaning colour for decoration, or the page gets busy and colours stop meaning anything.
- **Repeated looks are named classes** in `styles/components.css` (`deal-card`, `pill`, `chip`, `field`, `like-btn` …).
- **Icons are SVG** and live in `components/ui/Icon.tsx`. Add a path there, then use `<Icon name="…" />`.
- **Animations must end with `backwards`, not `both`.** A lingering `transform` would trap `position: fixed`
  modals and sheets inside their parent.
- **Layout is height-aware.** The page is `h-svh`; the results panel fills what is left and scrolls on its own.
  Phones in landscape get a minimum height and the page may scroll.
- **Interactive parts come from Radix** (`radix-ui`), so keyboard, focus and screen readers work everywhere:
  `Select` for the city and sort dropdowns, `ToggleGroup` for category and type filters (arrow keys move between
  pills), `Toggle` for Liked, `Dialog` for deal details (focus stays inside, Esc closes, the page behind does not
  scroll, focus returns to the card), `Label` for the search box. Radix has no input or card component, so the
  input is a plain `<input>` with a Radix label, and the card is Magic UI's `MagicCard`.
- **Magic UI, used once.** `components/ui/MagicCard.tsx` (from magicui.design, MIT) gives deal cards a soft
  spotlight that follows the mouse. It ignores touch, so phones stay plain. Keep effects like this rare.

## Adding data

Add a row to `data/deals.csv` (columns explained in docs/GETTING-STARTED.md), then run `npm run data:check`.
Write the `title` as what you get, without the discount ("Fast food bill"); fill `offer` only when the headline is
not a plain percentage ("Free", "Buy 1 Get 1"). Always fill `source_url` and `checked_on`.
