import { getAllOrders } from "@/actions/admin";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

export const metadata = { title: "Admin · Orders" };

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Orders</h1>

      <div className="card overflow-x-auto">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800">
                  <td className="p-4 font-medium">{o.order_number}</td>
                  <td className="p-4">{o.profile?.full_name ?? "—"}</td>
                  <td className="p-4">{o.order_items?.length ?? 0}</td>
                  <td className="p-4">₹{Number(o.total).toLocaleString("en-IN")}</td>
                  <td className="p-4 text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <OrderStatusSelect orderId={o.id} status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
