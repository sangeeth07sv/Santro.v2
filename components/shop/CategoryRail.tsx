import Link from "next/link";
import Image from "next/image";
import { Tag, ArrowRight } from "lucide-react";

interface CategoryRailProps {
  categories: { id: string; name: string; slug: string; image_url: string | null }[];
}

export function CategoryRail({ categories }: CategoryRailProps) {
  if (!categories.length) return null;

  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-indigo-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Shop by Category</h2>
        <Link href="/categories" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-y-4 sm:grid-cols-6 md:grid-cols-8">
        {categories.map((c) => (
          <Link key={c.id} href={`/products?category=${c.slug}`} className="flex flex-col items-center gap-2 text-center">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-100 bg-surface-muted dark:border-slate-700 dark:bg-indigo-700">
              {c.image_url ? (
                <Image src={c.image_url} alt="" fill className="object-cover" sizes="56px" />
              ) : (
                <Tag className="absolute inset-0 m-auto h-5 w-5 text-brand-600" />
              )}
            </div>
            <p className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-700 dark:text-slate-200">{c.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
