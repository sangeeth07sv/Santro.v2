"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addToCart, toggleWishlist } from "@/actions/cart";
import type { Product } from "@/types/database";
import { cn } from "@/utils/cn";

export function ProductCard({ product, wishlisted = false }: { product: Product; wishlisted?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [isWishlisted, setIsWishlisted] = useState(wishlisted);

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ??
    product.product_images?.[0]?.url ??
    "/placeholder-product.png";

  const discountPct =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(100 - (product.price / product.compare_at_price) * 100)
      : null;

  function handleAddToCart() {
    startTransition(async () => {
      const res = await addToCart(product.id);
      if (res?.error) toast.error(res.error);
      else toast.success("Added to cart");
    });
  }

  function handleWishlist() {
    setIsWishlisted((prev) => !prev); // optimistic
    startTransition(async () => {
      const res = await toggleWishlist(product.id);
      if (res?.error) {
        setIsWishlisted((prev) => !prev); // revert
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition-shadow hover:shadow-elevated dark:border-slate-700 dark:bg-indigo-800">
      <button
        onClick={handleWishlist}
        aria-label="Toggle wishlist"
        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 shadow-card dark:bg-slate-800/90"
      >
        <Heart className={cn("h-3.5 w-3.5", isWishlisted ? "fill-marigold-500 text-marigold-500" : "text-slate-400")} />
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-muted dark:bg-indigo-700">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="border-t border-slate-100 p-2.5 dark:border-slate-700">
          {product.brand && <p className="text-[10px] uppercase tracking-wide text-ink/40">{product.brand}</p>}
          <h3 className="line-clamp-2 text-xs font-medium leading-tight text-ink dark:text-slate-100">{product.name}</h3>

          {product.rating_count > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <span className="flex items-center gap-0.5 rounded bg-paisley-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {product.rating_avg.toFixed(1)} <Star className="h-2.5 w-2.5 fill-white" />
              </span>
              <span className="text-[10px] text-ink/40">({product.rating_count})</span>
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-sm font-bold text-ink dark:text-white">₹{product.price.toLocaleString("en-IN")}</span>
            {product.compare_at_price && (
              <span className="text-[11px] text-ink/40 line-through">
                ₹{product.compare_at_price.toLocaleString("en-IN")}
              </span>
            )}
            {discountPct && <span className="text-[11px] font-semibold text-paisley-600">{discountPct}% off</span>}
          </div>
        </div>
      </Link>

      <div className="px-2.5 pb-2.5">
        <button
          onClick={handleAddToCart}
          disabled={isPending}
          className="w-full rounded-md bg-marigold-500 py-1.5 text-xs font-semibold text-indigo-900 transition-colors hover:bg-marigold-300 disabled:opacity-60"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
