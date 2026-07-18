import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getNearbyShops,
  getFlashSaleProducts,
  getFastDeliveryProducts,
  getActiveOffers,
} from "@/actions/home";
import { getProducts } from "@/actions/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { HomeLocationGate } from "@/components/shop/HomeLocationGate";
import { NearbyShopsRail } from "@/components/shop/NearbyShopsRail";
import { CategoryRail } from "@/components/shop/CategoryRail";
import { OffersRail } from "@/components/shop/OffersRail";
import { FlashSaleSection } from "@/components/shop/FlashSaleSection";
import { FastDeliverySection } from "@/components/shop/FastDeliverySection";
import { Store, Truck, ArrowRight } from "lucide-react";

const STAFF_DASHBOARDS = [
  {
    role: "shop_owner",
    title: "Shop Owner Dashboard",
    desc: "List products, manage inventory, and view your sales.",
    href: "/dashboard/shop",
    icon: Store,
  },
  {
    role: "delivery_partner",
    title: "Delivery Partner Dashboard",
    desc: "View assigned deliveries and update order status.",
    href: "/dashboard/delivery",
    icon: Truck,
  },
];

interface PageProps {
  searchParams: Promise<{ lat?: string; lng?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const [auth, params] = await Promise.all([getCurrentUser(), searchParams]);
  const role = auth?.profile?.role;

  // Shop owners / delivery partners land on a small picker into their own
  // staff dashboards — the storefront below is for customers (and guests
  // who haven't signed in yet, so they can browse before creating an account).
  if (role === "shop_owner" || role === "delivery_partner") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Welcome back{auth?.profile?.full_name ? `, ${auth.profile.full_name}` : ""}
          </h1>
          <p className="mt-3 text-slate-500">Jump into your dashboard.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {STAFF_DASHBOARDS.filter((d) => d.role === role).map(({ title, desc, href, icon: Icon }) => (
            <Link key={href} href={href} className="card group flex flex-col items-start p-6 hover:shadow-elevated">
              <div className="mb-4 rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-slate-800">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                Open dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/products" className="text-sm font-medium text-brand-600 hover:underline">
            Browse the storefront →
          </Link>
        </div>
      </div>
    );
  }

  // ---------------- Hyperlocal storefront (customers + guests) ----------------
  const lat = params.lat ? Number(params.lat) : undefined;
  const lng = params.lng ? Number(params.lng) : undefined;
  const hasLocation = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const supabase = await createClient();
  const categoriesPromise = supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(10);

  const [{ data: categories }, flashSaleProducts, { products: allProducts }, offers, nearbyShops, fastDeliveryProducts] =
    await Promise.all([
      categoriesPromise,
      getFlashSaleProducts(),
      getProducts({ pageSize: 12 }),
      getActiveOffers(),
      hasLocation ? getNearbyShops(lat!, lng!) : Promise.resolve([]),
      hasLocation ? getFastDeliveryProducts(lat!, lng!) : Promise.resolve([]),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {auth?.profile?.full_name ? `Hi, ${auth.profile.full_name} 👋` : "Everything, sorted."}
        </h1>
        <p className="text-sm text-slate-500">Shop from local stores near you, delivered fast.</p>
      </div>

      <HomeLocationGate />

      {hasLocation && <NearbyShopsRail shops={nearbyShops} />}

      {categories && categories.length > 0 && <CategoryRail categories={categories} />}

      <FlashSaleSection products={flashSaleProducts as any} />

      {offers.length > 0 && <OffersRail offers={offers as any} />}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          All Products
        </h2>
        {allProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
            No products yet — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {allProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {hasLocation && <FastDeliverySection products={fastDeliveryProducts as any} />}

      <div className="mt-10 text-center">
        <Link href="/products" className="text-sm font-medium text-brand-600 hover:underline">
          View all products →
        </Link>
      </div>
    </div>
  );
            }
