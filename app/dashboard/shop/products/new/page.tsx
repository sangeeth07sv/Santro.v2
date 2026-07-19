import { getCurrentUser } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewProductForm } from "@/components/shop/NewProductForm";

export const metadata = { title: "New Product" };

export default async function NewShopProductPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login/shop?redirect=/dashboard/shop/products/new");
  if (auth.profile?.role !== "shop_owner") redirect("/");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">List a New Product</h1>
      <p className="mb-6 text-sm text-slate-500">This will appear in your shop dashboard and the public catalog.</p>
      <NewProductForm categories={categories ?? []} />
    </div>
  );
}
