-- Tracks every status transition an order goes through, with a timestamp,
-- so the UI can show a real timeline ("Confirmed at 9:15am, Shipped at
-- 10:40am...") instead of just the current status.

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references profiles(id) on delete set null
);

create index order_status_history_order_id_idx on order_status_history(order_id, changed_at);

alter table order_status_history enable row level security;

-- Same visibility as the parent order: customer who owns it, admin, the
-- assigned delivery partner, or a shop owner with a product in the order.
create policy "order_status_history_select" on order_status_history for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or is_admin() or o.delivery_partner_id = auth.uid())
    )
    or (is_shop_owner() and order_contains_owner_product(order_id, auth.uid()))
  );

-- Auto-logs a row whenever an order is created or its status changes.
-- SECURITY DEFINER + fixed search_path so it can insert regardless of the
-- calling user's RLS, and can't be hijacked via a mutable search_path.
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into order_status_history (order_id, status, changed_at, changed_by)
    values (new.id, new.status, new.created_at, new.user_id);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into order_status_history (order_id, status, changed_at, changed_by)
    values (new.id, new.status, now(), auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_orders_status_history
after insert or update on orders
for each row execute function log_order_status_change();

-- Backfill: at minimum, record the current status of every existing order
-- using its created_at (best available timestamp — true history before this
-- table existed can't be reconstructed).
insert into order_status_history (order_id, status, changed_at)
select id, status, created_at from orders
where not exists (select 1 from order_status_history h where h.order_id = orders.id);
