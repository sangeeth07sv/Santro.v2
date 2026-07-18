import { getCart } from "@/actions/cart";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/auth";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { redirect } from "next/navigation";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [{ items, subtotal }, auth] = await Promise.all([getCart(), getCurrentUser()]);
  if (items.length === 0) redirect("/cart");

  const supabase = await createClient();
  const user = auth!.user;
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Checkout</h1>
      <CheckoutForm addresses={addresses ?? []} subtotal={subtotal} itemCount={items.length} />
    </div>
  );
}
