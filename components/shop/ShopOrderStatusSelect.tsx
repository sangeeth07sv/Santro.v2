"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateShopOrderStatus } from "@/actions/orders";

// Kept in sync with SHOP_OWNER_ALLOWED_STATUSES in actions/orders.ts — the
// server re-checks this list too, so this is just what the UI offers.
const STATUSES = ["confirmed", "processing", "ready_for_pickup", "cancelled"];

const LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_pickup: "Ready for pickup",
  cancelled: "Cancelled",
};

export function ShopOrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  // The order may already be past what a shop owner can set (shipped,
  // delivered, etc. — set by the delivery partner or admin). Show it as a
  // disabled, read-only value rather than silently offering to roll it back.
  const isShopEditable = STATUSES.includes(status);

  function handleChange(next: string) {
    startTransition(async () => {
      const res = await updateShopOrderStatus(orderId, next);
      if (res?.error) toast.error(res.error);
      else toast.success(next === "ready_for_pickup" ? "Marked ready for pickup" : "Order status updated");
    });
  }

  if (!isShopEditable) {
    return (
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs capitalize text-slate-500 dark:border-slate-700 dark:bg-slate-800">
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-400 disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{LABELS[s]}</option>
      ))}
    </select>
  );
}
