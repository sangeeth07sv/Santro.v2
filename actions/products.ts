"use server";

import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/utils/validation";
import { revalidatePath } from "next/cache";

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
}

/** Public product listing with search, filters, and pagination (used by Server Components). */
export async function getProducts(filters: ProductFilters = {}) {
  const supabase = await createClient();
  const { category, search, minPrice, maxPrice, sort = "newest", page = 1, pageSize = 12 } = filters;

  let query = supabase
    .from("products")
    .select("*, product_images(*), category:categories(name, slug)", { count: "exact" })
    .eq("is_active", true);

  if (category) query = query.eq("category.slug", category);
  if (search) query = query.textSearch("search_vector", search, { type: "websearch" });
  if (minPrice !== undefined) query = query.gte("price", minPrice);
  if (maxPrice !== undefined) query = query.lte("price", maxPrice);

  switch (sort) {
    case "price_asc": query = query.order("price", { ascending: true }); break;
    case "price_desc": query = query.order("price", { ascending: false }); break;
    case "rating": query = query.order("rating_avg", { ascending: false }); break;
    default: query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { products: data ?? [], total: count ?? 0, page, pageSize };
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
    category_id: raw.category_id || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const quantity = Math.max(0, Number(raw.quantity) || 0);
  const imageUrl = typeof raw.image_url === "string" ? raw.image_url.trim() : "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in as a shop owner" };

  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed.data, owner_id: user.id })
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
    category_id: raw.category_id || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const quantity = Math.max(0, Number(raw.quantity) || 0);
  const imageUrl = typeof raw.image_url === "string" ? raw.image_url.trim() : "";

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(parsed.data).select().single();
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
    category_id: raw.category_id || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id);
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
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
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
    
