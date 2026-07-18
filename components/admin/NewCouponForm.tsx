"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCoupon } from "@/actions/coupons";
import { Button } from "@/components/ui/Button";

export function NewCouponForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"percentage" | "fixed">("percentage");

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700";

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createCoupon(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Coupon created");
        router.refresh();
        (document.getElementById("new-coupon-form") as HTMLFormElement)?.reset();
      }
    });
  }

  return (
    <form id="new-coupon-form" action={handleSubmit} className="card space-y-4 p-5">
      <h2 className="font-semibold text-slate-800 dark:text-white">New Coupon</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Code</label>
          <input name="code" required className={inputClass} placeholder="SAVE20" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Type</label>
          <select name="type" value={type} onChange={(e) => setType(e.target.value as any)} className={inputClass}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Value {type === "percentage" ? "(%)" : "(₹)"}</label>
          <input name="value" type="number" step="0.01" min="0" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Min Order Amount (₹)</label>
          <input name="min_order_amount" type="number" step="0.01" min="0" defaultValue={0} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Max Discount (₹, optional)</label>
          <input name="max_discount" type="number" step="0.01" min="0" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Usage Limit (optional)</label>
          <input name="usage_limit" type="number" min="1" className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs text-slate-500">Expires At (optional)</label>
          <input name="expires_at" type="date" className={inputClass} />
        </div>
      </div>
      <Button type="submit" isLoading={isPending} className="w-full">Create Coupon</Button>
    </form>
  );
}
