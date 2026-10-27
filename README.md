# DiscDeal

Search and browse discounts and deals. Built with Next.js (App Router), React and Tailwind CSS v4.

```bash
npm run dev     # http://localhost:3000
npm run lint
```

## How the screen works

One screen, no page scrolling. At first only the hero and search bar are shown. Pressing **Search** reveals the
category checkboxes, the brand / **Liked** tabs and a single horizontally scrolling row of deal cards.
"View details" opens a modal; the heart saves a deal to the **Liked** tab (kept in `localStorage`).

## Project structure

```
app/
  page.tsx               page shell: owns the search text and "browsing" state
  layout.tsx             fonts, theme-init script (runs before paint, no flash)
  globals.css            imports Tailwind + the two style files below
  api/deals/route.ts     GET /api/deals  (q, subs, brand, ids)
styles/
  theme.css              DESIGN TOKENS: colours (light/dark), fonts, type scale, radii, widths, shadows, motion
  components.css         shared classes built from the tokens: card, field, badge, tab, checkbox, scroller …
components/
  ui/                    small reusable pieces: Icon, LikeButton, CopyCodeButton, ScrollRow, ThemeToggle, BrandLogo
  layout/                Navbar
  home/                  Hero, SearchBar (the first screen)
  deals/                 DealsBrowser (composes the rest), CategorySidebar, BrandTabs, ResultsList, DealCard, DealModal
hooks/
  useDealSearch.ts       fetches /api/deals (debounced, cancels stale requests)
  useBrowseFilters.ts    checked subcategories, brand tab, Liked view
  useLikedDeals.ts       liked ids in localStorage (external store, synced across tabs)
lib/
  types.ts               shared types
  catalog.ts             categories, subcategories and the deals (swap DEALS for a real source here)
  search.ts              parse + filter logic used by the API route
  format.ts              price / date text
```

Data flows one way: `page.tsx` → `DealsBrowser` → hooks → `/api/deals` → `lib/search.ts` → `lib/catalog.ts`.

## Rules that keep the UI consistent

- **No raw values in components.** Colours, font sizes, radii, widths and shadows come from `styles/theme.css`
  (`text-ink`, `text-title`, `rounded-card`, `max-w-browse`, `shadow-card-hover` …). Change a token, the whole app follows.
- **Repeated looks are named classes** in `styles/components.css` (`card`, `field`, `tab`, `checkbox`, `like-btn` …).
- **Icons are SVG** and live in `components/ui/Icon.tsx`. Add a path there, then use `<Icon name="…" />`.
- **Animations must end with `backwards`, not `both`.** A lingering `transform` would trap `position: fixed`
  modals and sheets inside their parent.
- **Layout is height-aware.** The page is `h-svh`; the deal row fills what is left. Cards shrink their picture on
  short screens and grow it (up to a cap) on tall ones. Phones in landscape get a minimum height and may scroll.
- **Nothing in the category area scrolls sideways.** On small screens it becomes a "Categories" bottom sheet.

## Adding data

Add an entry to `DEALS` in `lib/catalog.ts` (pick a `subcategory` id from `CATEGORIES`, an `icon`, optionally an `image` URL).
