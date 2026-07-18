import Image from "next/image";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";

export function ShopResultCard({ product }: { product: any }) {
  const image =
    product.product_images?.find((i: any) => i.is_primary)?.url ?? product.product_images?.[0]?.url ?? "/placeholder-product.png";
  const gmapsUrl =
    product.owner?.latitude != null && product.owner?.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${product.owner.latitude},${product.owner.longitude}`
      : null;

  return (
    <div className="card flex gap-3 p-3">
      <Link href={`/products/${product.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted dark:bg-indigo-700">
        <Image src={image} alt={product.name} fill sizes="80px" className="object-cover" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/products/${product.slug}`} className="line-clamp-1 text-sm font-semibold text-ink dark:text-white">
          {product.name}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink/50 dark:text-slate-400">
          {product.owner?.shop_name ?? "Local shop"}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60 dark:text-slate-400">
          {product.rating_count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {product.rating_avg.toFixed(1)}
            </span>
          )}
          {typeof product.distance_km === "number" && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {product.distance_km.toFixed(1)} km
            </span>
          )}
          <span className="price-tag py-0.5 text-xs">₹{product.price.toLocaleString("en-IN")}</span>
        </div>

        <div className="mt-2 flex gap-2">
          <Link href={`/products/${product.slug}`} className="btn-outline px-3 py-1.5 text-xs">
            View
          </Link>
          {gmapsUrl && (
            <a href={gmapsUrl} target="_blank" rel="noreferrer" className="btn-outline px-3 py-1.5 text-xs">
              Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
