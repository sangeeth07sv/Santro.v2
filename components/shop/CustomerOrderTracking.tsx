"use client";

import { Package, Truck } from "lucide-react";
import { OrderRouteMap } from "@/components/shop/OrderRouteMap";
import { useLiveDeliveryLocation } from "@/hooks/useLiveDeliveryLocation";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed — your shop is preparing this order",
  processing: "Preparing your order",
  ready_for_pickup: "Ready for pickup — waiting for a delivery partner",
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

  // Once we know where the order is coming from and going to, show the route
  // right away — no reason to make the customer wait until pickup for that.
  // The live rider marker only joins once the order is actually trackable.
  const showMap = isTrackable || !!pickup;

  return (
    <div className="card mb-4 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 p-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
        <Truck className="h-4 w-4 text-brand-600" />
        {STATUS_LABEL[status] ?? "Order status"}
      </div>
      {showMap ? (
        <div className="h-64 w-full">
          <OrderRouteMap pickup={pickup} drop={drop} live={isTrackable ? live : null} />
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 text-sm text-slate-400">
          <Package className="h-4 w-4" /> Tracking will appear here once your order is picked up.
        </div>
      )}
    </div>
  );
      }
  
