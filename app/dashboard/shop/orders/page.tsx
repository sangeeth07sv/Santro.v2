import { getCurrentUser } from "@/actions/auth";
import { getMyShopOrders } from "@/actions/orders";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";

export const metadata = { title: "Shop Orders" };

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

export default async function ShopOrdersPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login/shop?redirect=/dashboard/shop/orders");
  if (auth.profile?.role !== "shop_owner") redirect("/");

  const orders = await getMyShopOrders();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">Orders</h1>
      <p className="mb-8 text-sm text-slate-500">Orders containing items from your shop.</p>

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">
          <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          No orders yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const itemCount = (order.order_items ?? []).reduce((n: number, i: any) => n + i.quantity, 0);
            return (
              <Link
                key={order.id}
                href={`/dashboard/shop/orders/${order.id}`}
                className="card flex items-center justify-between p-4 hover:shadow-elevated"
              >
                <div>
                  <p className="text-sm font-medium">{order.order_number}</p>
                  <p className="text-xs text-slate-400">
                    {itemCount} item{itemCount === 1 ? "" : "s"} · {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status] ?? ""}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
