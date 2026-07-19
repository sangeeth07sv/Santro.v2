"use server";

import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/utils/validation";
import { revalidatePath } from "next/cache";
import { getCart } from "./cart";
import { estimateDelivery, haversineKm, DEFAULT_SHIPPING_FEE } from "@/utils/geo";

const TAX_RATE = 0.0; // set to e.g. 0.18 for 18% GST if prices are tax-exclusive

/**
 * Creates an order from the user's current cart, validates any coupon,
 * decrements inventory, records a payment row, and clears the cart.
 * Actual payment capture (Stripe/Razorpay) happens client-side or via
 * webhook and updates the `payments` row status afterwards.
 */
export async function createOrder(formData: FormData) {
  const parsed = checkoutSchema.safeParse({
    address_id: formData.get("address_id"),
    payment_method: formData.get("payment_method"),
    coupon_code: formData.get("coupon_code") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to check out" };

  const { items, subtotal } = await getCart();
  if (items.length === 0) return { error: "Your cart is empty" };

  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", parsed.data.address_id)
    .eq("user_id", user.id)
    .single();
  if (addressError || !address) return { error: "Shipping address not found" };

  // Validate coupon
  let discount = 0;
  let couponId: string | null = null;
  if (parsed.data.coupon_code) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", parsed.data.coupon_code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon) return { error: "Invalid or expired coupon code" };
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return { error: "This coupon has expired" };
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
      return { error: "This coupon has reached its usage limit" };
    if (subtotal < coupon.min_order_amount)
      return { error: `Minimum order amount for this coupon is ₹${coupon.min_order_amount}` };

    discount = coupon.type === "percentage" ? (subtotal * coupon.value) / 100 : coupon.value;
    if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    couponId = coupon.id;
  }

  // Distance-based shipping fee — mirrors the estimate shown on the checkout
  // page. Falls back to a flat fee if we don't have coordinates for the
  // address or any shop in the cart.
  let shippingFee = DEFAULT_SHIPPING_FEE;
  if (address.latitude != null && address.longitude != null) {
    const ownerIds = Array.from(new Set(items.map((i: any) => i.product?.owner_id).filter(Boolean)));
    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from("profiles")
        .select("id, latitude, longitude")
        .in("id", ownerIds);
      const distances = (owners ?? [])
        .filter((o: any) => o.latitude != null && o.longitude != null)
        .map((o: any) => haversineKm({ lat: address.latitude, lng: address.longitude }, { lat: o.latitude, lng: o.longitude }));
      if (distances.length > 0) {
        shippingFee = estimateDelivery(Math.max(...distances)).fee;
      }
    }
  }

  const tax = Math.round((subtotal - discount) * TAX_RATE * 100) / 100;
  const total = Math.max(subtotal - discount + shippingFee + tax, 0);

  // 1. Create the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      subtotal,
      discount,
      shipping_fee: shippingFee,
      tax,
      total,
      coupon_id: couponId,
      shipping_address: address,
      status: parsed.data.payment_method === "cod" ? "confirmed" : "pending",
    })
    .select()
    .single();
  if (orderError) return { error: orderError.message };

  // 2. Snapshot order items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product?.name ?? "Unknown product",
    product_image: item.product?.product_images?.find((i: any) => i.is_primary)?.url ?? null,
    variant_key: item.variant_key,
    unit_price: item.product?.price ?? 0,
    quantity: item.quantity,
    line_total: (item.product?.price ?? 0) * item.quantity,
  }));
  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) return { error: itemsError.message };

  // 3. Decrement inventory per item via RPC (atomic)
  for (const item of items) {
    await supabase.rpc("decrement_inventory", {
      p_product_id: item.product_id,
      p_variant_key: item.variant_key,
      p_qty: item.quantity,
    });
  }

  // 4. Record coupon usage
  if (couponId) await supabase.rpc("increment_coupon_usage", { p_coupon_id: couponId });

  // 5. Create the payment record (COD is immediately "pending collection")
  await supabase.from("payments").insert({
    order_id: order.id,
    method: parsed.data.payment_method,
    status: parsed.data.payment_method === "cod" ? "pending" : "pending",
    amount: total,
  });

  // 6. Clear the cart
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
  if (cart) await supabase.from("cart_items").delete().eq("cart_id", cart.id);

  // 7. Notify the user
  await supabase.from("notifications").insert({
    user_id: user.id,
    title: "Order placed!",
    message: `Your order ${order.order_number} has been placed successfully.`,
    type: "order_update",
    link: `/dashboard/orders/${order.id}`,
  });

  revalidatePath("/dashboard/orders");
  return { success: true, orderId: order.id, requiresPayment: parsed.data.payment_method !== "cod" };
}

export async function getUserOrders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), payments(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Resolves the pickup (shop) location for an order from its first item's product owner. */
async function getPickupForOrder(supabase: any, order: any) {
  const productId = order?.order_items?.[0]?.product_id;
  if (!productId) return null;

  const { data: product } = await supabase.from("products").select("owner_id").eq("id", productId).maybeSingle();
  if (!product?.owner_id) return null;

  const { data: owner } = await supabase
    .from("profiles")
    .select("shop_name, latitude, longitude")
    .eq("id", product.owner_id)
    .maybeSingle();
  if (!owner || owner.latitude == null || owner.longitude == null) return null;

  return { lat: owner.latitude, lng: owner.longitude, label: owner.shop_name || "Pickup location" };
}

/** Single order for the customer order detail page — owner only. */
export async function getOrderById(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), payments(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;

  const pickup = await getPickupForOrder(supabase, data);
  return { ...data, pickup };
}

// ---------------- SHOP OWNER ----------------

/** Orders containing at least one of the current shop owner's products. */
export async function getMyShopOrders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Single order for the shop-owner tracking page — RLS already scopes this to their own products. */
export async function getShopOrderById(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .maybeSingle();
  if (!data) return null;

  const pickup = await getPickupForOrder(supabase, data);
  return { ...data, pickup };
}

// ---------------- DELIVERY PARTNER ----------------

/** Orders assigned to the current delivery partner. */
export async function getMyDeliveries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("delivery_partner_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Unassigned confirmed/processing orders a delivery partner can pick up. */
export async function getAvailableDeliveries() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .in("status", ["confirmed", "processing"])
    .is("delivery_partner_id", null)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function claimDelivery(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in as a delivery partner" };

  const { error } = await supabase
    .from("orders")
    .update({ delivery_partner_id: user.id, status: "shipped" })
    .eq("id", orderId)
    .is("delivery_partner_id", null);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/delivery");
  return { success: true };
}

/** Single order for the delivery tracking screen — assigned partner or admin only. */
export async function getDeliveryOrderById(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  let query = supabase.from("orders").select("*, order_items(*)").eq("id", orderId);
  if (!isAdmin) query = query.eq("delivery_partner_id", user.id);

  const { data } = await query.maybeSingle();
  if (!data) return null;

  const pickup = await getPickupForOrder(supabase, data);
  return { ...data, pickup };
}

export async function updateDeliveryStatus(orderId: string, status: "out_for_delivery" | "delivered") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in as a delivery partner" };

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("delivery_partner_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/delivery");
  return { success: true };
}

// ---------------- ADMIN ----------------

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) return { error: error.message };

  const { data: order } = await supabase.from("orders").select("user_id, order_number").eq("id", orderId).single();
  if (order) {
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      title: "Order update",
      message: `Order ${order.order_number} is now "${status}".`,
      type: "order_update",
      link: `/dashboard/orders/${orderId}`,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/orders");
  return { success: true };
}

          
