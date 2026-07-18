"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/actions/auth";

async function getOrCreateCartId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: existing } = await supabase.from("carts").select("id").eq("user_id", userId).single();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id;
}

export async function addToCart(productId: string, quantity = 1, variantKey = "default") {
  const supabase = await createClient();
  const auth = await getCurrentUser();
  const user = auth?.user;
  if (!user) return { error: "Please sign in to add items to your cart" };

  const cartId = await getOrCreateCartId(supabase, user.id);

  // Upsert: if the same product+variant is already in the cart, bump quantity.
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .eq("variant_key", variantKey)
    .maybeSingle();

  if (existingItem) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, product_id: productId, variant_key: variantKey, quantity });
    if (error) return { error: error.message };
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const supabase = await createClient();
  if (quantity < 1) return removeCartItem(itemId);

  const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
  if (error) return { error: error.message };

  revalidatePath("/cart");
  return { success: true };
}

export async function removeCartItem(itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
  if (error) return { error: error.message };

  revalidatePath("/cart");
  return { success: true };
}

export async function getCart() {
  const supabase = await createClient();
  const auth = await getCurrentUser();
  const user = auth?.user;
  if (!user) return { items: [], subtotal: 0 };

  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
  if (!cart) return { items: [], subtotal: 0 };

  const { data: items } = await supabase
    .from("cart_items")
    .select("*, product:products(id, name, slug, price, product_images(url, is_primary))")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  const list = items ?? [];
  const subtotal = list.reduce((sum: number, item: any) => sum + item.quantity * (item.product?.price ?? 0), 0);

  return { items: list, subtotal };
}

export async function getWishlist() {
  const supabase = await createClient();
  const auth = await getCurrentUser();
  const user = auth?.user;
  if (!user) return [];

  const { data } = await supabase
    .from("wishlists")
    .select("id, product:products(*, product_images(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: any) => row.product).filter(Boolean);
}

export async function toggleWishlist(productId: string) {
  const supabase = await createClient();
  const auth = await getCurrentUser();
  const user = auth?.user;
  if (!user) return { error: "Please sign in to use your wishlist" };

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    revalidatePath("/dashboard/wishlist");
    return { success: true, wishlisted: false };
  }

  await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
  revalidatePath("/dashboard/wishlist");
  return { success: true, wishlisted: true };
    }
    
