"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { updateOrderStatus } from "@/actions/orders";
import { OrderRouteMap } from "@/components/shop/OrderRouteMap";
import { LiveLocationBroadcaster } from "@/components/shop/LiveLocationBroadcaster";
import { addressToQuery } from "@/utils/address";

const STATUS_FLOW = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"] as const;
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  processing: "Preparing",
  shipped: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

export function DeliveryTrackingView({ order }: { order: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const addr = order.shipping_address as any;
  const dropPoint =
    addr?.latitude != null && addr?.longitude != null
      ? { lat: addr.latitude, lng: addr.longitude, label: addressToQuery(addr) }
      : null;
  const pickupPoint = order.pickup ?? null;
  const displayAddress = addressToQuery(addr);
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;
  const itemCount = order.order_items?.reduce((n: number, i: any) => n + i.quantity, 0) ?? 0;

  function handleAdvance() {
    if (!nextStatus) return;
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, nextStatus);
      if (res?.error) toast.error(res.error);
      else toast.success(`Marked as ${STATUS_LABEL[nextStatus]}`);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface dark:bg-surface-dark">
      <LiveLocationBroadcaster
        orderId={order.id}
        active={order.status === "shipped" || order.status === "out_for_delivery"}
      />
      {/* Map fills the top portion */}
      <div className="relative flex-1">
        <OrderRouteMap pickup={pickupPoint} drop={dropPoint} />

        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard/delivery")}
          aria-label="Back"
          className="absolute left-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card dark:bg-indigo-800"
        >
          <ArrowLeft className="h-5 w-5 text-ink dark:text-white" />
        </button>

        {/* Drop-off address pill */}
        <div className="absolute left-16 right-4 top-4 z-[1000] flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-card dark:bg-indigo-800 dark:text-white">
          <MapPin className="h-4 w-4 shrink-0 text-marigold-600" />
          <span className="truncate">{displayAddress || "No address on file"}</span>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="rounded-t-2xl border-t border-surface-muted bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:border-indigo-700 dark:bg-indigo-900">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-muted dark:bg-indigo-700" />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink dark:text-white">{order.order_number}</p>
            <p className="flex items-center gap-1 text-xs text-ink/50 dark:text-slate-400">
              <Package className="h-3 w-3" /> {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200">
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-surface-muted pt-3 dark:border-indigo-700">
          <span className="text-sm text-ink/50 dark:text-slate-400">Order total</span>
          <span className="font-mono text-base font-semibold text-ink dark:text-white">
            ₹{Number(order.total).toLocaleString("en-IN")}
          </span>
        </div>

        {nextStatus ? (
          <button
            onClick={handleAdvance}
            disabled={isPending}
            className="btn-primary mt-4 w-full py-3.5 text-base disabled:opacity-50"
          >
            {isPending ? "Updating…" : `Mark as ${STATUS_LABEL[nextStatus]}`}
          </button>
        ) : (
          <div className="mt-4 rounded-lg bg-paisley-50 py-3 text-center text-sm font-medium text-paisley-600 dark:bg-paisley-500/10">
            Delivered ✓
          </div>
        )}
      </div>
    </div>
  );
}
