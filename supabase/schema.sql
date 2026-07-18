-- ============================================================================
-- E-COMMERCE SCHEMA FOR SUPABASE (PostgreSQL)
-- Run this in Supabase SQL Editor. Safe to run top to bottom on a fresh project.
-- ============================================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy product search

-- ---------- ENUM TYPES ----------
-- Text + check constraint instead of a fixed enum, so new roles can be added
-- later without an "ALTER TYPE ... ADD VALUE" migration headache.
create domain user_role as text check (value in ('customer', 'admin', 'shop_owner', 'delivery_partner'));
create type order_status as enum ('pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','refunded');
create type payment_status as enum ('pending','paid','failed','refunded');
create type payment_method as enum ('razorpay','stripe','upi','cod');
create type coupon_type as enum ('percentage','fixed');

-- ============================================================================
-- TABLES
-- ============================================================================

-- PROFILES (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  role user_role not null default 'customer',
  -- shop_owner-only fields (null for other roles)
  shop_name text,
  shop_description text,
  -- delivery_partner-only fields (null for other roles)
  vehicle_number text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CATEGORIES
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- PRODUCTS
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references categories(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null, -- shop owner; null = admin-managed
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  sku text unique,
  brand text,
  attributes jsonb not null default '{}',  -- e.g. {"size":["S","M","L"],"color":["red","blue"]}
  is_active boolean not null default true,
  is_featured boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_search on products using gin(search_vector);
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);
create index idx_products_category on products(category_id);

-- PRODUCT IMAGES
create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- INVENTORY (per product, optionally per variant via attributes hash)
create table inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  variant_key text not null default 'default', -- e.g. "size:M|color:red"
  quantity int not null default 0 check (quantity >= 0),
  low_stock_threshold int not null default 5,
  updated_at timestamptz not null default now(),
  unique(product_id, variant_key)
);

-- CARTS
create table carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CART ITEMS
create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_key text not null default 'default',
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique(cart_id, product_id, variant_key)
);

-- WISHLISTS
create table wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- ADDRESSES
create table addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'IN',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- COUPONS
create table coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  type coupon_type not null,
  value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  max_discount numeric(10,2),
  usage_limit int,
  used_count int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ORDERS
create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique default ('ORD-' || to_char(now(),'YYYYMMDD') || '-' || substr(uuid_generate_v4()::text,1,8)),
  user_id uuid not null references auth.users(id) on delete restrict,
  status order_status not null default 'pending',
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  shipping_fee numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  coupon_id uuid references coupons(id) on delete set null,
  delivery_partner_id uuid references profiles(id) on delete set null,
  shipping_address jsonb not null,
  billing_address jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDER ITEMS (snapshot of product at purchase time)
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_image text,
  variant_key text not null default 'default',
  unit_price numeric(10,2) not null,
  quantity int not null,
  line_total numeric(10,2) not null
);

-- PAYMENTS
create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  status payment_status not null default 'pending',
  amount numeric(10,2) not null,
  provider_payment_id text,
  provider_order_id text,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

-- REVIEWS
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_item_id uuid references order_items(id) on delete set null, -- verified purchase
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  images text[] default '{}',
  created_at timestamptz not null default now(),
  unique(product_id, user_id)
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info', -- order_update | promo | system
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- BANNERS (admin marketing)
create table banners (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  image_url text not null,
  link_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  chosen_role text := coalesce(new.raw_user_meta_data->>'role', 'customer');
begin
  if chosen_role not in ('customer', 'shop_owner', 'delivery_partner') then
    chosen_role := 'customer'; -- never let signup metadata grant 'admin'
  end if;

  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', chosen_role);
  insert into public.carts (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_products_updated before update on products for each row execute function set_updated_at();
create trigger trg_orders_updated before update on orders for each row execute function set_updated_at();

-- maintain product search_vector
create or replace function public.products_search_update()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.brand,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description,'')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger trg_products_search before insert or update on products
  for each row execute function products_search_update();

-- recalc product rating after review changes
create or replace function public.recalc_product_rating()
returns trigger as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
begin
  update products p
  set rating_avg = coalesce((select round(avg(rating)::numeric,2) from reviews where product_id = pid),0),
      rating_count = (select count(*) from reviews where product_id = pid)
  where p.id = pid;
  return null;
end;
$$ language plpgsql security definer;

create trigger trg_reviews_recalc
  after insert or update or delete on reviews
  for each row execute function recalc_product_rating();

-- decrement inventory on order confirmation (called from a server action/RPC, not a raw trigger,
-- to keep control in application logic). Exposed as an RPC function:
create or replace function public.decrement_inventory(p_product_id uuid, p_variant_key text, p_qty int)
returns void as $$
begin
  update inventory
  set quantity = quantity - p_qty, updated_at = now()
  where product_id = p_product_id and variant_key = p_variant_key;

  if not found then
    raise exception 'Inventory row not found for product %', p_product_id;
  end if;
end;
$$ language plpgsql security definer;

-- atomic "apply coupon" usage counter
create or replace function public.increment_coupon_usage(p_coupon_id uuid)
returns void as $$
begin
  update coupons set used_count = used_count + 1 where id = p_coupon_id;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table inventory enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table wishlists enable row level security;
alter table addresses enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table banners enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

create or replace function public.is_shop_owner()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'shop_owner');
$$ language sql security definer stable;

create or replace function public.is_delivery_partner()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'delivery_partner');
$$ language sql security definer stable;

-- PROFILES
create policy "profiles_select_own_or_admin" on profiles for select using (auth.uid() = id or is_admin());
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_admin_all" on profiles for all using (is_admin()) with check (is_admin());

-- CATEGORIES (public read, admin write)
create policy "categories_public_read" on categories for select using (is_active = true or is_admin());
create policy "categories_admin_write" on categories for insert with check (is_admin());
create policy "categories_admin_update" on categories for update using (is_admin());
create policy "categories_admin_delete" on categories for delete using (is_admin());

-- PRODUCTS (public read active; admin full; shop owners manage their own)
create policy "products_public_read" on products for select using (is_active = true or is_admin() or owner_id = auth.uid());
create policy "products_owner_insert" on products for insert
  with check (is_admin() or (is_shop_owner() and owner_id = auth.uid()));
create policy "products_owner_update" on products for update
  using (is_admin() or (is_shop_owner() and owner_id = auth.uid()));
create policy "products_owner_delete" on products for delete
  using (is_admin() or (is_shop_owner() and owner_id = auth.uid()));

-- PRODUCT IMAGES (public read, admin write)
create policy "product_images_public_read" on product_images for select using (true);
create policy "product_images_admin_write" on product_images for insert with check (is_admin());
create policy "product_images_admin_update" on product_images for update using (is_admin());
create policy "product_images_admin_delete" on product_images for delete using (is_admin());

-- INVENTORY (public read qty for stock display, admin write)
create policy "inventory_public_read" on inventory for select using (true);
create policy "inventory_admin_write" on inventory for insert with check (is_admin());
create policy "inventory_admin_update" on inventory for update using (is_admin());
create policy "inventory_admin_delete" on inventory for delete using (is_admin());

-- CARTS (own only)
create policy "carts_own" on carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CART ITEMS (own cart only)
create policy "cart_items_own" on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

-- WISHLISTS (own only)
create policy "wishlists_own" on wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ADDRESSES (own only, admin read)
create policy "addresses_own" on addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses_admin_read" on addresses for select using (is_admin());

-- COUPONS (public read active ones for validation, admin write)
create policy "coupons_public_read_active" on coupons for select using (is_active = true or is_admin());
create policy "coupons_admin_write" on coupons for insert with check (is_admin());
create policy "coupons_admin_update" on coupons for update using (is_admin());
create policy "coupons_admin_delete" on coupons for delete using (is_admin());

-- ORDERS (own only; admin full; assigned delivery partner can view/update status)
create policy "orders_own_select" on orders for select
  using (auth.uid() = user_id or is_admin() or delivery_partner_id = auth.uid());
create policy "orders_own_insert" on orders for insert with check (auth.uid() = user_id);
create policy "orders_admin_update" on orders for update using (is_admin());
create policy "orders_delivery_update" on orders for update
  using (is_delivery_partner() and delivery_partner_id = auth.uid());

-- ORDER ITEMS (via parent order ownership)
create policy "order_items_select" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));
create policy "order_items_insert" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- PAYMENTS (via parent order ownership, admin full)
create policy "payments_select" on payments for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));
create policy "payments_insert" on payments for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "payments_admin_update" on payments for update using (is_admin());

-- REVIEWS (public read, own write, admin moderate)
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_own_insert" on reviews for insert with check (auth.uid() = user_id);
create policy "reviews_own_update" on reviews for update using (auth.uid() = user_id);
create policy "reviews_own_or_admin_delete" on reviews for delete using (auth.uid() = user_id or is_admin());

-- NOTIFICATIONS (own only)
create policy "notifications_own" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- BANNERS (public read active, admin write)
create policy "banners_public_read" on banners for select using (is_active = true or is_admin());
create policy "banners_admin_write" on banners for insert with check (is_admin());
create policy "banners_admin_update" on banners for update using (is_admin());
create policy "banners_admin_delete" on banners for delete using (is_admin());

- ============================================================================
-- GRANTS
-- RLS policies only take effect once the anon/authenticated roles also have
-- base table privileges. Without these GRANTs, Postgres blocks access before
-- RLS is ever evaluated ("permission denied for table ...").
-- ============================================================================

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

-- ============================================================================
-- SEED: make the first signed-up user an admin manually via:
--   update profiles set role = 'admin' where id = '<your-user-uuid>';
-- ============================================================================
