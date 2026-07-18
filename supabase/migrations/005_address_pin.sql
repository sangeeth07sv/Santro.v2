-- ============================================================================
-- MIGRATION 005: GPS pin for customer delivery addresses
-- Run in the Supabase SQL Editor after migration 004.
-- ============================================================================

alter table addresses add column if not exists latitude double precision;
alter table addresses add column if not exists longitude double precision;

-- ============================================================================
-- END MIGRATION 005
-- ============================================================================
