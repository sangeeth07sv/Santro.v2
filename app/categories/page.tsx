import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";

export const metadata = { title: "Browse Categories" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Browse Categories</h1>

      {!categories || categories.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No categories available yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="card group flex flex-col items-center p-5 text-center hover:shadow-elevated"
            >
              <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-full bg-brand-50 dark:bg-slate-800">
                {c.image_url ? (
                  <Image src={c.image_url} alt="" fill className="object-cover" />
                ) : (
                  <Tag className="absolute inset-0 m-auto h-6 w-6 text-brand-600" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.name}</p>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">{c.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
