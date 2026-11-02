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

-- Accounts. People register to save ("like") deals. Passwords are never stored, only a scrypt hash
-- (lib/server/password.ts). username and email are stored lowercase so logging in ignores capitals.
create table if not exists users (
  id            bigint generated always as identity primary key,
  username      text not null unique,                  -- 'junaid_92' (3–20 of a-z 0-9 _ .)
  name          text not null,                         -- 'Junaid Sultan'
  city          text not null,                         -- a city id from lib/taxonomy.ts
  email         text not null unique,
  phone         text not null,                         -- '+923001234567'
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- Who is logged in. The browser keeps a random token in a private cookie; only its SHA-256 is stored here,
-- so a copy of this table cannot be used to log in. Logging out deletes the row.
create table if not exists sessions (
  token_hash text primary key,
  user_id    bigint not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions (user_id);

-- Liked deals, per account. deal_id is a deal's stable id (deals.id); no foreign key, so likes survive a deal
-- being re-imported or ending, and also work when the deals come from the spreadsheet.
create table if not exists likes (
  user_id    bigint not null references users (id) on delete cascade,
  deal_id    bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

alter table users enable row level security;
alter table sessions enable row level security;
alter table likes enable row level security;
