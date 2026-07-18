import { getCurrentUser } from "@/actions/auth";
import { getMyShopProducts } from "@/actions/products";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Package } from "lucide-react";

export const metadata = { title: "Shop Dashboard" };

export default async function ShopOwnerDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login?redirect=/dashboard/shop");
  if (auth.profile?.role !== "shop_owner") redirect("/");

  const products = await getMyShopProducts();
  const totalStock = products.reduce(
    (sum: number, p: any) => sum + (p.inventory ?? []).reduce((n: number, i: any) => n + i.quantity, 0),
    0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {auth.profile?.shop_name || "My Shop"}
          </h1>
          <p className="text-sm text-slate-500">Manage your products and track stock.</p>
        </div>
        <Link href="/dashboard/shop/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Product
        </Link>
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
