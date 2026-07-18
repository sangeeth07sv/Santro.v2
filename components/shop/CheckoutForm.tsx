"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bike, MapPin } from "lucide-react";
import { createOrder } from "@/actions/orders";
import { Button } from "@/components/ui/Button";
import { estimateDelivery, haversineKm, DEFAULT_SHIPPING_FEE } from "@/utils/geo";
import type { Address } from "@/types/database";

const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "upi", label: "UPI" },
  { value: "razorpay", label: "Card / Netbanking (Razorpay)" },
  { value: "stripe", label: "Card (Stripe)" },
];

interface CartItem {
  product?: {
    owner?: { shop_name?: string | null; latitude?: number | null; longitude?: number | null } | null;
  } | null;
}

export function CheckoutForm({
  addresses,
  subtotal,
  itemCount,
  items,
}: {
  addresses: Address[];
  subtotal: number;
  itemCount: number;
  items: CartItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id ?? "");

  const currentAddress = addresses.find((a) => a.id === selectedAddress);

  // Distance to the farthest shop in the cart — that's the leg that determines
  // when the whole order can be delivered.
  const estimate = useMemo(() => {
    const addrLat = (currentAddress as any)?.latitude;
    const addrLng = (currentAddress as any)?.longitude;
    if (addrLat == null || addrLng == null) return null;

    const shopDistances = items
      .map((i) => i.product?.owner)
      .filter((o): o is { shop_name?: string | null; latitude: number; longitude: number } => o?.latitude != null && o?.longitude != null)
      .map((o) => haversineKm({ lat: addrLat, lng: addrLng }, { lat: o.latitude, lng: o.longitude }));

    if (shopDistances.length === 0) return null;
    const farthestKm = Math.max(...shopDistances);
    return estimateDelivery(farthestKm);
  }, [currentAddress, items]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createOrder(formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res.requiresPayment) {
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

        {/* Rapido-style delivery estimate card */}
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-white">Delivery Estimate</h2>
            {estimate && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Fastest
              </span>
            )}
          </div>

          {!estimate ? (
            <div className="flex items-center gap-3 p-4 text-sm text-slate-400">
              <MapPin className="h-5 w-5 shrink-0" />
              Pin an exact location on your address to see delivery time &amp; fee.
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-slate-800">
                <Bike className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white">Local Delivery</p>
                <p className="text-xs text-slate-500">
                  {estimate.distanceKm} km away · Drop in ~{estimate.etaMinutes} min
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {estimate.fee === 0 ? "Free" : `₹${estimate.fee}`}
              </span>
            </div>
          )}
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
        <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span>{itemCount} item(s)</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{estimate ? (estimate.fee === 0 ? "Free" : `₹${estimate.fee}`) : `~₹${DEFAULT_SHIPPING_FEE}`}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">Final total (with tax & discounts) confirmed on order.</p>
        <Button type="submit" isLoading={isPending} className="mt-5 w-full">Place Order</Button>
      </div>
    </form>
  );
}
