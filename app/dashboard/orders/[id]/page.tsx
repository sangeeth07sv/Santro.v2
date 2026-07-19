import { getCurrentUser } from "@/actions/auth";
import { getOrderById } from "@/actions/orders";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { CustomerOrderTracking } from "@/components/shop/CustomerOrderTracking";

export const metadata = { title: "Order Details" };

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

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) redirect(`/login/customer?redirect=/dashboard/orders/${id}`);

  const order = await getOrderById(id);
  if (!order) notFound();

  const address = order.shipping_address as any;

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

      <CustomerOrderTracking
        orderId={order.id}
        status={order.status}
        pickup={order.pickup ?? null}
        drop={address?.latitude != null && address?.longitude != null
          ? { lat: address.latitude, lng: address.longitude, label: "Drop-off" }
          : null}
      />

      <div className="card mb-4 divide-y divide-slate-100 dark:divide-slate-800">
        {(order.order_items ?? []).map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 p-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
              {item.product_image && <Image src={item.product_image} alt="" fill className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.product_name}</p>
              <p className="text-xs text-slate-400">Qty {item.quantity} × ₹{item.unit_price.toLocaleString("en-IN")}</p>
            </div>
            <p className="text-sm font-semibold">₹{item.line_total.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      <div className="card mb-4 p-4 text-sm">
        <p className="mb-2 font-medium text-slate-700 dark:text-slate-200">Shipping Address</p>
        <p className="text-slate-500">{address?.full_name}</p>
        <p className="text-slate-500">{address?.phone}</p>
        <p className="text-slate-500">
          {address?.line1}
          {address?.line2 ? `, ${address.line2}` : ""}, {address?.city}, {address?.state} {address?.postal_code}
        </p>
      </div>

      <div className="card p-4 text-sm">
        <div className="flex justify-between py-1"><span className="text-slate-500">Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span></div>
        {order.discount > 0 && (
          <div className="flex justify-between py-1"><span className="text-slate-500">Discount</span><span>-₹{order.discount.toLocaleString("en-IN")}</span></div>
        )}
        <div className="flex justify-between py-1"><span className="text-slate-500">Shipping</span><span>₹{order.shipping_fee.toLocaleString("en-IN")}</span></div>
        {order.tax > 0 && (
          <div className="flex justify-between py-1"><span className="text-slate-500">Tax</span><span>₹{order.tax.toLocaleString("en-IN")}</span></div>
        )}
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-semibold dark:border-slate-800">
          <span>Total</span><span>₹{order.total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}
