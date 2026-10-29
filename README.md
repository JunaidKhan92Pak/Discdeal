# DiscDeal

Smart search for discounts and deals across Pakistan. Built with Next.js (App Router), React and Tailwind CSS v4.

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run typecheck
```

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
3. **Toolbar**: number of deals · Brand (phones and tablets) · sort (best match / biggest discount / ending soon /
   lowest price) · ♥ Liked.
4. **Deals**: a grid of picture-first cards that scrolls inside its own panel. 2 columns on phones; on larger
   screens as many as fit at 17rem or wider (3 on a laptop next to the sidebar), so cards never get cramped.
   24 load at a time; **Show more deals** loads the next 24.

The 📍 city pill in the navbar is remembered (`localStorage`). A city typed in the search wins over it. Tapping a card
opens the details: a bottom sheet on phones, a dialog on larger screens. The heart saves a deal to **Liked**.

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
app/
  page.tsx               page shell: search text, saved city, "browsing" state (with a cross-fade)
  layout.tsx             fonts, theme-init script (runs before paint, no flash)
  globals.css            imports Tailwind + the two style files below
  api/deals/route.ts     GET /api/deals: validated params → cached search → one page of results
styles/
  theme.css              DESIGN TOKENS: colours (light/dark), fonts, type scale, radii, widths, shadows, motion
  components.css         shared classes built from the tokens: deal-card, pill, chip, field, badge, media …
components/
  ui/                    small reusable pieces: Icon, Select (Radix), MagicCard (Magic UI), LikeButton, CopyCodeButton,
                         ThemeToggle
  layout/                Header (logo, search, city, theme: one row on desktop once browsing)
  home/                  Hero, SearchBar, QuickSearches (the first screen)
  deals/                 DealsBrowser (composes the rest), IntentChips, FilterSidebar (desktop), CategoryBar (phones),
                         BrandList + BrandPicker, ResultsToolbar, ResultsGrid, DealCard, OfferText, DealModal
hooks/
  useDeals.ts            fetches /api/deals: debounced, cancels stale requests, caches pages, load more, retry
  useBrowseFilters.ts    category / subcategory pill, sort, Liked view
  useSavedCity.ts        the 📍 city, remembered in localStorage
  useLikedDeals.ts       liked ids in localStorage (external store, synced across tabs)
lib/
  types.ts               shared types, including the API contract (DealQuery → DealsPage)
  taxonomy.ts            cities, categories, subcategories, channels (small; used by browser and server)
  query.ts               the API's URL format: build it (browser) and validate it (server)
  lexicon.ts             smart-search dictionary: English / Roman Urdu / Urdu words → meaning
  intent.ts              query text → filters + leftover words (typo-corrected)
  text.ts                tokenize, fold spelling variants, typo distance
  format.ts              price / city / date text
  data/sample-deals.ts   SAMPLE deals (server only) until the database is connected
  server/deals-source.ts the one switch between data sources (in-memory today, Postgres later)
  server/search.ts       in-memory source: match + rank + relax + facets + pages
db/
  schema.sql             Postgres tables, indexes and the reference search query (not yet run against a database)
```

Data flows one way: `page.tsx` → `DealsBrowser` → `useDeals` → `GET /api/deals` → `lib/server/deals-source.ts`.
The deal data never ships to the browser; only one page of results does.

## Ready for a database and real traffic

- **The API contract is fixed** (`DealQuery` → `DealsPage` in `lib/types.ts`): filters, sort, `offset`/`limit` paging,
  per-category counts, and what smart search understood. The UI only knows this contract.
- **Moving to Postgres** = write `searchPostgres()` with the same signature and switch the export in
  `lib/server/deals-source.ts`. `db/schema.sql` has the tables, an index behind every filter (including a trigram
  index for typo-tolerant text matching) and the query to start from. The UI does not change.
- **Caching in three layers**, so a burst of identical searches costs one database query:
  1. the browser keeps the last 60 pages it fetched (back to an earlier search = instant);
  2. the server caches each distinct query for a minute (`"use cache"` + `cacheLife("minutes")` in the route);
  3. the CDN caches responses (`s-maxage=60, stale-while-revalidate=300`).
- **Untrusted input is bounded**: unknown ids are dropped, `limit` ≤ 48, `offset` ≤ 2000, text ≤ 120 characters,
  at most 200 liked ids. Errors return JSON with status 500 and the UI offers "Try again".
- **Long lists stay smooth**: cards off screen skip layout and paint (`content-visibility: auto`).

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

**To teach it a new word**, add it to the right line in `lib/lexicon.ts`. To add a city, add it to `CITIES` in
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

Until the database is connected, add an entry to `RAW` in `lib/data/sample-deals.ts`. Write the `title` as what you
get, without the discount ("Unstitched lawn, 3-piece"); add `offer` only when the headline is not a plain percentage
("Buy 1 Get 1"). Pick a `subcategory` id from
`CATEGORIES`, the `cities` (empty = nationwide), the `channels`, a few search `tags`, an `icon`, and optionally an
`image` URL. Prices are in PKR.
