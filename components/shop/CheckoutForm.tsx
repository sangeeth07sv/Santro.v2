"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrder } from "@/actions/orders";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/types/database";

const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "upi", label: "UPI" },
  { value: "razorpay", label: "Card / Netbanking (Razorpay)" },
  { value: "stripe", label: "Card (Stripe)" },
];

export function CheckoutForm({
  addresses,
  subtotal,
  itemCount,
}: {
  addresses: Address[];
  subtotal: number;
  itemCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id ?? "");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createOrder(formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res.requiresPayment) {
        // In production: redirect to Stripe Checkout Session or open Razorpay
        // modal here using res.orderId, then update the `payments` row via a
        // webhook route handler (see app/api/webhooks/*).
        toast.info("Redirecting to payment gateway...");
      } else {
        toast.success("Order placed successfully!");
      }
      router.push(`/dashboard/orders/${res.orderId}`);
    });
  }

  if (addresses.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="mb-4 text-slate-600 dark:text-slate-300">You need a shipping address before checking out.</p>
        <a href="/dashboard/addresses/new" className="btn-primary inline-flex">Add an address</a>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Shipping Address</h2>
          <div className="space-y-2">
            {addresses.map((addr) => (
              <label key={addr.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 dark:border-slate-700">
                <input
                  type="radio"
                  name="address_id"
                  value={addr.id}
                  checked={selectedAddress === addr.id}
                  onChange={() => setSelectedAddress(addr.id)}
                  className="mt-1"
                />
                <div className="text-sm">
                  <p className="font-medium">{addr.full_name} · {addr.phone}</p>
                  <p className="text-slate-500">{addr.line1}, {addr.city}, {addr.state} {addr.postal_code}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Payment Method</h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((pm) => (
              <label key={pm.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 dark:border-slate-700">
                <input type="radio" name="payment_method" value={pm.value} defaultChecked={pm.value === "cod"} />
                <span className="text-sm">{pm.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Coupon Code</h2>
          <input
            name="coupon_code"
            placeholder="Enter coupon code (optional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
      </div>

      <div className="card h-fit p-5">
        <h2 className="mb-4 font-semibold text-slate-800 dark:text-white">Order Summary</h2>
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>{itemCount} item(s)</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Final total (with shipping & discounts) confirmed on order.</p>
        <Button type="submit" isLoading={isPending} className="mt-5 w-full">Place Order</Button>
      </div>
    </form>
  );
    }
          
