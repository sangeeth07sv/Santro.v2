"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { updateShopOrderStatus } from "@/actions/orders";

// Kept in sync with SHOP_OWNER_ALLOWED_STATUSES in actions/orders.ts — the
// server re-checks this list too, so this is just what the UI offers.
const STATUSES = ["confirmed", "processing", "ready_for_pickup", "cancelled"] as const;

const META: Record<string, { label: string; dot: string; text: string }> = {
  confirmed: { label: "Confirmed", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  processing: { label: "Processing", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  ready_for_pickup: { label: "Ready for pickup", dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" },
  cancelled: { label: "Cancelled", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

export function ShopOrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(status);
  const rootRef = useRef<HTMLDivElement>(null);

  // The order may already be past what a shop owner can set (shipped,
  // delivered, etc. — set by the delivery partner or admin). Show it as a
  // disabled, read-only value rather than silently offering to roll it back.
  const isShopEditable = STATUSES.includes(status as (typeof STATUSES)[number]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(next: string) {
    setOpen(false);
    if (next === current) return;
    const previous = current;
    setCurrent(next); // optimistic
    startTransition(async () => {
      const res = await updateShopOrderStatus(orderId, next);
      if (res?.error) {
        setCurrent(previous); // revert
        toast.error(res.error);
      } else {
        toast.success(next === "ready_for_pickup" ? "Marked ready for pickup" : "Order status updated");
      }
    });
  }

  if (!isShopEditable) {
    return (
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs capitalize text-slate-500 dark:border-slate-700 dark:bg-slate-800">
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  const currentMeta = META[current] ?? { label: current, dot: "bg-slate-400", text: "text-slate-500" };

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-w-[150px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none transition-colors hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500"
      >
        <span className="flex items-center gap-2">
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
          ) : (
            <span className={`h-2 w-2 shrink-0 rounded-full ${currentMeta.dot}`} />
          )}
          <span className={currentMeta.text}>{currentMeta.label}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-elevated dark:border-slate-700 dark:bg-indigo-800"
        >
          {STATUSES.map((s) => {
            const meta = META[s];
            const selected = s === current;
            return (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(s)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-indigo-700"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                <span className={`flex-1 ${selected ? "font-medium text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                  {meta.label}
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
                        }
