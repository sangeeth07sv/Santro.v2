"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/orders";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"];

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, next);
      if (res?.error) toast.error(res.error);
      else toast.success("Order status updated");
    });
  }

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs capitalize outline-none focus:border-indigo-400 disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}
