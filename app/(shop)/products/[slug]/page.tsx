import { getProductBySlug, getProductReviews } from "@/actions/products";
import { getSimilarProducts } from "@/actions/similar";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Star } from "lucide-react";
import { AddToCartBar } from "@/components/shop/AddToCartBar";
import { ReviewList } from "@/components/shop/ReviewList";
import { SimilarProducts } from "@/components/shop/SimilarProducts";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description?.slice(0, 155),
    openGraph: {
      images: product.product_images?.[0]?.url ? [product.product_images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const reviews = await getProductReviews(product.id);
  const similar = await getSimilarProducts(
    product.id,
    (product as any).category?.slug ?? null,
    [product.brand, product.name].filter(Boolean).join(" ")
  );
  const images = product.product_images?.length ? product.product_images : [{ url: "/placeholder-product.png", id: "0" }];
  const inStock = (product.inventory ?? []).some((i: any) => i.quantity > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
            <Image src={images[0].url} alt={product.name} fill className="object-cover" priority />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.slice(0, 5).map((img: any) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && <p className="text-sm uppercase tracking-wide text-slate-400">{product.brand}</p>}
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{product.name}</h1>

          {product.rating_count > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {product.rating_avg.toFixed(1)} ({product.rating_count} reviews)
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-indigo-700 dark:text-marigold-400">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.compare_at_price && (
              <span className="text-lg text-slate-400 line-through">
                ₹{product.compare_at_price.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <p className={`mt-2 text-sm font-medium ${inStock ? "text-green-600" : "text-red-500"}`}>
            {inStock ? "In Stock" : "Out of Stock"}
          </p>

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {product.description}
            </p>
          )}

          <AddToCartBar productId={product.id} inStock={inStock} />
        </div>
      </div>

      <ReviewList productId={product.id} reviews={reviews} />

      <SimilarProducts items={similar} />
    </div>
  );
}
