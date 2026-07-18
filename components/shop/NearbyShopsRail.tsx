import Link from "next/link";
import { Store, MapPin, Clock } from "lucide-react";
import type { NearbyShop } from "@/actions/home";

export function NearbyShopsRail({ shops }: { shops: NearbyShop[] }) {
  if (!shops.length) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Shops near you</h2>
      </div>
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {shops.map((shop) => (
          <Link
            key={shop.ownerId}
            href={`/products?owner=${shop.ownerId}`}
            className="card flex w-56 shrink-0 flex-col gap-2 p-4 hover:shadow-elevated"
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-slate-800">
                <Store className="h-4 w-4" />
              </div>
              <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{shop.shopName}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {shop.distanceKm} km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> ~{shop.etaMinutes} min
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {shop.productCount} product{shop.productCount === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
