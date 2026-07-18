"use server";

import { createClient } from "@/lib/supabase/server";
import { haversineKm, estimateDelivery } from "@/utils/geo";

export interface NearbyShop {
  ownerId: string;
  shopName: string;
  shopAddress: string | null;
  distanceKm: number;
  etaMinutes: number;
  productCount: number;
}

/**
 * Shop owners within `radiusKm` of the given point, nearest first.
 * Distance is computed in JS (Haversine) rather than in SQL — there's no
 * PostGIS extension enabled (see migration 003), so this fetches shop-owner
 * profiles with coordinates and filters/sorts in the app layer. Fine at
 * current scale; would need a bounding-box pre-filter or PostGIS if the
 * number of shop owners grows large.
 *
 * NOTE: there is no shop hours / open-closed data in the schema, so this
 * intentionally does not show an "Open/Closed" badge — that would be fake.
 */
export async function getNearbyShops(
  lat: number,
  lng: number,
  radiusKm = 10,
  limit = 12
): Promise<NearbyShop[]> {
  const supabase = await createClient();
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, shop_name, shop_address, latitude, longitude")
    .eq("role", "shop_owner")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (!owners?.length) return [];

  const withDistance = owners
    .map((o) => ({
      ownerId: o.id as string,
      shopName: o.shop_name || "Local shop",
      shopAddress: o.shop_address as string | null,
      distanceKm: haversineKm({ lat, lng }, { lat: o.latitude as number, lng: o.longitude as number }),
    }))
    .filter((o) => o.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  if (!withDistance.length) return [];

  const { data: counts } = await supabase
    .from("products")
    .select("owner_id")
    .in("owner_id", withDistance.map((o) => o.ownerId))
    .eq("is_active", true);

  const countByOwner = new Map<string, number>();
  for (const row of counts ?? []) {
    const key = row.owner_id as string;
    countByOwner.set(key, (countByOwner.get(key) ?? 0) + 1);
  }

  return withDistance.map((o) => ({
    ...o,
    distanceKm: Math.round(o.distanceKm * 10) / 10,
    etaMinutes: estimateDelivery(o.distanceKm).etaMinutes,
    productCount: countByOwner.get(o.ownerId) ?? 0,
  }));
}

/** Active flash-sale products with a real, still-future end time. */
export async function getFlashSaleProducts(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(name, slug)")
    .eq("is_active", true)
    .eq("is_flash_sale", true)
    .not("flash_sale_ends_at", "is", null)
    .gt("flash_sale_ends_at", new Date().toISOString())
    .order("flash_sale_ends_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}

/**
 * "Trending" ranked by real view_count (see migration 006), not a fake
 * heuristic. Optionally scoped to shops within `radiusKm` of a point when
 * lat/lng are supplied, since this is meant to be "trending nearby."
 */
export async function getTrendingProducts(
  opts: { lat?: number; lng?: number; radiusKm?: number; limit?: number } = {}
) {
  const { lat, lng, radiusKm = 10, limit = 12 } = opts;
  const supabase = await createClient();

  if (lat != null && lng != null) {
    const nearbyOwnerIds = (await getNearbyShops(lat, lng, radiusKm, 50)).map((s) => s.ownerId);
    if (!nearbyOwnerIds.length) return [];

    const { data } = await supabase
      .from("products")
      .select("*, product_images(*), category:categories(name, slug)")
      .eq("is_active", true)
      .in("owner_id", nearbyOwnerIds)
      .order("view_count", { ascending: false })
      .limit(limit);
    return data ?? [];
  }

  // No location yet — fall back to global trending so the section isn't empty.
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(name, slug)")
    .eq("is_active", true)
    .order("view_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/**
 * Products from shops close enough for a genuinely fast delivery estimate,
 * using the same distance/ETA formula as checkout (utils/geo.ts) — the
 * minutes shown here are the same minutes the customer will see at checkout.
 */
export async function getFastDeliveryProducts(
  lat: number,
  lng: number,
  opts: { maxEtaMinutes?: number; limit?: number } = {}
) {
  const { maxEtaMinutes = 30, limit = 12 } = opts;
  const supabase = await createClient();

  const nearby = (await getNearbyShops(lat, lng, 15, 50)).filter(
    (s) => s.etaMinutes <= maxEtaMinutes
  );
  if (!nearby.length) return [];

  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(name, slug)")
    .eq("is_active", true)
    .in("owner_id", nearby.map((s) => s.ownerId))
    .order("created_at", { ascending: false })
    .limit(limit);

  const etaByOwner = new Map(nearby.map((s) => [s.ownerId, s.etaMinutes]));
  return (data ?? []).map((p: any) => ({ ...p, etaMinutes: etaByOwner.get(p.owner_id) ?? maxEtaMinutes }));
}

/**
 * Active coupons for the homepage "Offers" rail. NOTE: coupons in this
 * schema are global (no shop_id column on the coupons table) — so despite
 * the "nearby offers" framing in the product spec, these are simply all
 * active, unexpired offers, not offers scoped to nearby shops specifically.
 */
export async function getActiveOffers(limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
      }
  
