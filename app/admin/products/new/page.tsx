import { createClient } from "@/lib/supabase/server";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

export const metadata = { title: "Admin · New Product" };

export default async function AdminNewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">New Product</h1>
      <AdminProductForm categories={categories ?? []} />
    </div>
  );
}
