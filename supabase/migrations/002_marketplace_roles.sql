-- ============================================================================
-- MIGRATION 002: customer / shop_owner / delivery_partner roles
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- Safe to run once on a project that already has schema.sql applied.
-- ============================================================================

-- ---------- 1. WIDEN THE ROLE COLUMN ----------
-- Switching from a fixed enum to text + check constraint avoids the
-- "ALTER TYPE ... ADD VALUE cannot run in the same transaction it's used in"
-- problem and makes it trivial to add more roles later without downtime.
alter table profiles alter column role drop default;
alter table profiles alter column role type text using role::text;
alter table profiles add constraint profiles_role_check
  check (role in ('customer', 'admin', 'shop_owner', 'delivery_partner'));
alter table profiles alter column role set default 'customer';

-- ---------- 2. PRODUCT OWNERSHIP ----------
-- Nullable on purpose: existing/admin-created products have no individual owner.
alter table products add column if not exists owner_id uuid references profiles(id) on delete set null;
create index if not exists idx_products_owner on products(owner_id);

-- ---------- 3. ROLE HELPER FUNCTIONS (mirrors existing is_admin()) ----------
create or replace function public.is_shop_owner()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'shop_owner');
$$ language sql security definer stable;

create or replace function public.is_delivery_partner()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'delivery_partner');
$$ language sql security definer stable;

-- ---------- 4. PRODUCTS: shop owners manage their own rows, admin manages all ----------
drop policy if exists "products_admin_insert" on products;
drop policy if exists "products_admin_update" on products;
drop policy if exists "products_admin_delete" on products;

create policy "products_owner_insert" on products for insert
  with check (is_admin() or (is_shop_owner() and owner_id = auth.uid()));

create policy "products_owner_update" on products for update
  using (is_admin() or (is_shop_owner() and owner_id = auth.uid()));

create policy "products_owner_delete" on products for delete
  using (is_admin() or (is_shop_owner() and owner_id = auth.uid()));

-- ---------- 5. PRODUCT IMAGES / INVENTORY: extend write access to the owning shop ----------
drop policy if exists "product_images_admin_write" on product_images;
drop policy if exists "product_images_admin_update" on product_images;
drop policy if exists "product_images_admin_delete" on product_images;

create policy "product_images_owner_write" on product_images for insert
  with check (is_admin() or exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));
create policy "product_images_owner_update" on product_images for update
  using (is_admin() or exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));
create policy "product_images_owner_delete" on product_images for delete
  using (is_admin() or exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));

drop policy if exists "inventory_admin_write" on inventory;
drop policy if exists "inventory_admin_update" on inventory;

create policy "inventory_owner_write" on inventory for insert
  with check (is_admin() or exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));
create policy "inventory_owner_update" on inventory for update
  using (is_admin() or exists (select 1 from products p where p.id = product_id and p.owner_id = auth.uid()));

-- ---------- 6. ORDERS: delivery partners can see and update status ----------
-- NOTE (limitation): there is no per-partner assignment table yet, so every
-- delivery partner can currently see every order. Fine for a single-city MVP;
-- revisit with a `delivery_assignments` table before this scales past one
-- or two partners.
create policy "orders_delivery_read" on orders for select
  using (is_delivery_partner());

create policy "orders_delivery_update_status" on orders for update
  using (is_delivery_partner())
  with check (is_delivery_partner());

-- ---------- 7. SIGNUP: read the self-selected role, but never allow "admin" via signup ----------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'customer');
begin
  if requested_role not in ('customer', 'shop_owner', 'delivery_partner') then
    requested_role := 'customer';
  end if;

  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', requested_role);
  insert into public.carts (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- END MIGRATION 002
-- ============================================================================
