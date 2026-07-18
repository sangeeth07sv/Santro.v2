import Link from "next/link";
import { Zap } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/types/database";

interface FastDeliveryProduct extends Product {
  etaMinutes: number;
}

export function FastDeliverySection({ products }: { products: FastDeliveryProduct[] }) {
  if (!products.length) return null;

  const fastest = Math.min(...products.map((p) => p.etaMinutes));

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Fast delivery near you</h2>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Zap className="h-3.5 w-3.5" /> from {fastest} min
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="flex flex-col gap-1.5">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Zap className="h-3 w-3" /> ~{product.etaMinutes} min
            </span>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link href="/products" className="text-sm font-medium text-brand-600 hover:underline">
          View all products →
        </Link>
      </div>
    </section>
  );
}
