-- ============================================================================
-- Fix: shop owners could create a product row (products_owner_insert already
-- allowed this) but were then silently blocked by RLS from seeding inventory
-- or attaching product images for that same product, because those two
-- tables only had admin-only write policies. This adds owner-scoped policies
-- alongside the existing admin ones (does not remove admin access).
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- INVENTORY: allow shop owners to manage inventory rows for products they own
create policy "inventory_owner_insert" on inventory for insert
  with check (exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));

create policy "inventory_owner_update" on inventory for update
  using (exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));

-- PRODUCT IMAGES: allow shop owners to manage images for products they own
create policy "product_images_owner_insert" on product_images for insert
  with check (exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));

create policy "product_images_owner_update" on product_images for update
  using (exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));

create policy "product_images_owner_delete" on product_images for delete
  using (exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));
