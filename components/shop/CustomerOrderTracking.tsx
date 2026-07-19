"use client";

import { Package, Truck } from "lucide-react";
import { OrderRouteMap } from "@/components/shop/OrderRouteMap";
import { useLiveDeliveryLocation } from "@/hooks/useLiveDeliveryLocation";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed — your shop is preparing this order",
  processing: "Preparing your order",
  shipped: "Picked up — on the way",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

interface Props {
  orderId: string;
  status: string;
  pickup: { lat: number; lng: number; label: string } | null;
  drop: { lat: number; lng: number; label: string } | null;
}

export function CustomerOrderTracking({ orderId, status, pickup, drop }: Props) {
  const isTrackable = ["shipped", "out_for_delivery"].includes(status);
  const live = useLiveDeliveryLocation(isTrackable ? orderId : null);

  if (!drop) return null;

  return (
    <div className="card mb-4 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 p-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
        <Truck className="h-4 w-4 text-brand-600" />
        {STATUS_LABEL[status] ?? "Order status"}
      </div>
      {isTrackable ? (
        <div className="h-64 w-full">
          <OrderRouteMap pickup={pickup} drop={drop} live={live} />
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 text-sm text-slate-400">
          <Package className="h-4 w-4" /> Tracking will appear here once your order is picked up.
        </div>
      )}
    </div>
  );
}
