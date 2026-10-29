-- DiscDeal: Postgres schema (PostgreSQL 15+, works on Supabase).
-- Status: design reference. It has not been run against a database yet; review it when the database is set up.
--
-- How search will work with this schema (same contract as lib/server/search.ts):
--   1. The API parses the query text with lib/intent.ts (cities, categories, channels, % off, max price, words).
--      The typo-correction vocabulary comes from `search_vocab` below (cache it in the app for an hour).
--   2. One SQL query filters with indexes, ranks, counts per category (facets) and returns one page.
--   3. GET /api/deals caches each answer ("use cache", 1 minute) and the CDN caches it too (s-maxage),
--      so 100 people searching "pizza lahore" at the same moment cost one database query.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- vocabulary (mirrors lib/taxonomy.ts)
create table cities (
  id    text primary key,              -- 'lahore'
  label text not null                  -- 'Lahore'
);

create table categories (
  id    text primary key,              -- 'food'
  label text not null,
  short text not null,
  icon  text not null
);

create table subcategories (
  id          text primary key,        -- 'food-fastfood'
  category_id text not null references categories (id),
  label       text not null
);

-- One brand can have deals in many categories (Daraz: fashion + electronics).
create table brands (
  id       bigint generated always as identity primary key,
  slug     text not null unique,     -- 'khaadi', 'j-junaid-jamshed' (the API's ?brand= value)
  name     text not null unique,
  logo_url text
);

-- ---------------------------------------------------------------- deals
create table deals (
  id             bigint generated always as identity primary key,
  brand_id       bigint not null references brands (id),
  title          text not null,
  description    text not null default '',
  category_id    text not null references categories (id),
  subcategory_id text not null references subcategories (id),
  price          numeric(12, 2) not null check (price >= 0),
  original_price numeric(12, 2) not null check (original_price > 0 and original_price >= price),
  discount_pct   smallint generated always as (round((1 - price / original_price) * 100)::smallint) stored,
  offer          text,                 -- headline when not a plain %: 'Buy 1 Get 1', 'Free' (else "{discount_pct}% OFF")
  code           text,
  channels       text[] not null check (channels <@ array['in-store', 'delivery', 'online']),
  tags           text[] not null default '{}',
  icon           text not null,
  image_url      text,
  url            text not null,
  starts_at      timestamptz not null default now(),
  ends_at        timestamptz not null,
  is_active      boolean not null default true,
  -- Lower-cased brand + title + offer + description + tags + category/subcategory/city labels.
  -- Written by the app (or a trigger) whenever a deal changes; the search below matches against it.
  search_text    text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Cities with a branch that honours the deal. No rows = nationwide.
create table deal_cities (
  deal_id bigint not null references deals (id) on delete cascade,
  city_id text not null references cities (id),
  primary key (deal_id, city_id)
);

-- Every filter in the UI has an index behind it. Partial indexes skip expired/inactive deals.
create index deal_cities_city_idx on deal_cities (city_id, deal_id);
create index deals_category_idx   on deals (category_id, subcategory_id) where is_active;
create index deals_ends_idx       on deals (ends_at) where is_active;
create index deals_discount_idx   on deals (discount_pct desc) where is_active;
create index deals_price_idx      on deals (price) where is_active;
create index deals_brand_idx      on deals (brand_id, category_id) where is_active;
-- Makes `search_text ilike '%word%'` and similarity() fast, even with typos left over.
create index deals_search_trgm    on deals using gin (search_text gin_trgm_ops) where is_active;

-- Every word that appears in live deals: the vocabulary lib/intent.ts corrects typos against ("khadi" → khaadi).
create materialized view search_vocab as
  select word, count(*) as deals
  from deals, regexp_split_to_table(search_text, '[^[:alnum:]]+') as word
  where is_active and length(word) > 1
  group by word;
create unique index search_vocab_word_idx on search_vocab (word);
-- After imports/edits: refresh materialized view concurrently search_vocab;

-- ---------------------------------------------------------------- the search query (reference)
-- Parameters come from the parsed intent and the API's query:
--   $1 cities text[]       ('{}' = any city)          $7  ending_soon boolean
--   $2 categories text[]   (named in the search text) $8  terms text[] (typo-corrected words)
--   $3 subcategories text[]                           $9  category chip (text or null)
--   $4 channels text[]                                $10 subcategory chip (text or null)
--   $5 min_discount int (or null)                     $11 limit, $12 offset
--   $6 max_price numeric (or null)
--
-- with matched as (
--   select d.*, b.name as brand, b.slug as brand_slug,
--          (select coalesce(sum(similarity(d.search_text, t)), 0) from unnest($8::text[]) t)
--            + case when exists (select 1 from deal_cities dc where dc.deal_id = d.id and dc.city_id = any($1)) then 2 else 0 end
--            as score
--   from deals d
--   join brands b on b.id = d.brand_id
--   where d.is_active and d.ends_at > now()
--     and (cardinality($1) = 0
--          or not exists (select 1 from deal_cities dc where dc.deal_id = d.id)                       -- nationwide
--          or exists (select 1 from deal_cities dc where dc.deal_id = d.id and dc.city_id = any($1)))
--     and (cardinality($2) + cardinality($3) = 0 or d.category_id = any($2) or d.subcategory_id = any($3))
--     and (cardinality($4) = 0 or d.channels && $4)
--     and ($5::int is null or d.discount_pct >= $5)
--     and ($6::numeric is null or d.price <= $6)
--     and (not $7 or d.ends_at < now() + interval '2 days')
--     and (select bool_and(d.search_text ilike '%' || t || '%') from unnest($8::text[]) t) is not false
-- ),
-- facets as (
--   -- Faceted counts: each filter counted with every OTHER filter applied ($13 = brand slug or null).
--   select
--     (select jsonb_object_agg(category_id, n) from (select category_id, count(*) n from matched
--        where $13::text is null or brand_slug = $13 group by category_id) c) as category_counts,  -- ignores the category chip
--     (select jsonb_agg(b order by b.name) from (select brand_slug as id, brand as name, count(*) n from matched
--        where ($9::text is null or category_id = $9) and ($10::text is null or subcategory_id = $10)
--        group by brand_slug, brand) b) as brands                                                   -- ignores the brand
-- )
-- select m.*, count(*) over () as total, (select category_counts from facets)
-- from matched m
-- where ($9::text is null or m.category_id = $9) and ($10::text is null or m.subcategory_id = $10)
--   and ($13::text is null or m.brand_slug = $13)
-- order by m.score desc, m.discount_pct desc       -- or discount_pct desc / ends_at / price, per the sort chip
-- limit $11 offset $12;
--
-- If the query returns nothing, relax it the same way lib/server/search.ts does: drop the city, then require
-- any word instead of all, then ignore the words. Each step is the same query with fewer conditions.
