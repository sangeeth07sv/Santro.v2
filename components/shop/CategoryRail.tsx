import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";

interface CategoryRailProps {
  categories: { id: string; name: string; slug: string; image_url: string | null }[];
}

export function CategoryRail({ categories }: CategoryRailProps) {
  if (!categories.length) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Categories</h2>
      <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
        {categories.map((c) => (
          <Link key={c.id} href={`/products?category=${c.slug}`} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-brand-50 shadow-card dark:bg-slate-800">
              {c.image_url ? (
                <Image src={c.image_url} alt="" fill className="object-cover" sizes="64px" />
              ) : (
                <Tag className="absolute inset-0 m-auto h-6 w-6 text-brand-600" />
              )}
            </div>
            <p className="line-clamp-2 text-xs font-medium text-slate-700 dark:text-slate-200">{c.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
