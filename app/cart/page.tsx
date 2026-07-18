import { getCart } from "@/actions/cart";
import Link from "next/link";
import Image from "next/image";
import { CartItemRow } from "@/components/shop/CartItemRow";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "Your Cart" };

export default async function CartPage() {
  const { items, subtotal } = await getCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">Looks like you haven't added anything yet.</p>
        <Link href="/products" className="btn-primary mt-6 inline-flex">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Your Cart</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {items.map((item: any) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-slate-800 dark:text-white">Order Summary</h2>
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Shipping & taxes calculated at checkout.</p>
          <Link href="/checkout" className="btn-primary mt-5 w-full">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  );
}
