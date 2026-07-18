import { createClient } from "@/lib/supabase/server";
import { getProductById } from "@/actions/products";
import { notFound } from "next/navigation";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

export const metadata = { title: "Admin · Edit Product" };

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [product, { data: categories }] = await Promise.all([
    getProductById(id),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Edit Product</h1>
      <AdminProductForm categories={categories ?? []} product={product} />
    </div>
  );
}
