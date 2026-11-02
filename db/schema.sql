-- DiscDeal database (Postgres; tested with Supabase-compatible Postgres via `npm run db:test`).
--
-- How to use (once):
--   Supabase → your project → SQL Editor → paste this whole file → Run.
-- (Safe to run again: it only creates what is missing.)
-- Then load the spreadsheets:
--   npm run db:import          (reads data/cards.csv and data/deals.csv, see docs/GETTING-STARTED.md)
--
-- Version 1 keeps it simple on purpose: one `deals` table with the same columns as data/deals.csv.
-- The website loads the live deals into memory (a few thousand rows is tiny) and runs the smart search there,
-- cached for a minute, so the database sees roughly one query a minute no matter how many people visit.
-- When there are tens of thousands of deals, move the filtering into SQL (pg_trgm + indexes) or a search engine
-- like Meilisearch/Typesense; the API and the UI do not need to change.

-- Banks and their cards (same columns as data/cards.csv). A deal's card_ids refer to cards.card_id.
create table if not exists cards (
  card_id      text primary key,                      -- 'hbl-konnect-debit'
  bank_id      text not null,                         -- 'hbl'
  bank_name    text not null,                         -- 'HBL'
  bank_short   text not null,
  bank_aliases text not null default '',              -- search words, '|'-separated: 'hbl|habib bank|konnect'
  card_name    text not null,                         -- 'HBL Konnect Debit Card'
  card_short   text not null,                         -- 'HBL Konnect Debit'
  is_active    boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table if not exists deals (
  -- Stable id worked out from brand + title + cards + source (lib/deals-csv.ts → dealId), so likes survive re-imports.
  id             bigint primary key,
  brand          text not null,
  offer          text not null default '',             -- headline when not a plain %: 'Free', 'Buy 1 Get 1', 'Up to 50% OFF'
  discount_pct   smallint not null check (discount_pct between 0 and 100),
  title          text not null,                         -- what you get, without the discount
  description    text not null default '',
  category       text not null,                         -- ids from lib/taxonomy.ts
  subcategory    text not null,
  cities         text[] not null default '{}',          -- empty = nationwide
  channels       text[] not null default '{in-store}',
  card_ids       text[] not null default '{}',          -- empty = no card needed
  price          numeric(12, 2),
  original_price numeric(12, 2),
  code           text not null default '',
  valid_until    date,                                  -- null = ongoing; the website hides a deal after this day
  source_url     text not null,                         -- the bank's or brand's own page
  checked_on     date not null,                         -- when someone last checked the source
  tags           text not null default '',
  image_url      text not null default '',
  is_active      boolean not null default true,         -- false = removed from the spreadsheet (kept for history)
  updated_at     timestamptz not null default now()
);

create index if not exists deals_live_idx on deals (is_active, valid_until);

-- The website only reads. If you use Supabase's public API keys anywhere, turn on Row Level Security so nobody can
-- write through them (the website connects with the private database URL from the server, which is not affected).
alter table deals enable row level security;
alter table cards enable row level security;
