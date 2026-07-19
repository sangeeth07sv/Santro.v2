import { getCurrentUser } from "@/actions/auth";
import { getShopOrderById, getOrderStatusHistory } from "@/actions/orders";
import { redirect, notFound } from "next/navigation";
import { CustomerOrderTracking } from "@/components/shop/CustomerOrderTracking";
import { ShopOrderStatusSelect } from "@/components/shop/ShopOrderStatusSelect";
import { OrderStatusTimeline } from "@/components/shop/OrderStatusTimeline";

export const metadata = { title: "Order Tracking" };

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

export default async function ShopOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) redirect(`/login/shop?redirect=/dashboard/shop/orders/${id}`);
  if (auth.profile?.role !== "shop_owner") redirect("/");

  const order = await getShopOrderById(id);
  if (!order) notFound(); // also covers "not one of this shop's orders" — RLS returns nothing rather than another shop's data

  const history = await getOrderStatusHistory(id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{order.order_number}</h1>
          <p className="text-xs text-slate-400">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status] ?? ""}`}>
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="card mb-4 flex items-center justify-between p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Update status</p>
        <ShopOrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="mb-4">
        <OrderStatusTimeline history={history} />
      </div>

      <CustomerOrderTracking
        orderId={order.id}
        status={order.status}
        pickup={order.pickup ?? null}
        drop={
          order.shipping_address?.latitude != null && order.shipping_address?.longitude != null
            ? { lat: order.shipping_address.latitude, lng: order.shipping_address.longitude, label: "Drop-off" }
            : null
        }
      />

      <div className="card divide-y divide-slate-100 dark:divide-slate-800">
        {(order.order_items ?? []).map((item: any) => (
          <div key={item.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{item.product_name}</p>
              <p className="text-xs text-slate-400">Qty {item.quantity} × ₹{item.unit_price.toLocaleString("en-IN")}</p>
            </div>
            <p className="text-sm font-semibold">₹{item.line_total.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
