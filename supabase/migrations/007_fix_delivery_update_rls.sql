-- ============================================================================
-- MIGRATION 007: fix over-permissive delivery-partner order update policy
-- Run in the Supabase SQL Editor after migration 006.
-- ============================================================================
--
-- BUG: schema.sql defines "orders_delivery_update" scoped to
--   is_delivery_partner() AND delivery_partner_id = auth.uid()
-- which is correct, but migration 002 later added a SECOND update policy,
-- "orders_delivery_update_status", scoped only to is_delivery_partner() with
-- no ownership check at all. Postgres OR's multiple permissive policies for
-- the same command together, so the looser policy silently won: any
-- delivery partner could update the status of ANY order, not just their own
-- or an unclaimed one.
--
-- The intent of the migration-002 policy was to let a partner claim an
-- unassigned order (delivery_partner_id is null) in the same UPDATE that
-- sets delivery_partner_id = auth.uid() — the schema.sql policy alone can't
-- do that, because its USING clause checks the row's CURRENT (pre-update)
-- delivery_partner_id, which is null before a claim. This migration replaces
-- it with a version scoped to "unclaimed OR already mine".

drop policy if exists "orders_delivery_update_status" on orders;

create policy "orders_delivery_claim_or_own_update" on orders for update
  using (
    is_delivery_partner()
    and (delivery_partner_id is null or delivery_partner_id = auth.uid())
  )
  with check (
    is_delivery_partner()
    and (delivery_partner_id is null or delivery_partner_id = auth.uid())
  );

-- ============================================================================
-- END MIGRATION 007
-- ============================================================================
