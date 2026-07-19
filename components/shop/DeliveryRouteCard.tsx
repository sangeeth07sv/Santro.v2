import { MapPin, Store } from "lucide-react";
import { OrderRouteMapLoader } from "@/components/shop/OrderRouteMapLoader";
import { addressToShortLabel } from "@/utils/address";

interface PickupPoint {
  lat: number;
  lng: number;
  label: string;
}

/**
 * Shows where an order needs to be picked up (shop) and dropped off
 * (customer) — a small route map with two address pills, in the style of
 * a ride-hailing trip card. Used on the delivery partner home page so a
 * partner can see both locations before claiming or starting a delivery.
 */
export function DeliveryRouteCard({ order }: { order: any }) {
  const addr = order.shipping_address as any;
  const pickup: PickupPoint | null = order.pickup ?? null;
  const drop =
    addr?.latitude != null && addr?.longitude != null
      ? { lat: addr.latitude, lng: addr.longitude, label: addressToShortLabel(addr) }
      : null;

  const pickupLabel = pickup?.label || "Shop address not on file";
  const dropLabel = drop?.label || addressToShortLabel(addr) || "Customer address not on file";

  return (
    <div className="overflow-hidden rounded-lg border border-surface-muted dark:border-indigo-700">
      {/* Address pills */}
      <div className="space-y-1.5 bg-white p-3 dark:bg-indigo-800">
        <div className="flex items-center gap-2 text-xs">
          <Store className="h-3.5 w-3.5 shrink-0 text-paisley-600" />
          <span className="truncate font-medium text-ink dark:text-white">{pickupLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-marigold-600" />
          <span className="truncate font-medium text-ink dark:text-white">{dropLabel}</span>
        </div>
      </div>

      {/* Route map — full route with shop pin, customer pin, road path and distance/ETA,
          sized close to full-screen so the partner can actually read it (not a thumbnail). */}
      <div className="h-80 w-full">
        {drop ? (
          <OrderRouteMapLoader pickup={pickup} drop={drop} />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-muted text-xs text-ink/40 dark:bg-indigo-900">
            No location on file for this order.
          </div>
        )}
      </div>
    </div>
  );
}
