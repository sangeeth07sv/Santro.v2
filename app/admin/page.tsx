import { getAdminStats, getAllOrders } from "@/actions/admin";
import Link from "next/link";
import { Package, ShoppingBag, Users, IndianRupee } from "lucide-react";

export const metadata = { title: "Admin · Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, orders] = await Promise.all([getAdminStats(), getAllOrders()]);
  const recentOrders = orders.slice(0, 5);

  const CARDS = [
    { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: IndianRupee },
    { label: "Orders", value: stats.orders, icon: ShoppingBag },
    { label: "Products", value: stats.products, icon: Package },
    { label: "Customers", value: stats.customers, icon: Users },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CARDS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o: any) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800">
                  <td className="p-4">{o.order_number}</td>
                  <td className="p-4">{o.profile?.full_name ?? "—"}</td>
                  <td className="p-4">₹{Number(o.total).toLocaleString("en-IN")}</td>
                  <td className="p-4 capitalize">{o.status.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
