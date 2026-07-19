"use server";

import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/utils/validation";
import { revalidatePath } from "next/cache";
import { haversineKm } from "@/utils/geo";

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  owner?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "nearby";
  page?: number;
  pageSize?: number;
  /** Customer's current position — when supplied, each product gets owner shop
   *  location + distance_km attached so results can be plotted on a map. */
  lat?: number;
  lng?: number;
}

/** Public product listing with search, filters, and pagination (used by Server Components). */
export async function getProducts(filters: ProductFilters = {}) {
  const supabase = await createClient();
  const { category, search, minPrice, maxPrice, owner, sort = "newest", page = 1, pageSize = 12, lat, lng } = filters;
  const hasLocation = lat != null && lng != null;

  let query = supabase
    .from("products")
    .select(
      "*, product_images(*), category:categories(name, slug), owner:profiles!products_owner_id_fkey(shop_name, latitude, longitude)",
      { count: "exact" }
    )
    .eq("is_active", true);

  if (category) query = query.eq("category.slug", category);
  if (owner) query = query.eq("owner_id", owner);
  if (search) query = query.textSearch("search_vector", search, { type: "websearch" });
  if (minPrice !== undefined) query = query.gte("price", minPrice);
  if (maxPrice !== undefined) query = query.lte("price", maxPrice);

  // "Nearby" sorts by distance, which isn't a DB column — we compute it in JS
  // (same Haversine approach as the rest of the app, see actions/home.ts), so
  // pull a wider, unpaginated batch here and paginate after sorting below.
  const sortingByDistance = sort === "nearby" && hasLocation;

  switch (sort) {
    case "price_asc": query = query.order("price", { ascending: true }); break;
    case "price_desc": query = query.order("price", { ascending: false }); break;
    case "rating": query = query.order("rating_avg", { ascending: false }); break;
    case "nearby": query = query.order("created_at", { ascending: false }); break; // re-sorted below if we have a location
    default: query = query.order("created_at", { ascending: false });
  }

  // Distance-sorted results need every matching row in hand before we can order
  // and page them, so skip the DB-level range() in that case (capped at 200 —
  // fine at current scale, same tradeoff getNearbyShops in actions/home.ts makes).
  if (!sortingByDistance) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  } else {
    query = query.limit(200);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  let products = data ?? [];

  if (hasLocation) {
    products = products.map((p: any) => ({
      ...p,
      distance_km:
        p.owner?.latitude != null && p.owner?.longitude != null
          ? Math.round(haversineKm({ lat: lat!, lng: lng! }, { lat: p.owner.latitude, lng: p.owner.longitude }) * 10) / 10
          : null,
    }));
  }

  if (sortingByDistance) {
    products = products.sort((a: any, b: any) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    const total = products.length;
    const from = (page - 1) * pageSize;
    products = products.slice(from, from + pageSize);
    return { products, total, page, pageSize };
  }

  return { products, total: count ?? 0, page, pageSize };
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(name, slug), inventory(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

export async function getFeaturedProducts(limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(limit);
  return data ?? [];
}

export async function getProductReviews(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, profile:profiles(full_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Fire-and-forget view counter for the Trending rail. Never throws to the caller. */
export async function incrementProductView(productId: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_product_view", { p_product_id: productId });
  } catch {
    // trending is a nice-to-have; a failed increment shouldn't break the product page
  }
}

// ---------------- SHOP OWNER ----------------

/** Products belonging to the current shop owner (RLS also enforces this). */
export async function getMyShopProducts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, is_primary), inventory(quantity)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Creates a product owned by the currently signed-in shop owner. */
export async function createShopProduct(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "true",
    is_featured: false,
    is_flash_sale: raw.is_flash_sale === "true",
    flash_sale_ends_at: raw.flash_sale_ends_at || null,
    category_id: raw.category_id || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const quantity = Math.max(0, Number(raw.quantity) || 0);
  const imageUrl = typeof raw.image_url === "string" ? raw.image_url.trim() : "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in as a shop owner" };

  const { flash_sale_ends_at, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...rest,
      // flash sale only makes sense with a real end time; drop the flag if none was given
      is_flash_sale: rest.is_flash_sale && !!flash_sale_ends_at,
      flash_sale_ends_at: flash_sale_ends_at ? new Date(flash_sale_ends_at).toISOString() : null,
      owner_id: user.id,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  const { error: invError } = await supabase
    .from("inventory")
    .insert({ product_id: data.id, variant_key: "default", quantity });
  if (invError) return { error: `Product created, but stock could not be saved: ${invError.message}` };

  if (imageUrl) {
    const { error: imgError } = await supabase
      .from("product_images")
      .insert({ product_id: data.id, url: imageUrl, is_primary: true });
    if (imgError) return { error: `Product created, but image could not be saved: ${imgError.message}` };
  }

  revalidatePath("/dashboard/shop");
  return { success: true, product: data };
}

// ---------------- ADMIN CRUD ----------------

export async function createProduct(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "true",
    is_featured: raw.is_featured === "true",
    is_flash_sale: raw.is_flash_sale === "true",
    flash_sale_ends_at: raw.flash_sale_ends_at || null,
    category_id: raw.category_id || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const quantity = Math.max(0, Number(raw.quantity) || 0);
  const imageUrl = typeof raw.image_url === "string" ? raw.image_url.trim() : "";

  const supabase = await createClient();
  const { flash_sale_ends_at, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...rest,
      is_flash_sale: rest.is_flash_sale && !!flash_sale_ends_at,
      flash_sale_ends_at: flash_sale_ends_at ? new Date(flash_sale_ends_at).toISOString() : null,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  // seed a default inventory row
  const { error: invError } = await supabase
    .from("inventory")
    .insert({ product_id: data.id, variant_key: "default", quantity });
  if (invError) return { error: `Product created, but stock could not be saved: ${invError.message}` };

  if (imageUrl) {
    const { error: imgError } = await supabase
      .from("product_images")
      .insert({ product_id: data.id, url: imageUrl, is_primary: true });
    if (imgError) return { error: `Product created, but image could not be saved: ${imgError.message}` };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, product: data };
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), inventory(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function updateProduct(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.partial().safeParse({
    ...raw,
    is_active: raw.is_active === "true",
    is_featured: raw.is_featured === "true",
    is_flash_sale: raw.is_flash_sale === "true",
    flash_sale_ends_at: raw.flash_sale_ends_at || null,
    category_id: raw.category_id || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { flash_sale_ends_at, ...rest } = parsed.data;
  const updatePayload: Record<string, unknown> = { ...rest };
  if (raw.flash_sale_ends_at !== undefined) {
    updatePayload.flash_sale_ends_at = flash_sale_ends_at ? new Date(flash_sale_ends_at).toISOString() : null;
    updatePayload.is_flash_sale = !!rest.is_flash_sale && !!flash_sale_ends_at;
  }
  const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
  if (error) return { error: error.message };

  if (raw.quantity !== undefined && raw.quantity !== "") {
    const quantity = Math.max(0, Number(raw.quantity) || 0);
    await supabase
      .from("inventory")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("product_id", id)
      .eq("variant_key", "default");
  }

  const imageUrl = typeof raw.image_url === "string" ? raw.image_url.trim() : "";
  if (imageUrl) {
    const { data: existing } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", id)
      .eq("is_primary", true)
      .maybeSingle();

    if (existing) {
      await supabase.from("product_images").update({ url: imageUrl }).eq("id", existing.id);
    } else {
      await supabase.from("product_images").insert({ product_id: id, url: imageUrl, is_primary: true });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/dashboard/shop");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/dashboard/shop");
  return { success: true };
}

export async function updateInventory(productId: string, variantKey: string, quantity: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("product_id", productId)
    .eq("variant_key", variantKey);

  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: true };
    }




                        
