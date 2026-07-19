import { getCurrentUser } from "@/actions/auth";
import { getProductById } from "@/actions/products";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditProductForm } from "@/components/shop/EditProductForm";

export const metadata = { title: "Edit Product" };

export default async function EditShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) redirect(`/login/shop?redirect=/dashboard/shop/products/${id}/edit`);
  if (auth.profile?.role !== "shop_owner") redirect("/");

  const product = await getProductById(id);
  if (!product) notFound();
  if ((product as any).owner_id !== auth.user.id) redirect("/dashboard/shop");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">Edit Product</h1>
      <p className="mb-6 text-sm text-slate-500">Update details for "{product.name}".</p>
      <EditProductForm product={product as any} categories={categories ?? []} />
    </div>
  );
}
