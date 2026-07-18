import { getCurrentUser } from "@/actions/auth";
import { getUserOrders } from "@/actions/orders";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, MapPin, Heart, ArrowRight } from "lucide-react";

export const metadata = { title: "My Dashboard" };

export default async function CustomerDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login?redirect=/dashboard");

  const orders = await getUserOrders();
  const recentOrders = orders.slice(0, 3);

  const LINKS = [
    { href: "/dashboard/orders", label: "Order History", icon: Package, count: orders.length },
    { href: "/dashboard/addresses", label: "Addresses", icon: MapPin },
    { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">
        Hi, {auth.profile?.full_name?.split(" ")[0] ?? "there"} 👋
      </h1>
      <p className="mb-8 text-sm text-slate-500">Here's what's happening with your account.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {LINKS.map(({ href, label, icon: Icon, count }) => (
          <Link key={href} href={href} className="card flex items-center gap-4 p-5 hover:shadow-elevated">
            <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-slate-800">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
              {count !== undefined && <p className="text-xs text-slate-400">{count} total</p>}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-white">Recent Orders</h2>
          <Link href="/dashboard/orders" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">
            No orders yet. <Link href="/products" className="text-brand-600 hover:underline">Start shopping →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{order.order_number}</p>
                  <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                    ₹{order.total.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs capitalize text-slate-500">{order.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
              }
            
