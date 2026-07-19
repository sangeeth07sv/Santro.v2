"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Phone, Locate, Package, Check } from "lucide-react";
import { updateDeliveryStatus } from "@/actions/orders";
import { OrderRouteMapLoader } from "@/components/shop/OrderRouteMapLoader";
import { LiveLocationBroadcaster } from "@/components/shop/LiveLocationBroadcaster";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { addressToQuery, addressToShortLabel } from "@/utils/address";
import { haversineKm, estimateDelivery } from "@/utils/geo";

// Only the 3 states that actually exist post-claim in `order_status`.
// (There's no DB-level "reached shop" / "picked up" distinction yet —
// claimDelivery() sets status "shipped" the moment a partner accepts, which
// is treated as "Accepted" here.)
const STATUS_FLOW = ["shipped", "out_for_delivery", "delivered"] as const;
const STATUS_LABEL: Record<string, string> = {
  shipped: "Accepted",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};
const NEXT_ACTION_LABEL: Record<string, string> = {
  shipped: "Mark Out for Delivery",
  out_for_delivery: "Mark Delivered",
};

export function DeliveryTrackingView({ order }: { order: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recenterTick, setRecenterTick] = useState(0);
  const [sheetExpanded, setSheetExpanded] = useState(true);

  const addr = order.shipping_address as any;
  const dropPoint =
    addr?.latitude != null && addr?.longitude != null
      ? { lat: addr.latitude, lng: addr.longitude, label: addressToQuery(addr) }
      : null;
  const pickupPoint = order.pickup ?? null;
  const isActive = order.status === "shipped" || order.status === "out_for_delivery";
  const deviceLocation = useDeviceLocation(isActive);

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;
  const itemCount = order.order_items?.reduce((n: number, i: any) => n + i.quantity, 0) ?? 0;

  // Distance/ETA shown in the sheet header — same helper used at checkout,
  // so this number matches what the customer was charged, not a re-estimate.
  const routeFrom = deviceLocation ?? pickupPoint;
  const estimate = routeFrom && dropPoint ? estimateDelivery(haversineKm(routeFrom, dropPoint)) : null;

  const customerName = addr?.full_name || "Customer";
  const customerPhone = addr?.phone || null;

  function handleAdvance() {
    if (!nextStatus || nextStatus === "shipped") return;
    startTransition(async () => {
      const res = await updateDeliveryStatus(order.id, nextStatus as "out_for_delivery" | "delivered");
      if (res?.error) toast.error(res.error);
      else toast.success(`Marked as ${STATUS_LABEL[nextStatus]}`);
    });
  }

  function callHref(phone: string | null) {
    return phone ? `tel:${phone}` : undefined;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface dark:bg-surface-dark">
      <LiveLocationBroadcaster orderId={order.id} active={isActive} />

      {/* Map fills the remaining space above the sheet */}
      <div className="relative flex-1">
        <OrderRouteMapLoader
          pickup={pickupPoint}
          drop={dropPoint}
          live={deviceLocation}
          recenterSignal={recenterTick}
        />

        <button
          onClick={() => router.push("/dashboard/delivery")}
          aria-label="Back"
          className="absolute left-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card dark:bg-indigo-800"
        >
          <ArrowLeft className="h-5 w-5 text-ink dark:text-white" />
        </button>

        <span className="absolute right-4 top-4 z-[1000] rounded-full bg-indigo-900 px-3 py-1.5 text-xs font-semibold text-white shadow-card">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>

        {/* Floating action rail */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => setRecenterTick((t) => t + 1)}
            aria-label="Recenter map"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-indigo-900 shadow-card dark:bg-indigo-800 dark:text-white"
          >
            <Locate className="h-5 w-5" />
          </button>
          {customerPhone && (
            <a
              href={callHref(customerPhone)}
              aria-label="Call customer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-paisley-500 text-white shadow-card"
            >
              <Phone className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      {/* Bottom sheet */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.15 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 60) setSheetExpanded(false);
          else if (info.offset.y < -60) setSheetExpanded(true);
        }}
        animate={{ height: sheetExpanded ? "auto" : 96 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative z-[1000] flex-shrink-0 overflow-hidden rounded-t-[32px] border-t border-surface-muted bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:border-indigo-700 dark:bg-indigo-900"
      >
        <button
          onClick={() => setSheetExpanded((v) => !v)}
          className="flex w-full justify-center pb-1 pt-3"
          aria-label={sheetExpanded ? "Collapse details" : "Expand details"}
        >
          <span className="h-1.5 w-10 rounded-full bg-surface-muted dark:bg-indigo-700" />
        </button>

        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
          {/* Order header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink dark:text-white">{order.order_number}</p>
              <p className="flex items-center gap-1 text-xs text-ink/50 dark:text-slate-400">
                <Package className="h-3 w-3" /> {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
            </div>
            {estimate && (
              <div className="text-right text-xs text-ink/50 dark:text-slate-400">
                <p className="font-mono text-sm font-semibold text-ink dark:text-white">{estimate.distanceKm} km</p>
                <p>~{estimate.etaMinutes} min</p>
              </div>
            )}
          </div>

          {/* Pickup -> Drop */}
          <div className="mt-3 space-y-2 rounded-xl bg-surface-muted p-3 text-sm dark:bg-indigo-800">
            <div className="flex gap-2">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-paisley-500" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-ink/40 dark:text-slate-400">Pickup</p>
                <p className="font-medium text-ink dark:text-white">{pickupPoint?.shopName || pickupPoint?.label || "Shop location unavailable"}</p>
              </div>
            </div>
            <div className="ml-1 h-3 w-px bg-ink/15 dark:bg-white/15" />
            <div className="flex gap-2">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rotate-45 rounded-sm bg-marigold-500" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-ink/40 dark:text-slate-400">Drop</p>
                <p className="font-medium text-ink dark:text-white">{addressToShortLabel(addr) || "No address on file"}</p>
              </div>
            </div>
          </div>

          {/* Customer + shop contact */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-xl border border-surface-muted p-3 dark:border-indigo-700">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink dark:text-white">{customerName}</p>
                <p className="text-[11px] text-ink/40 dark:text-slate-400">Customer</p>
              </div>
              {customerPhone && (
                <a href={callHref(customerPhone)} aria-label="Call customer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paisley-50 text-paisley-600 dark:bg-paisley-500/10">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="flex items-center justify-between rounded-xl border border-surface-muted p-3 dark:border-indigo-700">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink dark:text-white">{pickupPoint?.shopName || "Shop"}</p>
                <p className="text-[11px] text-ink/40 dark:text-slate-400">Shop</p>
              </div>
              {pickupPoint?.shopPhone && (
                <a href={callHref(pickupPoint.shopPhone)} aria-label="Call shop" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Items */}
          {order.order_items?.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-surface-muted pt-3 text-sm dark:border-indigo-700">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-ink/70 dark:text-slate-300">
                  <span>{item.product_name}</span>
                  <span>×{item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Status timeline */}
          <div className="mt-4 flex items-center border-t border-surface-muted pt-4 dark:border-indigo-700">
            {STATUS_FLOW.map((status, i) => {
              const done = i <= currentIndex;
              return (
                <div key={status} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        done ? "bg-indigo-700 text-white" : "border border-ink/20 text-ink/30 dark:border-white/20"
                      }`}
                    >
                      {done && <Check className="h-3 w-3" />}
                    </span>
                    <span className={`text-[10px] ${done ? "font-medium text-ink dark:text-white" : "text-ink/40 dark:text-slate-500"}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <span className={`mx-1 h-0.5 flex-1 ${i < currentIndex ? "bg-indigo-700" : "bg-ink/10 dark:bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {nextStatus ? (
            <button onClick={handleAdvance} disabled={isPending} className="btn-primary mt-4 w-full py-3.5 text-base disabled:opacity-50">
              {isPending ? "Updating…" : NEXT_ACTION_LABEL[order.status]}
            </button>
          ) : (
            <div className="mt-4 rounded-lg bg-paisley-50 py-3 text-center text-sm font-medium text-paisley-600 dark:bg-paisley-500/10">
              Delivered ✓
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
        }
