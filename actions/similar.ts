"use server";

import { createClient } from "@/lib/supabase/server";

export interface SimilarItem {
  id: string;
  name: string;
  slug: string | null; // null when it's a Google Images suggestion, not a real listing
  price: number | null;
  imageUrl: string;
  source: "catalog" | "google";
}

/**
 * Related products for the "Similar products" rail on the product detail page.
 * 1. Pulls real listings from the same category first (these are clickable, purchasable).
 * 2. If the catalog doesn't have enough (common while the store is still filling up),
 *    pads the rest with Google Image Search results for the product name/category —
 *    shown as visual inspiration only, clearly labeled, not linked to checkout.
 *
 * Requires GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX (Google Programmable Search Engine,
 * image search enabled) in env. Falls back to catalog-only if unset.
 */
export async function getSimilarProducts(
  productId: string,
  categorySlug: string | null,
  queryTerm: string,
  limit = 8
): Promise<SimilarItem[]> {
  const supabase = await createClient();

  let catalogItems: SimilarItem[] = [];
  if (categorySlug) {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, product_images(url, is_primary), category:categories!inner(slug)")
      .eq("is_active", true)
      .eq("category.slug", categorySlug)
      .neq("id", productId)
      .limit(limit);

    catalogItems = (data ?? [])
      .filter((p: any) => p.product_images?.length)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        imageUrl: p.product_images.find((i: any) => i.is_primary)?.url ?? p.product_images[0].url,
        source: "catalog" as const,
      }));
  }

  const remaining = limit - catalogItems.length;
  if (remaining <= 0) return catalogItems;

  const googleItems = await fetchGoogleImageSuggestions(queryTerm, remaining);
  return [...catalogItems, ...googleItems];
}

async function fetchGoogleImageSuggestions(query: string, count: number): Promise<SimilarItem[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx || !query) return [];

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", String(Math.min(count, 10)));
    url.searchParams.set("safe", "active");

    const res = await fetch(url.toString(), { next: { revalidate: 60 * 60 * 24 } }); // cache 24h
    if (!res.ok) return [];
    const json = await res.json();

    return (json.items ?? []).map((item: any, i: number) => ({
      id: `google-${i}-${item.link}`,
      name: item.title ?? query,
      slug: null,
      price: null,
      imageUrl: item.link,
      source: "google" as const,
    }));
  } catch {
    return []; // never let a flaky external API break the product page
  }
        }
