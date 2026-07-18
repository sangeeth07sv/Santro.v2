-- ============================================================================
-- MIGRATION 006: flash sale fields + product view tracking (for Trending)
-- Run in the Supabase SQL Editor after migration 005.
-- ============================================================================

-- FLASH SALE: manual on/off flag + a real end timestamp for the homepage
-- countdown. Both are required together — is_flash_sale alone with no
-- end time would give a countdown with nothing to count down to.
alter table products add column if not exists is_flash_sale boolean not null default false;
alter table products add column if not exists flash_sale_ends_at timestamptz;

create index if not exists idx_products_flash_sale
  on products(is_flash_sale, flash_sale_ends_at)
  where is_flash_sale = true;

-- TRENDING: a simple, real signal (page views) instead of a fake ranking.
-- No separate events table yet — this is a running counter incremented on
-- each product detail view. Good enough to rank "trending" for an MVP;
-- revisit with a time-windowed events table if you need "trending this week"
-- instead of "trending all-time".
alter table products add column if not exists view_count integer not null default 0;

create index if not exists idx_products_view_count on products(view_count desc);

-- Atomic increment avoids read-then-write races under concurrent traffic.
create or replace function public.increment_product_view(p_product_id uuid)
returns void as $$
  update products set view_count = view_count + 1 where id = p_product_id;
$$ language sql security definer;

-- ============================================================================
-- END MIGRATION 006
-- ============================================================================
