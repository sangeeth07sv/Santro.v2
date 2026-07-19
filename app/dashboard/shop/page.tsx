import { getCurrentUser } from "@/actions/auth";
import { getMyShopProducts } from "@/actions/products";
import { getShopAnalytics } from "@/actions/orders";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Package, Settings, MapPin, Truck, IndianRupee, ShoppingBag, CheckCircle2, Clock } from "lucide-react";
import { ShopProductRowActions } from "@/components/shop/ShopProductRowActions";
import { ShopLocationMapLoader } from "@/components/shop/ShopLocationMapLoader";

export const metadata = { title: "Shop Dashboard" };

const STATUS_META: Record<string, { label: string; bar: string; text: string }> = {
  pending: { label: "Pending", bar: "bg-slate-300", text: "text-slate-500" },
  confirmed: { label: "Received", bar: "bg-marigold-500", text: "text-marigold-600" },
  processing: { label: "Processing", bar: "bg-marigold-500", text: "text-marigold-600" },
  shipped: { label: "Shipped", bar: "bg-brand-400", text: "text-brand-500" },
  out_for_delivery: { label: "Out for delivery", bar: "bg-indigo-400", text: "text-indigo-600" },
  delivered: { label: "Delivered", bar: "bg-paisley-500", text: "text-paisley-600" },
  cancelled: { label: "Cancelled", bar: "bg-red-400", text: "text-red-600" },
  refunded: { label: "Refunded", bar: "bg-red-400", text: "text-red-600" },
};

export default async function ShopOwnerDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login/shop?redirect=/dashboard/shop");
  if (auth.profile?.role !== "shop_owner") redirect("/");

  const [products, analytics] = await Promise.all([getMyShopProducts(), getShopAnalytics()]);
  const totalStock = products.reduce(
    (sum: number, p: any) => sum + (p.inventory ?? []).reduce((n: number, i: any) => n + i.quantity, 0),
    0
  );
  const lat = auth.profile?.latitude;
  const lng = auth.profile?.longitude;
  const hasLocation = lat != null && lng != null;
  const maxStatusCount = Math.max(1, ...analytics.statusBreakdown.map((s) => s.count));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {auth.profile?.shop_name || "My Shop"}
          </h1>
          <p className="text-sm text-slate-500">Manage your products and track stock.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/shop/orders" className="btn-outline">
            <Truck className="h-4 w-4" /> Orders
          </Link>
          <Link href="/dashboard/shop/settings" className="btn-outline">
            <Settings className="h-4 w-4" /> Shop Settings
          </Link>
          <Link href="/dashboard/shop/products/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New Product
          </Link>
        </div>
      </div>

      {!hasLocation && (
        <Link
          href="/dashboard/shop/settings"
          className="mb-6 flex items-center gap-2 rounded-lg border border-dashed border-marigold-500 bg-marigold-50 px-4 py-3 text-sm text-marigold-700 hover:bg-marigold-100 dark:bg-indigo-800 dark:text-marigold-300"
        >
          <MapPin className="h-4 w-4 shrink-0" />
          Pin your shop's location so nearby customers can find you — tap to set it up.
        </Link>
      )}

      {/* Analytics */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <div className="mb-1 flex items-center gap-1.5 text-slate-400">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="text-xs">Total Orders</span>
          </div>
          <p className="text-2xl font-semibold">{analytics.totalOrders}</p>
        </div>
        <div className="card p-5">
          <div className="mb-1 flex items-center gap-1.5 text-slate-400">
            <IndianRupee className="h-3.5 w-3.5" />
            <span className="text-xs">Revenue (Paid)</span>
          </div>
          <p className="text-2xl font-semibold text-paisley-600">₹{analytics.revenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="card p-5">
          <div className="mb-1 flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs">Paid</span>
          </div>
          <p className="text-2xl font-semibold text-paisley-600">{analytics.paid}</p>
        </div>
        <div className="card p-5">
          <div className="mb-1 flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">Unpaid</span>
          </div>
          <p className="text-2xl font-semibold text-marigold-600">{analytics.unpaid}</p>
        </div>
      </div>

      {/* Status breakdown + shop location */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Order Status Breakdown</p>
          {analytics.statusBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.statusBreakdown.map(({ status, count }) => {
                const meta = STATUS_META[status] ?? { label: status, bar: "bg-slate-300", text: "text-slate-500" };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`w-28 shrink-0 text-xs font-medium ${meta.text}`}>{meta.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted dark:bg-indigo-700">
                      <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shop Location</p>
            <Link href="/dashboard/shop/settings" className="text-xs text-indigo-600 hover:underline">Edit</Link>
          </div>
          {hasLocation ? (
            <>
              <div className="h-40 w-full px-5 pt-3">
                <div className="h-full w-full overflow-hidden rounded-lg">
                  <ShopLocationMapLoader lat={lat} lng={lng} />
                </div>
              </div>
              <div className="flex items-start gap-2 p-5 pt-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-paisley-600" />
                <span className="text-slate-600 dark:text-slate-300">{auth.profile?.shop_address || "Address not set"}</span>
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center p-5 text-center text-sm text-slate-400">
              No location pinned yet.
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-slate-400">Total Products</p>
          <p className="mt-1 text-2xl font-semibold">{products.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400">Total Stock</p>
          <p className="mt-1 text-2xl font-semibold">{totalStock}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400">Active Listings</p>
          <p className="mt-1 text-2xl font-semibold">{products.filter((p: any) => p.is_active).length}</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">You haven't listed any products yet.</p>
          <Link href="/dashboard/shop/products/new" className="btn-primary mt-4 inline-flex">
            List your first product
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const stock = (p.inventory ?? []).reduce((n: number, i: any) => n + i.quantity, 0);
                const image = p.product_images?.find((i: any) => i.is_primary)?.url ?? p.product_images?.[0]?.url;
                return (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800">
                    <td className="flex items-center gap-3 p-4">
                      <div className="relative h-10 w-10 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                        {image && <Image src={image} alt="" fill className="object-cover" />}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </td>
                    <td className="p-4">₹{p.price.toLocaleString("en-IN")}</td>
                    <td className="p-4">{stock}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-1 text-xs ${p.is_active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                        {p.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="p-4">
                      <ShopProductRowActions id={p.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  }
  
