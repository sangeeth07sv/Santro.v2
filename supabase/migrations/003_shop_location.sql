-- ============================================================================
-- MIGRATION 003: shop details + GPS location for local product matching
-- Run in the Supabase SQL Editor after migration 002.
-- ============================================================================

-- Plain lat/lng columns rather than PostGIS — keeps this manageable without
-- an extra extension, distance math is done in the app layer (Haversine).
alter table profiles add column if not exists shop_name text;
alter table profiles add column if not exists shop_address text;
alter table profiles add column if not exists latitude double precision;
alter table profiles add column if not exists longitude double precision;

create index if not exists idx_profiles_shop_location on profiles(latitude, longitude)
  where role = 'shop_owner';

-- Shop owners can update their own shop details (already covered by the
-- existing "profiles_update_own" policy from schema.sql, no new policy
-- needed — this comment just documents that).

-- ============================================================================
-- END MIGRATION 003
-- ============================================================================
