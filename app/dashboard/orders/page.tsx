import { getCurrentUser } from "@/actions/auth";
import { getUserOrders } from "@/actions/orders";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";

export const metadata = { title: "Order History" };

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  confirmed: "bg-blue-50 text-blue-600",
  processing: "bg-amber-50 text-amber-600",
  shipped: "bg-indigo-50 text-indigo-600",
  out_for_delivery: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
  refunded: "bg-red-50 text-red-600",
};

export default async function OrderHistoryPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login?redirect=/dashboard/orders");

  const orders = await getUserOrders();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Order History</h1>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No orders yet.</p>
          <Link href="/products" className="btn-primary mt-4 inline-flex">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="card flex items-center justify-between p-4 hover:shadow-elevated"
            >
              <div>
                <p className="text-sm font-medium">{order.order_number}</p>
                <p className="text-xs text-slate-400">
                  {new Date(order.created_at).toLocaleDateString()} · {order.order_items?.length ?? 0} item(s)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                  ₹{order.total.toLocaleString("en-IN")}
                </p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[order.status] ?? ""}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
