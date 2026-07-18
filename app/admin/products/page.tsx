import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { Plus } from "lucide-react";

export const metadata = { title: "Admin · Products" };

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(url, is_primary), inventory(quantity)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Product
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-800">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p: any) => {
              const stock = (p.inventory ?? []).reduce((n: number, i: any) => n + i.quantity, 0);
              const image = p.product_images?.find((i: any) => i.is_primary)?.url ?? p.product_images?.[0]?.url;
              return (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800">
                  <td className="flex items-center gap-3 p-4">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {image && <Image src={image} alt="" fill className="object-cover" />}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{p.name}</span>
                  </td>
                  <td className="p-4">₹{p.price.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <span className={stock <= 5 ? "text-red-500" : "text-slate-600 dark:text-slate-300"}>{stock}</span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-1 text-xs ${p.is_active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                      {p.is_active ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-indigo-600 hover:underline">Edit</Link>
                    <DeleteProductButton id={p.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
