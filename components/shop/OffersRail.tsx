import { Tag, Percent } from "lucide-react";
import type { Coupon } from "@/types/database";

export function OffersRail({ offers }: { offers: Coupon[] }) {
  if (!offers.length) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Offers</h2>
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="flex w-64 shrink-0 items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-4 dark:border-slate-600 dark:bg-slate-800"
          >
            <div className="rounded-xl bg-white p-2 text-brand-600 shadow-card dark:bg-slate-900">
              {offer.type === "percentage" ? <Percent className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wide text-slate-900 dark:text-white">{offer.code}</p>
              <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                {offer.type === "percentage" ? `${offer.value}% off` : `₹${offer.value} off`}
                {offer.min_order_amount > 0 ? ` on orders above ₹${offer.min_order_amount}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
