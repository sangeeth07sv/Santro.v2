import Link from "next/link";
import type { SimilarItem } from "@/actions/similar";

export function SimilarProducts({ items }: { items: SimilarItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold text-ink dark:text-white">Similar products</h2>
      <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
        {items.map((item) =>
          item.source === "catalog" && item.slug ? (
            <Link
              key={item.id}
              href={`/products/${item.slug}`}
              className="card w-40 shrink-0 snap-start overflow-hidden"
            >
              <div className="relative aspect-square bg-surface-muted dark:bg-indigo-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-2.5">
                <p className="line-clamp-2 text-xs font-medium text-ink dark:text-slate-100">{item.name}</p>
                {item.price != null && <span className="price-tag mt-1.5">₹{item.price.toLocaleString("en-IN")}</span>}
              </div>
            </Link>
          ) : (
            <div key={item.id} className="w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-dashed border-surface-muted dark:border-indigo-700">
              <div className="relative aspect-square bg-surface-muted dark:bg-indigo-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover opacity-90" loading="lazy" />
              </div>
              <div className="p-2.5">
                <p className="line-clamp-2 text-xs text-ink/60 dark:text-slate-400">{item.name}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-ink/30 dark:text-slate-500">Similar style · Google Images</p>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
