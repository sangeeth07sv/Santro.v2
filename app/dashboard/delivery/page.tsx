import { getCurrentUser } from "@/actions/auth";
import { getMyDeliveries, getAvailableDeliveries } from "@/actions/orders";
import { redirect } from "next/navigation";
import { DeliveryActions } from "@/components/shop/DeliveryActions";
import { Truck } from "lucide-react";

export const metadata = { title: "Delivery Dashboard" };

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-600",
  processing: "bg-amber-50 text-amber-600",
  shipped: "bg-indigo-50 text-indigo-600",
  out_for_delivery: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
};

export default async function DeliveryDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login?redirect=/dashboard/delivery");
  if (auth.profile?.role !== "delivery_partner") redirect("/");

  const [myDeliveries, available] = await Promise.all([getMyDeliveries(), getAvailableDeliveries()]);
  const active = myDeliveries.filter((o: any) => o.status !== "delivered");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">Delivery Dashboard</h1>
      <p className="mb-8 text-sm text-slate-500">Pick up available orders and update delivery status.</p>

      <section className="mb-10">
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">My Active Deliveries ({active.length})</h2>
        {active.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">No active deliveries right now.</div>
        ) : (
          <div className="space-y-3">
            {active.map((order: any) => (
              <div key={order.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.order_number}</p>
                    <p className="text-xs text-slate-400">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs capitalize ${STATUS_STYLES[order.status] ?? ""}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <DeliveryActions orderId={order.id} status={order.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Available for Pickup ({available.length})</h2>
        {available.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">
            <Truck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            No orders waiting for pickup.
          </div>
        ) : (
          <div className="space-y-3">
            {available.map((order: any) => (
              <div key={order.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{order.order_number}</p>
                  <p className="text-xs text-slate-400">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                </div>
                <DeliveryActions orderId={order.id} status={order.status} canClaim />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
