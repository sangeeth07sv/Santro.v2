import { Suspense } from "react";
import { getProducts } from "@/actions/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGridSkeleton } from "@/components/shop/ProductCardSkeleton";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { Pagination } from "@/components/shop/Pagination";
import { LocationGate } from "@/components/shop/LocationGate";
import { NearbyShopsMapLoader } from "@/components/shop/NearbyShopsMapLoader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop All Products" };

interface PageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    owner?: string;
    sort?: string;
    page?: string;
    lat?: string;
    lng?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const lat = params.lat ? Number(params.lat) : undefined;
  const lng = params.lng ? Number(params.lng) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">
        {params.search ? `Results for "${params.search}"` : "All Products"}
      </h1>

      <LocationGate />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
        <FilterSidebar />
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductResults params={params} lat={lat} lng={lng} />
        </Suspense>
      </div>
    </div>
  );
}

async function ProductResults({
  params,
  lat,
  lng,
}: {
  params: PageProps["searchParams"] extends Promise<infer T> ? T : never;
  lat?: number;
  lng?: number;
}) {
  const page = Number(params.page) || 1;
  const { products, total, pageSize } = await getProducts({
    category: params.category,
    search: params.search,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    owner: params.owner,
    sort: (params.sort as any) || "newest",
    page,
    lat,
    lng,
  });

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
        No products found. Try adjusting your filters.
      </div>
    );
  }

  // Only worth a map if we actually know where the customer is and at least
  // one result has a shop location to plot.
  const shopsWithLocation = products.filter((p: any) => p.owner?.latitude != null && p.owner?.longitude != null);
  const showMap = lat != null && lng != null && shopsWithLocation.length > 0;

  return (
    <div>
      {showMap && (
        <div className="mb-6 h-80 w-full overflow-hidden rounded-xl border border-surface-muted dark:border-indigo-700">
          <NearbyShopsMapLoader userLat={lat!} userLng={lng!} products={products} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination currentPage={page} totalPages={Math.ceil(total / pageSize)} />
    </div>
  );
    }

