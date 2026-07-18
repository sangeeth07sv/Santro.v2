"use server";

import { createClient } from "@/lib/supabase/server";

/** Top-line counts for the admin dashboard home. */
export async function getAdminStats() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: orderCount }, { count: customerCount }, { data: revenueRows }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
      supabase.from("orders").select("total").neq("status", "cancelled"),
    ]);

  const revenue = (revenueRows ?? []).reduce((sum: number, o: any) => sum + Number(o.total ?? 0), 0);

  return {
    products: productCount ?? 0,
    orders: orderCount ?? 0,
    customers: customerCount ?? 0,
    revenue,
  };
}

/** All orders across all customers, for the admin orders table. */
export async function getAllOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), profile:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

/** All customer profiles for the admin customers table. */
export async function getCustomers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
