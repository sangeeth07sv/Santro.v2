import { Check } from "lucide-react";

const META: Record<string, { label: string; dot: string }> = {
  pending: { label: "Order placed", dot: "bg-slate-400" },
  confirmed: { label: "Confirmed", dot: "bg-blue-500" },
  processing: { label: "Processing", dot: "bg-amber-500" },
  ready_for_pickup: { label: "Ready for pickup", dot: "bg-teal-500" },
  shipped: { label: "Picked up", dot: "bg-indigo-500" },
  out_for_delivery: { label: "Out for delivery", dot: "bg-purple-500" },
  delivered: { label: "Delivered", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", dot: "bg-red-500" },
  refunded: { label: "Refunded", dot: "bg-red-500" },
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${dateStr}, ${time}`;
}

interface HistoryEntry {
  status: string;
  changed_at: string;
}

/**
 * Vertical timeline of every status the order has passed through, each
 * with its own timestamp — distinct from the horizontal progress bar used
 * elsewhere (STATUS_FLOW in DeliveryTrackingView), which only shows the
 * 3 delivery-partner-relevant steps. This shows the full history.
 */
export function OrderStatusTimeline({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null;

  return (
    <div className="card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Order Timeline</p>
      <div className="space-y-0">
        {history.map((entry, i) => {
          const meta = META[entry.status] ?? { label: entry.status.replace(/_/g, " "), dot: "bg-slate-400" };
          const isLast = i === history.length - 1;
          return (
            <div key={`${entry.status}-${entry.changed_at}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${meta.dot}`}>
                  <Check className="h-3 w-3 text-white" />
                </span>
                {!isLast && <span className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" style={{ minHeight: 20 }} />}
              </div>
              <div className={isLast ? "pb-0" : "pb-4"}>
                <p className="text-sm font-medium capitalize text-slate-800 dark:text-slate-100">{meta.label}</p>
                <p className="text-xs text-slate-400">{formatTimestamp(entry.changed_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
