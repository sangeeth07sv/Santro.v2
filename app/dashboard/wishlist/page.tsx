import { getWishlist } from "@/actions/cart";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login?redirect=/dashboard/wishlist");

  const products = await getWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-ink dark:text-white">Wishlist</h1>
      {products.length === 0 ? (
        <div className="card p-12 text-center text-ink/40">
          Nothing saved yet — tap the heart on any product to add it here.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
